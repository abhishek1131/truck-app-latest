
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { verify } from "jsonwebtoken";

interface ConfirmResponse {
  success: boolean;
  data?: any;
  error?: string;
  code?: string;
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
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

    const [result] = await pool.query(
      `
      UPDATE orders 
      SET status = ?, confirmed_at = NOW(), updated_at = NOW()
      WHERE id = ? AND status = ?
      `,
      ["processing", params.id, "pending"]
    );

    if ((result as any).affectedRows === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Order not found or already confirmed",
          code: "NOT_FOUND",
        },
        { status: 404 }
      );
    }

    const [updatedOrder] = await pool.query(
      `
      SELECT 
        o.id, 
        CONCAT(u.first_name, ' ', u.last_name) as technician,
        t.id as truck_id,
        t.truck_number,
        o.status,
        o.priority,
        o.total_amount,
        o.commission_amount,
        o.created_at
      FROM orders o
      JOIN users u ON o.technician_id = u.id
      JOIN trucks t ON o.truck_id = t.id
      WHERE o.id = ?
      `,
      [params.id]
    );

    return NextResponse.json({
      success: true,
      data: updatedOrder[0],
      message: "Order confirmed successfully",
    });
  } catch (error: any) {
    console.error("Confirm order error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.sqlMessage || "Failed to confirm order",
        code: error.code || "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}