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
      role: "admin" | "manager" | "technician";
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
      if (decoded.role !== "admin") {
        return NextResponse.json(
          {
            success: false,
            error: "Forbidden: Admin access required",
            code: "FORBIDDEN",
          },
          { status: 403 }
        );
      }
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

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "";
    const status = searchParams.get("status") || "";

    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        u.id, u.first_name, u.last_name, u.email, u.phone, u.role, u.status, u.created_at, u.updated_at,
        t.id AS truck_id, t.truck_number, t.make, t.model,
        (SELECT COUNT(*) FROM users) AS total_count
      FROM users u
      LEFT JOIN trucks t ON t.assigned_to = u.id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (search) {
      query += ` AND (u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ? OR u.id LIKE ?)`;
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam, searchParam);
    }

    if (role) {
      query += ` AND u.role = ?`;
      params.push(role);
    }

    if (status) {
      query += ` AND u.status = ?`;
      params.push(status);
    }

    query += ` ORDER BY u.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const [results] = await pool.query<any[]>(query, params);

    const total = results.length > 0 ? results[0].total_count : 0;

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
      decoded = verify(token, process.env.JWT_SECRET as string) as {
        id: string;
        role: string;
      };
      if (decoded.role !== "admin") {
        return NextResponse.json(
          {
            success: false,
            error: "Forbidden: Admin access required",
            code: "FORBIDDEN",
          },
          { status: 403 }
        );
      }
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

    const body = await req.json();
    const { first_name, last_name, email, password, phone, role } = body;

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

    if (!["admin", "manager", "technician"].includes(role)) {
      return NextResponse.json(
        { success: false, error: "Invalid role", code: "BAD_REQUEST" },
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
      INSERT INTO users (id, first_name, last_name, email, password, phone, role, status, created_at, updated_at)
      VALUES (UUID(), ?, ?, ?, ?, ?, ?, 'active', NOW(), NOW())
      `,
      [first_name, last_name, email, hashedPassword, phone || null, role]
    );

    const [newUser] = await pool.query(
      `
      SELECT id, first_name, last_name, email, phone, role, status, created_at, updated_at
      FROM users
      WHERE id = (SELECT LAST_INSERT_ID())
      `
    );

    return NextResponse.json({
      success: true,
      data: { ...newUser[0], assigned_trucks: [] },
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
