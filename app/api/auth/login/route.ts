import { NextResponse } from "next/server";
import pool from "@/lib/db";
import bcrypt from "bcrypt";
import { sign } from "jsonwebtoken";

interface LoginRequest {
  email: string;
  password: string;
}

interface AuthResponse {
  success: boolean;
  data?: {
    user: { id: string; email: string };
    profile: { first_name: string; last_name: string; role: string, created_at: string };
    session: { access_token: string; expires_at: string };
  };
  error?: string;
  code?: string;
}

export async function POST(req: Request) {
  try {
    const body: LoginRequest = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing email or password",
          code: "BAD_REQUEST",
        },
        { status: 400 }
      );
    }

    const [users] = await pool.query(
      `
      SELECT id, email, password, first_name, last_name, role, status, created_at
      FROM users
      WHERE email = ?
      `,
      [email]
    );

    if ((users as any[]).length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid credentials",
          code: "INVALID_CREDENTIALS",
        },
        { status: 401 }
      );
    }

    const user = users[0];

    if (user.status !== "active") {
      return NextResponse.json(
        {
          success: false,
          error: "Account is not active",
          code: "ACCOUNT_INACTIVE",
        },
        { status: 403 }
      );
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid credentials",
          code: "INVALID_CREDENTIALS",
        },
        { status: 401 }
      );
    }

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
          created_at: user.created_at,
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
    console.error("Login error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.sqlMessage || "Failed to login",
        code: error.code || "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}
