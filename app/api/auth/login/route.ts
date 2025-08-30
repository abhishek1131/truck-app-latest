import { NextResponse } from "next/server";
import pool from "../../../../lib/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

interface LoginRequestBody {
  email: string;
  password: string;
}

interface LoginResponse {
  success: boolean;
  data?: {
    user: { id: string; email: string };
    profile: {
      role: "admin" | "technician";
      first_name: string;
      last_name: string;
    };
    session: { access_token: string; expires_at: string };
  };
  error?: string;
  code?: string;
}

export async function POST(req: Request) {
  try {
    const body: LoginRequestBody = await req.json();
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          error: "Email and password are required",
          code: "VALIDATION_ERROR",
        },
        { status: 400 }
      );
    }

    // Check if user exists
    const [users] = await pool.query<
      {
        id: string;
        email: string;
        password: string;
        role: "admin" | "technician";
        first_name: string;
        last_name: string;
      }[]
    >(
      "SELECT id, email, password, role, first_name, last_name FROM users WHERE email = ?",
      [email]
    );

    if (users.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid email or password",
          code: "INVALID_CREDENTIALS",
        },
        { status: 401 }
      );
    }

    const user = users[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid email or password",
          code: "INVALID_CREDENTIALS",
        },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: "1d" }
    );

    // Return user data and token
    return NextResponse.json(
      {
        success: true,
        data: {
          user: { id: user.id, email: user.email },
          profile: {
            role: user.role,
            first_name: user.first_name,
            last_name: user.last_name,
          },
          session: {
            access_token: token,
            expires_at: new Date(
              Date.now() + 24 * 60 * 60 * 1000
            ).toISOString(),
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, error: "Server error", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
