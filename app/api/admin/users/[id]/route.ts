import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { verify } from "jsonwebtoken";
import bcrypt from "bcrypt";

interface UserResponse {
  success: boolean;
  data?: {
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
    orders?: { id: string; status: string; created_at: string }[];
    credits?: { id: string; amount: number; created_at: string }[];
  };
  message?: string;
  error?: string;
  code?: string;
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
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

    const [users] = await pool.query(
      `
      SELECT 
        u.id, u.first_name, u.last_name, u.email, u.phone, u.role, u.status, u.created_at, u.updated_at,
        t.id AS truck_id, t.truck_number, t.make, t.model,
        o.id AS order_id, o.status AS order_status, o.created_at AS order_created_at,
        c.id AS credit_id, c.amount, c.created_at AS credit_created_at
      FROM users u
      LEFT JOIN trucks t ON t.assigned_to = u.id
      LEFT JOIN orders o ON o.technician_id = u.id
      LEFT JOIN credits c ON c.technician_id = u.id
      WHERE u.id = ?
      `,
      [params.id]
    );

    if ((users as any[]).length === 0) {
      return NextResponse.json(
        { success: false, error: "User not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    const userData = users[0];
    const user: UserResponse["data"] = {
      id: userData.id,
      first_name: userData.first_name,
      last_name: userData.last_name,
      email: userData.email,
      phone: userData.phone,
      role: userData.role,
      status: userData.status,
      created_at: userData.created_at,
      updated_at: userData.updated_at,
      assigned_trucks: [],
      orders: [],
      credits: [],
    };

    // Group trucks, orders, and credits
    (users as any[]).forEach((row) => {
      if (
        row.truck_id &&
        !user.assigned_trucks.some((t) => t.id === row.truck_id)
      ) {
        user.assigned_trucks.push({
          id: row.truck_id,
          truck_number: row.truck_number,
          make: row.make,
          model: row.model,
        });
      }
      if (row.order_id && !user.orders.some((o) => o.id === row.order_id)) {
        user.orders.push({
          id: row.order_id,
          status: row.order_status,
          created_at: row.order_created_at,
        });
      }
      if (row.credit_id && !user.credits.some((c) => c.id === row.credit_id)) {
        user.credits.push({
          id: row.credit_id,
          amount: row.amount,
          created_at: row.credit_created_at,
        });
      }
    });

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error("User details API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Validate Authorization header
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

    // Verify JWT token
    const token = authHeader.split(" ")[1];
    let decoded: { id: string; role: string };
    try {
      decoded = verify(token, process.env.JWT_SECRET as string) as {
        id: string;
        role: string;
      };
      // Uncomment if admin-only access is required
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

    // Parse request body
    const body = await req.json();
    const { first_name, last_name, phone, role, status, password } = body;

    // Validate required fields
    if (!first_name || !last_name || !role || !status) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: first_name, last_name, role, status",
          code: "BAD_REQUEST",
        },
        { status: 400 }
      );
    }

    // Validate role
    if (!["admin", "manager", "technician"].includes(role)) {
      return NextResponse.json(
        { success: false, error: "Invalid role", code: "BAD_REQUEST" },
        { status: 400 }
      );
    }

    // Validate status
    if (!["active", "inactive", "pending", "suspended"].includes(status)) {
      return NextResponse.json(
        { success: false, error: "Invalid status", code: "BAD_REQUEST" },
        { status: 400 }
      );
    }

    // Validate password length if provided
    if (password && password.length < 8) {
      return NextResponse.json(
        {
          success: false,
          error: "Password must be at least 8 characters",
          code: "BAD_REQUEST",
        },
        { status: 400 }
      );
    }

    // Prepare update query
    const updates: any = {
      first_name,
      last_name,
      phone: phone || null,
      role,
      status,
      updated_at: new Date(),
    };
    const queryParams: any[] = [
      first_name,
      last_name,
      phone || null,
      role,
      status,
    ];

    if (password) {
      updates.password = await bcrypt.hash(password, 10);
      queryParams.push(updates.password);
    }

    // Add the user ID to the query parameters
    queryParams.push(params.id);

    // Execute update query
    const [result] = await pool.query(
      `
      UPDATE users
      SET first_name = ?, last_name = ?, phone = ?, role = ?, status = ?${
        password ? ", password = ?" : ""
      }
      WHERE id = ?
      `,
      queryParams
    );

    // Check if any rows were affected
    if ((result as any).affectedRows === 0) {
      return NextResponse.json(
        { success: false, error: "User not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // Fetch updated user details, including assigned trucks, orders, and credits
    const [updatedUsers] = await pool.query(
      `
      SELECT 
        u.id, u.first_name, u.last_name, u.email, u.phone, u.role, u.status, u.created_at, u.updated_at,
        t.id AS truck_id, t.truck_number, t.make, t.model,
        o.id AS order_id, o.status AS order_status, o.created_at AS order_created_at,
        c.id AS credit_id, c.amount, c.created_at AS credit_created_at
      FROM users u
      LEFT JOIN trucks t ON t.assigned_to = u.id
      LEFT JOIN orders o ON o.technician_id = u.id
      LEFT JOIN credits c ON c.technician_id = u.id
      WHERE u.id = ?
      `,
      [params.id]
    );

    if ((updatedUsers as any[]).length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found after update",
          code: "NOT_FOUND",
        },
        { status: 404 }
      );
    }

    // Structure the response
    const userData = updatedUsers[0];
    const user: UserResponse["data"] = {
      id: userData.id,
      first_name: userData.first_name,
      last_name: userData.last_name,
      email: userData.email,
      phone: userData.phone,
      role: userData.role,
      status: userData.status,
      created_at: userData.created_at,
      updated_at: userData.updated_at,
      assigned_trucks: [],
      orders: [],
      credits: [],
    };

    // Group trucks, orders, and credits
    (updatedUsers as any[]).forEach((row) => {
      if (
        row.truck_id &&
        !user.assigned_trucks.some((t) => t.id === row.truck_id)
      ) {
        user.assigned_trucks.push({
          id: row.truck_id,
          truck_number: row.truck_number,
          make: row.make,
          model: row.model,
        });
      }
      if (row.order_id && !user.orders.some((o) => o.id === row.order_id)) {
        user.orders.push({
          id: row.order_id,
          status: row.order_status,
          created_at: row.order_created_at,
        });
      }
      if (row.credit_id && !user.credits.some((c) => c.id === row.credit_id)) {
        user.credits.push({
          id: row.credit_id,
          amount: row.amount,
          created_at: row.credit_created_at,
        });
      }
    });

    return NextResponse.json({
      success: true,
      data: user,
      message: "User updated successfully",
    });
  } catch (error: any) {
    console.error("Update user error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.sqlMessage || "Failed to update user",
        code: error.code || "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
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

    const [result] = await pool.query(`DELETE FROM users WHERE id = ?`, [
      params.id,
    ]);

    if ((result as any).affectedRows === 0) {
      return NextResponse.json(
        { success: false, error: "User not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error: any) {
    console.error("Delete user error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.sqlMessage || "Failed to delete user",
        code: error.code || "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}
