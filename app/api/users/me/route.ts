import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { verify } from "jsonwebtoken";
import bcrypt from "bcrypt";

interface UserProfile {
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
}

interface PasswordChange {
  currentPassword: string;
  newPassword: string;
}

interface UserResponse {
  success: boolean;
  data?: UserProfile;
  error?: string;
  code?: string;
}

export async function GET(req: Request) {
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
    } catch (error) {
      return NextResponse.json(
        { success: false, error: "Invalid token", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const [rows] = await pool.query(
      `SELECT id, first_name, last_name, email, phone FROM users WHERE id = ? AND status = 'active'`,
      [decoded.id]
    );

    if (!rows || (rows as any[]).length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found or inactive",
          code: "NOT_FOUND",
        },
        { status: 404 }
      );
    }

    const user = (rows as any[])[0];
    const userProfile: UserProfile = {
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      email: user.email,
      phone: user.phone || "",
    };

    return NextResponse.json({ success: true, data: userProfile });
  } catch (error: any) {
    console.error("User GET error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.sqlMessage || "Failed to fetch user details",
        code: error.code || "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
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
    } catch (error) {
      return NextResponse.json(
        { success: false, error: "Invalid token", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      first_name,
      last_name,
      email,
      phone,
      currentPassword,
      newPassword,
    } = body;

    // Validate input
    if (!first_name || !last_name || !email) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: first_name, last_name, email",
          code: "BAD_REQUEST",
        },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid email format",
          code: "BAD_REQUEST",
        },
        { status: 400 }
      );
    }

    // Check if email is already in use by another user
    const [existingEmail] = await pool.query(
      `SELECT id FROM users WHERE email = ? AND id != ?`,
      [email, decoded.id]
    );
    if ((existingEmail as any[]).length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Email is already in use",
          code: "CONFLICT",
        },
        { status: 409 }
      );
    }

    // Handle password change if provided
    if (currentPassword && newPassword) {
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

      // Verify current password
      const passwordMatch = await bcrypt.compare(
        currentPassword,
        user.password
      );
      if (!passwordMatch) {
        return NextResponse.json(
          {
            success: false,
            error: "Current password is incorrect",
            code: "BAD_REQUEST",
          },
          { status: 400 }
        );
      }

      // Validate new password
      if (newPassword.length < 8) {
        return NextResponse.json(
          {
            success: false,
            error: "New password must be at least 8 characters",
            code: "BAD_REQUEST",
          },
          { status: 400 }
        );
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update user with new password
      await pool.query(
        `UPDATE users SET first_name = ?, last_name = ?, email = ?, phone = ?, password = ?, updated_at = NOW() WHERE id = ?`,
        [
          first_name,
          last_name,
          email,
          phone || null,
          hashedPassword,
          decoded.id,
        ]
      );
    } else {
      // Update user without password change
      await pool.query(
        `UPDATE users SET first_name = ?, last_name = ?, email = ?, phone = ?, updated_at = NOW() WHERE id = ?`,
        [first_name, last_name, email, phone || null, decoded.id]
      );
    }

    // Fetch updated user data
    const [updatedRows] = await pool.query(
      `SELECT first_name, last_name, email, phone FROM users WHERE id = ?`,
      [decoded.id]
    );
    const updatedUser = (updatedRows as any[])[0];

    const userProfile: UserProfile = {
      first_name: updatedUser.first_name || "",
      last_name: updatedUser.last_name || "",
      email: updatedUser.email,
      phone: updatedUser.phone || "",
    };

    return NextResponse.json({ success: true, data: userProfile });
  } catch (error: any) {
    console.error("User PUT error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.sqlMessage || "Failed to update user details",
        code: error.code || "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}
