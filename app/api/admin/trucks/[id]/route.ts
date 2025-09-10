import { NextResponse } from "next/server";
import pool from "../../../../../lib/db";
import jwt from "jsonwebtoken";
import { verify } from "jsonwebtoken";

interface TruckDetailResponse {
  success: boolean;
  data?: {
    id: string;
    truck_number: string;
    make: string;
    model: string;
    year: number;
    license_plate: string;
    vin: string;
    status: "active" | "maintenance" | "inactive";
    location: string;
    mileage: number;
    order_approval: boolean;
    assigned_technician: {
      id: string;
      first_name: string;
      last_name: string;
      email: string;
    } | null;
    totalItems: number;
    lowStockItems: number;
    bins: number;
    lastUpdated: string;
    orders: { id: string; order_number: string; status: string }[];
    bins_data: { id: string; bin_code: string; name: string }[];
    inventory: {
      id: string;
      item_id: string;
      quantity: number;
      min_quantity: number;
      item_name: string;
      bin_code: string;
    }[];
  };
  error?: string;
  code?: string;
}

export async function GET(
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
      // if (decoded.role !== "admin") {
      //   return NextResponse.json(
      //     {
      //       success: false,
      //       error: "Forbidden: Admin access required",
      //       code: "FORBIDDEN",
      //     },
      //     { status: 403 }
      //   );
      // }
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

    const [truckRows] = await pool.query(
      `
      SELECT 
        t.id, t.truck_number, t.make, t.model, t.year, t.license_plate, t.vin, t.status, t.location, t.mileage,t.order_approval,
        u.id AS technician_id, u.first_name, u.last_name, u.email,
        (SELECT COUNT(*) FROM truck_bins tb WHERE tb.truck_id = t.id) AS bins,
        (SELECT SUM(ti.quantity) FROM truck_inventory ti WHERE ti.truck_id = t.id) AS totalItems,
        (SELECT COUNT(*) FROM truck_inventory ti 
         JOIN inventory_items ii ON ti.item_id = ii.id 
         WHERE ti.truck_id = t.id AND ti.quantity <= ti.min_quantity) AS lowStockItems,
        t.updated_at AS lastUpdated
      FROM trucks t
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.id = ?
      `,
      [params.id]
    );

    if (!truckRows.length) {
      return NextResponse.json(
        { success: false, error: "Truck not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    const truck = truckRows[0];

    const [orders] = await pool.query(
      `
      SELECT id, order_number, status
      FROM orders
      WHERE truck_id = ?
      `,
      [params.id]
    );

    const [bins] = await pool.query(
      `
      SELECT id, bin_code, name
      FROM truck_bins
      WHERE truck_id = ?
      `,
      [params.id]
    );

    const [inventory] = await pool.query(
      `
      SELECT 
        ti.id, ti.item_id, ti.quantity, ti.min_quantity,
        ii.name AS item_name,
        tb.bin_code
      FROM truck_inventory ti
      JOIN inventory_items ii ON ti.item_id = ii.id
      JOIN truck_bins tb ON ti.bin_id = tb.id
      WHERE ti.truck_id = ?
      `,
      [params.id]
    );

    const response: TruckDetailResponse = {
      success: true,
      data: {
        id: truck.id,
        truck_number: truck.truck_number,
        make: truck.make,
        model: truck.model,
        year: truck.year,
        license_plate: truck.license_plate,
        vin: truck.vin,
        status: truck.status,
        location: truck.location,
        mileage: truck.mileage,
        order_approval: Boolean(truck.order_approval),
        assigned_technician: truck.technician_id
          ? {
              id: truck.technician_id,
              first_name: truck.first_name,
              last_name: truck.last_name,
              email: truck.email,
            }
          : null,
        totalItems: Number(truck.totalItems) || 0,
        lowStockItems: Number(truck.lowStockItems) || 0,
        bins: Number(truck.bins) || 0,
        lastUpdated: truck.lastUpdated
          ? new Date(truck.lastUpdated).toLocaleString()
          : "Never",
        orders,
        bins_data: bins,
        inventory,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Truck details API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
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
      // if (decoded.role !== "admin") {
      //   return NextResponse.json(
      //     {
      //       success: false,
      //       error: "Forbidden: Admin access required",
      //       code: "FORBIDDEN",
      //     },
      //     { status: 403 }
      //   );
      // }
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

    const body = await req.json();
    const {
      truck_number,
      make,
      model,
      year,
      license_plate,
      vin,
      location,
      status,
      assigned_to,
      mileage,
      order_approval
    } = body;

    const [result] = await pool.query(
      `
      UPDATE trucks
      SET 
        truck_number = ?,
        make = ?,
        model = ?,
        year = ?,
        license_plate = ?,
        vin = ?,
        location = ?,
        status = ?,
        assigned_to = ?,
        mileage = ?,
        order_approval = ?,
        updated_at = NOW()
      WHERE id = ?
      `,
      [
        truck_number,
        make,
        model,
        year,
        license_plate,
        vin,
        location,
        status,
        assigned_to || null,
        mileage,
        order_approval === undefined ? false : order_approval,
        params.id,
      ]
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
        t.*,
        u.id AS technician_id, u.first_name, u.last_name, u.email
      FROM trucks t
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.id = ?
      `,
      [params.id]
    );

    return NextResponse.json({
      success: true,
      data: updatedTruck[0],
    });
  } catch (error) {
    console.error("Update truck error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update truck", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
      // if (decoded.role !== "admin") {
      //   return NextResponse.json(
      //     {
      //       success: false,
      //       error: "Forbidden: Admin access required",
      //       code: "FORBIDDEN",
      //     },
      //     { status: 403 }
      //   );
      // }
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

    const [result] = await pool.query(
      `
      DELETE FROM trucks
      WHERE id = ?
      `,
      [params.id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { success: false, error: "Truck not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Truck deleted successfully",
    });
  } catch (error) {
    console.error("Delete truck error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete truck", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
