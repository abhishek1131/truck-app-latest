import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { verify } from "jsonwebtoken";
import bcrypt from "bcrypt";

interface UserResponse {
  success: boolean;
  data?: {
    users: {
      id: string;
      first_name: string;
      last_name: string;
      email: string;
      phone: string | null;
      role: "super_admin" | "company_admin" | "technician";
      status: "active" | "inactive" | "pending" | "suspended";
      created_at: string;
      updated_at: string | null;
      assigned_trucks: {
        id: string;
        truck_number: string;
        make: string;
        model: string;
      }[];
    }[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
    statistics: {
      totalUsers: number;
      totalTechnicians: number;
      totalAdministrators: number;
      activeTechnicians: number;
      inactiveTechnicians: number;
    };
  };
  error?: string;
  code?: string;
}

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: No token provided",
          code: "UNAUTHORIZED",
        },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];
    let decoded: { id: string; role: string };
    try {
      decoded = verify(token, process.env.JWT_SECRET as string) as {
        id: string;
        role: string;
      };
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Invalid token",
          code: "INVALID_TOKEN",
        },
        { status: 401 }
      );
    }
    console.log("decoded", decoded);
    // Get current user details for role-based filtering
    const [currentUserRows] = await pool.query(
      `SELECT role, company_name FROM users WHERE id = ?`,
      [decoded.id]
    );
    const currentUser = (currentUserRows as any[])[0];
    
    if (!currentUser || (currentUser.role !== "super_admin" && currentUser.role !== "company_admin")) {
      return NextResponse.json(
        { success: false, error: "Forbidden", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    const isSuperAdmin = currentUser.role === "super_admin";
    const userCompany = currentUser.company_name;

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "";
    const status = searchParams.get("status") || "";

    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        u.id, u.first_name, u.last_name, u.email, u.phone, u.role, u.status, u.company_name, u.created_by, u.created_at, u.updated_at,
        t.id AS truck_id, t.truck_number, t.make, t.model
      FROM users u
      LEFT JOIN trucks t ON t.assigned_to = u.id
      WHERE 1=1
    `;

    const params: any[] = [];

    // Apply role-based filtering
    if (isSuperAdmin) {
      // Super admin can see company_admin and technician users
      // But if role filter is super_company_admin, allow super_admin users too
      if (role === "super_company_admin") {
        query += ` AND u.role IN ('super_admin', 'company_admin')`;
      } else {
        query += ` AND u.role IN ('company_admin', 'technician')`;
      }
    } else {
      // Company admin can only see technicians
      query += ` AND (u.company_name = ? OR u.created_by = ?)`;
      params.push(userCompany, decoded.id);
      
      if (currentUser.role === "company_admin") {
        query += ` AND u.role = 'technician'`;
      }
    }

    if (search) {
      query += ` AND (u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ? OR u.id LIKE ?)`;
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam, searchParam);
    }

    if (role) {
      if (role === "super_company_admin") {
        query += ` AND u.role IN ('super_admin', 'company_admin')`;
      } else {
        query += ` AND u.role = ?`;
        params.push(role);
      }
    }

    if (status) {
      query += ` AND u.status = ?`;
      params.push(status);
    }

    // Add custom ordering for super_company_admin role filter
    if (role === "super_company_admin") {
      query += ` ORDER BY 
        CASE 
          WHEN u.role = 'super_admin' THEN 1 
          WHEN u.role = 'company_admin' THEN 2 
          ELSE 3 
        END, 
        u.created_at DESC LIMIT ? OFFSET ?`;
    } else {
      query += ` ORDER BY u.created_at DESC LIMIT ? OFFSET ?`;      
    }
    params.push(limit, offset);

    const [results] = await pool.query<any[]>(query, params);

    // Group trucks by user
    const usersMap = new Map<string, any>();
    results.forEach((row) => {
      if (!usersMap.has(row.id)) {
        usersMap.set(row.id, {
          id: row.id,
          first_name: row.first_name,
          last_name: row.last_name,
          email: row.email,
          phone: row.phone,
          role: row.role,
          status: row.status,
          company_name: row.company_name,
          created_by: row.created_by,
          created_at: row.created_at,
          updated_at: row.updated_at,
          assigned_trucks: [],
        });
      }
      if (row.truck_id) {
        usersMap.get(row.id).assigned_trucks.push({
          id: row.truck_id,
          truck_number: row.truck_number,
          make: row.make,
          model: row.model,
        });
      }
    });

    const users = Array.from(usersMap.values());

    // Calculate statistics from total dataset (not paginated results)
    let statsQuery = `
      SELECT 
        SUM(CASE WHEN role IN ('technician', 'company_admin') THEN 1 ELSE 0 END) as total_users,
        SUM(CASE WHEN role = 'technician' THEN 1 ELSE 0 END) as total_technicians,
        SUM(CASE WHEN role IN ('company_admin') THEN 1 ELSE 0 END) as total_administrators,
        SUM(CASE WHEN role = 'technician' AND status = 'active' THEN 1 ELSE 0 END) as active_technicians,
        SUM(CASE WHEN role = 'technician' AND status != 'active' THEN 1 ELSE 0 END) as inactive_technicians
      FROM users u
      WHERE 1=1
    `;
    
    const statsParams: any[] = [];
    
    // Apply same role-based filtering for statistics
    if (isSuperAdmin) {
      // Super admin can see company_admin and technician users
      // But if role filter is super_company_admin, allow super_admin users too
      if (role === "super_company_admin") {
        statsQuery += ` AND u.role IN ('super_admin', 'company_admin')`;
      } else {
        statsQuery += ` AND u.role IN ('company_admin', 'technician')`;
      }
    } else {
      // Company admin can only see technicians
      statsQuery += ` AND (u.company_name = ? OR u.created_by = ?)`;
      statsParams.push(userCompany, decoded.id);
      
      if (currentUser.role === "company_admin") {
        statsQuery += ` AND u.role = 'technician'`;
      }
    }
    
    const [statsResults] = await pool.query<any[]>(statsQuery, statsParams);
    const stats = statsResults[0];
    
    // Get total count for pagination with same filtering logic
    let countQuery = `SELECT COUNT(*) as total_count FROM users u WHERE 1=1`;
    const countParams: any[] = [];
    
    if (isSuperAdmin) {
      // Super admin can see company_admin and technician users
      // But if role filter is super_company_admin, allow super_admin users too
      if (role === "super_company_admin") {
        countQuery += ` AND u.role IN ('super_admin', 'company_admin')`;
      } else {
        countQuery += ` AND u.role IN ('company_admin', 'technician')`;
      }
    } else {
      countQuery += ` AND (u.company_name = ? OR u.created_by = ?)`;
      countParams.push(userCompany, decoded.id);
      
      if (currentUser.role === "company_admin") {
        countQuery += ` AND u.role = 'technician'`;
      }
    }
    
    // Apply same search and filter conditions to count query
    if (search) {
      countQuery += ` AND (u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ? OR u.id LIKE ?)`;
      const searchParam = `%${search}%`;
      countParams.push(searchParam, searchParam, searchParam, searchParam);
    }
    
    if (role) {
      if (role === "super_company_admin") {
        countQuery += ` AND u.role IN ('super_admin', 'company_admin')`;
      } else {
        countQuery += ` AND u.role = ?`;
        countParams.push(role);
      }
    }
    
    if (status) {
      countQuery += ` AND u.status = ?`;
      countParams.push(status);
    }
    
    const [countResults] = await pool.query<any[]>(countQuery, countParams);
    const total = countResults[0].total_count;
    
    const totalUsers = stats.total_users;
    const totalTechnicians = stats.total_technicians;
    const totalAdministrators = stats.total_administrators;
    const activeTechnicians = stats.active_technicians;
    const inactiveTechnicians = stats.inactive_technicians;

    const response: UserResponse = {
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
        statistics: {
          totalUsers,
          totalTechnicians,
          totalAdministrators,
          activeTechnicians,
          inactiveTechnicians,
        },
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Users API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: No token provided",
          code: "UNAUTHORIZED",
        },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];
    let decoded: { id: string; role: string };
    try {
      console.log("token", token);
      decoded = verify(token, process.env.JWT_SECRET as string) as {
        id: string;
        role: string;
      };
      // if (decoded.role !== "admin") {
      //   return NextResponse.json(
      //     {
      //       success: false,
      //       error: "Forbidden: Admin access required",
      //       code: "FORBIDDEN",
      //     },
      //     { status: 403 }
      //   );
      // }
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Invalid token",
          code: "INVALID_TOKEN",
        },
        { status: 401 }
      );
    }
    console.log("decoded", decoded);

    const body = await req.json();
    const { first_name, last_name, email, password, phone, role, company_name, status } = body;

    if (!first_name || !last_name || !email || !password || !role) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing required fields: first_name, last_name, email, password, role",
          code: "BAD_REQUEST",
        },
        { status: 400 }
      );
    }

    if (!["super_admin", "company_admin", "technician"].includes(role)) {
      return NextResponse.json(
        { success: false, error: "Invalid role", code: "BAD_REQUEST" },
        { status: 400 }
      );
    }

    // Validate company_name for company_admin role
    if (role === "company_admin" && !company_name?.trim()) {
      return NextResponse.json(
        { success: false, error: "Company name is required for Company Admin role", code: "BAD_REQUEST" },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, error: "Invalid email format", code: "BAD_REQUEST" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        {
          success: false,
          error: "Password must be at least 6 characters",
          code: "BAD_REQUEST",
        },
        { status: 400 }
      );
    }

    const [existingUser] = await pool.query(
      `SELECT id FROM users WHERE email = ?`,
      [email]
    );

    if ((existingUser as any[]).length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Email already exists",
          code: "DUPLICATE_EMAIL",
        },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      `
      INSERT INTO users (id, first_name, last_name, email, password, phone, role, status, company_name, created_by, created_at, updated_at)
      VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `,
      [
        first_name, 
        last_name, 
        email, 
        hashedPassword, 
        phone || null, 
        role, 
        status || 'active',
        role === "company_admin" ? company_name : null,
        decoded.id, // created_by is the current user's ID
      ]
    );

    const [newUser] = await pool.query(
      `
      SELECT id, first_name, last_name, email, phone, role, status, company_name, created_by, created_at, updated_at
      FROM users
      WHERE id = (SELECT LAST_INSERT_ID())
      `
    );

    return NextResponse.json({
      success: true,
      data: { ...(newUser as any[])[0], assigned_trucks: [] },
    });
  } catch (error: any) {
    console.error("Create user error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.sqlMessage || "Failed to create user",
        code: error.code || "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}
