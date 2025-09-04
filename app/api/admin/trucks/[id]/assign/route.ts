import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { verify } from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params to resolve the dynamic route parameter
    const { id } = await params;

    // Verify JWT token
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("No or invalid authorization header");
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
      // if (decoded.role !== "admin") {
      //   console.log(`Forbidden: User role ${decoded.role} is not admin`);
      //   return NextResponse.json(
      //     {
      //       success: false,
      //       error: "Forbidden: Admin access required",
      //       code: "FORBIDDEN",
      //     },
      //     { status: 403 }
      //   );
      // }
      console.log(`Authenticated admin user: ${decoded.id}`);
    } catch (error) {
      console.error("Token verification failed:", error);
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
    console.log(
      `Received request to ${
        userId ? "assign" : "unassign"
      } truck ID: ${id}, userId: ${userId}`
    );

    // Verify truck exists
    const [truckRows] = await pool.query(
      `
      SELECT id, truck_number FROM trucks WHERE id = ?
      `,
      [id]
    );

    if (!truckRows.length) {
      console.log(`Truck not found: ${id}`);
      return NextResponse.json(
        { success: false, error: "Truck not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }
    console.log(`Found truck: ${truckRows[0].truck_number}`);

    // Verify user exists and is a technician (if userId is provided)
    if (userId) {
      const [userRows] = await pool.query(
        `
        SELECT id, role FROM users WHERE id = ? AND role = 'technician'
        `,
        [userId]
      );

      if (!userRows.length) {
        console.log(`Technician not found: ${userId}`);
        return NextResponse.json(
          { success: false, error: "Technician not found", code: "NOT_FOUND" },
          { status: 404 }
        );
      }
      console.log(`Verified technician: ${userId}`);
    }

    // Update truck assignment
    const [result] = await pool.query(
      `
      UPDATE trucks
      SET assigned_to = ?, updated_at = NOW()
      WHERE id = ?
      `,
      [userId || null, id]
    );

    if (result.affectedRows === 0) {
      console.log(`Failed to update truck: ${id}`);
      return NextResponse.json(
        { success: false, error: "Truck not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }
    console.log(
      `Updated truck assignment: ${
        userId ? `Assigned to ${userId}` : "Unassigned"
      }`
    );

    // Log activity to activities table
    const action = userId ? "assign" : "unassign";
    const message = userId
      ? `Assigned truck #${truckRows[0].truck_number} to technician`
      : `Unassigned truck #${truckRows[0].truck_number}`;
    try {
      await pool.query(
        `
        INSERT INTO activities (id, type, message, status, created_at)
        VALUES (?, ?, ?, ?, NOW())
        `,
        [uuidv4(), action, message, "completed"]
      );
      console.log(
        `Logged activity: ${action} for truck #${truckRows[0].truck_number}`
      );
    } catch (activityError: any) {
      console.error(
        `Failed to log activity for truck #${truckRows[0].truck_number}:`,
        activityError
      );
      // Note: We don't fail the request if activity logging fails, but log the error
    }

    // Fetch updated truck data
    const [updatedTruck] = await pool.query(
      `
      SELECT 
        t.id, t.truck_number,
        u.id AS technician_id, u.first_name, u.last_name, u.email
      FROM trucks t
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.id = ?
      `,
      [id]
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

    console.log(`Successfully ${action}ed truck #${truckRows[0].truck_number}`);
    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Assign truck error:", {
      message: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage,
      stack: error.stack,
    });
    return NextResponse.json(
      {
        success: false,
        error: error.sqlMessage || "Internal server error",
        code: error.code || "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}
