import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { verify } from "jsonwebtoken";

interface NotificationResponse {
  success: boolean;
  data?: {
    notifications: {
      id: string;
      user_id?: string; // Made optional since not all activities may have a user
      user_name?: string; // Made optional
      action: string;
      entity_type?: string | null; // Adjusted to be optional
      entity_id?: string | null; // Adjusted to be optional
      details: string | null;
      created_at: string;
    }[];
  };
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

    const isAdmin = decoded.role === "admin";

    // Modified query to work with the activities table structure
    const query = `
      SELECT 
        a.id,
        o.technician_id AS user_id,
        CONCAT(u.first_name, ' ', u.last_name) AS user_name,
        a.type AS action,
        NULL AS entity_type, -- No entity_type column in activities
        a.id AS entity_id, -- Using activity id as entity_id
        a.message AS details,
        a.created_at
      FROM activities a
      LEFT JOIN orders o ON a.message LIKE CONCAT('%', o.order_number, '%')
      LEFT JOIN users u ON o.technician_id = u.id
      ${isAdmin ? "" : "WHERE o.technician_id = ?"}
      ORDER BY a.created_at DESC
      LIMIT 50
    `;
    const params = isAdmin ? [] : [decoded.id];

    const [rows] = await pool.query(query, params);

    const notifications = (rows as any[]).map((row) => ({
      id: row.id,
      user_id: row.user_id || null, // Handle cases where user_id is null
      user_name: row.user_name || "System", // Fallback if no user is associated
      action: row.action,
      entity_type: row.entity_type,
      entity_id: row.entity_id,
      details: row.details,
      created_at: new Date(row.created_at).toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: { notifications },
    });
  } catch (error: any) {
    console.error("Notification fetch error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.sqlMessage || "Failed to fetch notifications",
        code: error.code || "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}
