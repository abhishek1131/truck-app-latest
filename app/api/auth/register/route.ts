import { NextResponse } from "next/server";
import pool from "@/lib/db";
import bcrypt from "bcrypt";
import { sign } from "jsonwebtoken";

interface RegisterRequest {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  role: "admin" | "manager" | "technician";
}

interface AuthResponse {
  success: boolean;
  data?: {
    user: { id: string; email: string };
    profile: { first_name: string; last_name: string; role: string };
    session: { access_token: string; expires_at: string };
  };
  error?: string;
  code?: string;
}

export async function POST(req: Request) {
  try {
    const body: RegisterRequest = await req.json();
    const { first_name, last_name, email, password, role } = body;

    if (!first_name || !last_name || !email || !password || !role) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields",
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
      INSERT INTO users (id, first_name, last_name, email, password, role, status, created_at, updated_at)
      VALUES (UUID(), ?, ?, ?, ?, ?, 'active', NOW(), NOW())
      `,
      [first_name, last_name, email, hashedPassword, role]
    );

    const [newUser] = await pool.query(
      `
      SELECT id, email, first_name, last_name, role
      FROM users
      WHERE email = ?
      `,
      [email]
    );

    const user = newUser[0];
    const access_token = sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" }
    );

    const response: AuthResponse = {
      success: true,
      data: {
        user: { id: user.id, email: user.email },
        profile: {
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
        },
        session: {
          access_token,
          expires_at: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000
          ).toISOString(),
        },
      },
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Register error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.sqlMessage || "Failed to register user",
        code: error.code || "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}
