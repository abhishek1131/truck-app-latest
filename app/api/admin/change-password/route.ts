import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { verify } from "jsonwebtoken";
import bcrypt from "bcrypt";

interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface ChangePasswordResponse {
  success: boolean;
  error?: string;
  code?: string;
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing or invalid token",
          code: "UNAUTHORIZED",
        },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    let decoded;
    try {
      decoded = verify(token, process.env.JWT_SECRET as string) as {
        id: string;
        role: string;
      };
      if (decoded.role !== "admin") {
        return NextResponse.json(
          { success: false, error: "Admin access required", code: "FORBIDDEN" },
          { status: 403 }
        );
      }
    } catch (error) {
      return NextResponse.json(
        { success: false, error: "Invalid token", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const body: ChangePasswordRequest = await req.json();
    const { currentPassword, newPassword, confirmPassword } = body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields",
          code: "BAD_REQUEST",
        },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        {
          success: false,
          error: "Passwords do not match",
          code: "BAD_REQUEST",
        },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        {
          success: false,
          error: "New password must be at least 6 characters",
          code: "BAD_REQUEST",
        },
        { status: 400 }
      );
    }

    // Verify current password
    const [userRows] = await pool.query(
      `SELECT password FROM users WHERE id = ?`,
      [decoded.id]
    );
    const user = (userRows as any[])[0];

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isPasswordValid) {
      return NextResponse.json(
        {
          success: false,
          error: "Current password is incorrect",
          code: "BAD_REQUEST",
        },
        { status: 400 }
      );
    }

    // Update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query(
      `UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?`,
      [hashedPassword, decoded.id]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Change password error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.sqlMessage || "Failed to change password",
        code: error.code || "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}
