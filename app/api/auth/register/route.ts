import { NextResponse } from "next/server";
import pool from "../../../../lib/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

interface RegisterRequestBody {
  name: string;
  email: string;
  password: string;
  role: "admin" | "technician";
}

interface RegisterResponse {
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
    const body: RegisterRequestBody = await req.json();
    const { name, email, password, role } = body;

    // Validate input
    if (!email || !password || !name || !role) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields",
          code: "VALIDATION_ERROR",
        },
        { status: 400 }
      );
    }

    if (!["admin", "technician"].includes(role)) {
      return NextResponse.json(
        { success: false, error: "Invalid role", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const [existingUsers] = await pool.query<{ id: string }[]>(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );
    if (existingUsers.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Email already exists",
          code: "DUPLICATE_RESOURCE",
        },
        { status: 400 }
      );
    }

    // Split name into first_name and last_name
    const nameParts = name.trim().split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate user ID
    const userId = uuidv4();

    // Insert user into database
    await pool.query(
      "INSERT INTO users (id, email, first_name, last_name, role, status, password) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [userId, email, firstName, lastName, role, "active", hashedPassword]
    );

    // Generate JWT token
    const token = jwt.sign(
      { id: userId, role },
      process.env.JWT_SECRET as string,
      { expiresIn: "1d" }
    );

    // Return user data and token
    return NextResponse.json(
      {
        success: true,
        data: {
          user: { id: userId, email },
          profile: { role, first_name: firstName, last_name: lastName },
          session: {
            access_token: token,
            expires_at: new Date(
              Date.now() + 24 * 60 * 60 * 1000
            ).toISOString(),
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { success: false, error: "Server error", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
