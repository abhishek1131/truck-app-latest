import { NextResponse } from "next/server";
import pool from "@/lib/db";
import jwt from "jsonwebtoken";
import { verify } from "jsonwebtoken";

interface AssignTruckResponse {
  success: boolean;
  data?: {
    id: string;
    truck_number: string;
    assigned_technician: {
      id: string;
      first_name: string;
      last_name: string;
      email: string;
    } | null;
  };
  error?: string;
  code?: string;
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verify JWT token
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

    const { userId } = await req.json();

    // Verify user exists and is a technician
    const [userRows] = await pool.query(
      `
      SELECT id, role FROM users WHERE id = ? AND role = 'technician'
      `,
      [userId]
    );

    if (!userRows.length) {
      return NextResponse.json(
        { success: false, error: "Technician not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    const [result] = await pool.query(
      `
      UPDATE trucks
      SET assigned_to = ?, updated_at = NOW()
      WHERE id = ?
      `,
      [userId || null, params.id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { success: false, error: "Truck not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    const [updatedTruck] = await pool.query(
      `
      SELECT 
        t.id, t.truck_number,
        u.id AS technician_id, u.first_name, u.last_name, u.email
      FROM trucks t
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.id = ?
      `,
      [params.id]
    );

    const response: AssignTruckResponse = {
      success: true,
      data: {
        id: updatedTruck[0].id,
        truck_number: updatedTruck[0].truck_number,
        assigned_technician: updatedTruck[0].technician_id
          ? {
              id: updatedTruck[0].technician_id,
              first_name: updatedTruck[0].first_name,
              last_name: updatedTruck[0].last_name,
              email: updatedTruck[0].email,
            }
          : null,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Assign truck error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
