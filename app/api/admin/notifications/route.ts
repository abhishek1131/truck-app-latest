import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { verify } from "jsonwebtoken";

interface NotificationResponse {
  success: boolean;
  data?: {
    notifications: {
      id: string;
      user_id?: string | null;
      user_name?: string | null;
      action: string;
      entity_type?: string | null;
      entity_id?: string | null;
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

    // Revised query to ensure all technician-related activities are included
    const query = `
      SELECT 
        a.id,
        o.technician_id AS user_id,
        CONCAT(u.first_name, ' ', u.last_name) AS user_name,
        a.type AS action,
        'order' AS entity_type,
        a.id AS entity_id,
        a.message AS details,
        a.created_at
      FROM activities a
      LEFT JOIN orders o ON a.message LIKE CONCAT('%', o.order_number, '%')
      LEFT JOIN users u ON o.technician_id = u.id
      WHERE a.type = 'order' AND o.technician_id IN (SELECT id FROM users WHERE role = 'technician')
      ${isAdmin ? "" : "AND o.technician_id = ?"}
      
      UNION

      SELECT 
        a.id,
        a.user_id,
        CONCAT(u.first_name, ' ', u.last_name) AS user_name,
        a.type AS action,
        a.type AS entity_type,
        a.id AS entity_id,
        a.message AS details,
        a.created_at
      FROM activities a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.type IN ('technician', 'redemption') AND a.user_id IN (SELECT id FROM users WHERE role = 'technician')
      ${isAdmin ? "" : "AND a.user_id = ?"}
      
      UNION

      SELECT 
        a.id,
        NULL AS user_id,
        'System' AS user_name,
        a.type AS action,
        a.type AS entity_type,
        a.id AS entity_id,
        a.message AS details,
        a.created_at
      FROM activities a
      WHERE a.type = 'supply_house'
      ${
        isAdmin
          ? ""
          : "AND EXISTS (SELECT 1 FROM restock_orders ro WHERE ro.supply_house_id IN (SELECT supply_house_id FROM orders WHERE technician_id = ?))"
      }
      
      UNION

      SELECT 
        us.id,
        us.user_id,
        CONCAT(u.first_name, ' ', u.last_name) AS user_name,
        us.action,
        'session' AS entity_type,
        us.id AS entity_id,
        COALESCE(JSON_UNQUOTE(JSON_EXTRACT(us.details, '$.status')), us.action) AS details,
        us.created_at
      FROM user_sessions us
      LEFT JOIN users u ON us.user_id = u.id
      WHERE us.user_id IN (SELECT id FROM users WHERE role = 'technician')
      ${isAdmin ? "" : "AND us.user_id = ?"}
      
      UNION

      SELECT 
        c.id,
        c.technician_id AS user_id,
        CONCAT(u.first_name, ' ', u.last_name) AS user_name,
        c.type AS action,
        'credit' AS entity_type,
        c.id AS entity_id,
        c.description AS details,
        c.created_at
      FROM credits c
      LEFT JOIN users u ON c.technician_id = u.id
      WHERE c.technician_id IN (SELECT id FROM users WHERE role = 'technician')
      ${isAdmin ? "" : "AND c.technician_id = ?"}
      
      UNION

      SELECT 
        ro.id,
        ro.technician_id AS user_id,
        CONCAT(u.first_name, ' ', u.last_name) AS user_name,
        ro.status AS action,
        'restock_order' AS entity_type,
        ro.id AS entity_id,
        CONCAT('Restock order ', ro.id, ' - ', ro.status) AS details,
        ro.created_at
      FROM restock_orders ro
      LEFT JOIN users u ON ro.technician_id = u.id
      WHERE ro.technician_id IN (SELECT id FROM users WHERE role = 'technician')
      ${isAdmin ? "" : "AND ro.technician_id = ?"}
      
      ORDER BY created_at DESC
      LIMIT 50
    `;

    const params = isAdmin
      ? []
      : [
          decoded.id,
          decoded.id,
          decoded.id,
          decoded.id,
          decoded.id,
          decoded.id,
        ];

    const [rows] = await pool.query(query, params);

    const notifications = (rows as any[]).map((row) => ({
      id: row.id,
      user_id: row.user_id || null,
      user_name: row.user_name || "System",
      action: row.action,
      entity_type: row.entity_type || null,
      entity_id: row.entity_id || null,
      details: row.details || null,
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
