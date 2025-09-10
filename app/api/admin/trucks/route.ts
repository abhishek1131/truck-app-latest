import { NextResponse } from "next/server";
import pool from "../../../../lib/db";
import jwt from "jsonwebtoken";
import { verify } from "jsonwebtoken";

interface TruckResponse {
  success: boolean;
  data?: {
    trucks: {
      id: string;
      truck_number: string;
      make: string;
      model: string;
      year: number;
      license_plate: string;
      vin: string;
      status: "active" | "maintenance" | "inactive";
      location: string | null;
      mileage: number;
      next_maintenance: string | null;
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
      order_approval: boolean;
    }[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
  error?: string;
  code?: string;
}

export async function GET(req: Request) {
  try {
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

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "100");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const assigned = searchParams.get("assignment") || "";

    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        t.id, t.truck_number, t.make, t.model, t.year, t.license_plate, t.vin, t.status, t.location, t.mileage, t.next_maintenance, t.order_approval,
        u.id AS technician_id, u.first_name, u.last_name, u.email,
        (SELECT COUNT(*) FROM truck_bins tb WHERE tb.truck_id = t.id) AS bins,
        (SELECT SUM(ti.quantity) FROM truck_inventory ti WHERE ti.truck_id = t.id) AS totalItems,
        (SELECT COUNT(*) FROM truck_inventory ti 
         JOIN inventory_items ii ON ti.item_id = ii.id 
         WHERE ti.truck_id = t.id AND ti.quantity <= ti.min_quantity) AS lowStockItems,
        t.updated_at AS lastUpdated,
        (SELECT COUNT(*) FROM trucks) AS total_count
      FROM trucks t
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (search) {
      query += ` AND (t.truck_number LIKE ? OR t.make LIKE ? OR t.model LIKE ? OR t.location LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ?)`;
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam, searchParam, searchParam, searchParam);
    }

    if (status != "all") {
      query += ` AND t.status = ?`;
      params.push(status);
    }

    if (assigned === "assigned") {
      query += ` AND t.assigned_to IS NOT NULL`;
    } else if (assigned === "unassigned") {
      query += ` AND t.assigned_to IS NULL`;
    }

    query += ` ORDER BY t.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const [results] = await pool.query<any[]>(query, params);

    const total = results.length > 0 ? results[0].total_count : 0;

    const trucks = results.map((row) => ({
      id: row.id,
      truck_number: row.truck_number,
      make: row.make,
      model: row.model,
      year: row.year,
      license_plate: row.license_plate,
      vin: row.vin,
      status: row.status,
      location: row.location,
      mileage: row.mileage,
      next_maintenance: row.next_maintenance,
      assigned_technician: row.technician_id
        ? {
          id: row.technician_id,
          first_name: row.first_name,
          last_name: row.last_name,
          email: row.email,
        }
        : null,
      totalItems: Number(row.totalItems) || 0,
      lowStockItems: Number(row.lowStockItems) || 0,
      bins: Number(row.bins) || 0,
      lastUpdated: row.lastUpdated
        ? new Date(row.lastUpdated).toLocaleString()
        : "Never",
      order_approval: row.order_approval === 1,
    }));


    // stats calculate
    const [statsResult] = await pool.query<any[]>(`
  SELECT 
    SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS activeTrucks,
    SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) AS inactiveTrucks,
    SUM(CASE WHEN status = 'maintenance' THEN 1 ELSE 0 END) AS maintenanceTrucks,
    (SELECT SUM(ti.quantity) FROM truck_inventory ti) AS totalItems,
    (SELECT COUNT(*) 
     FROM truck_inventory ti 
     JOIN inventory_items ii ON ti.item_id = ii.id 
     WHERE ti.quantity <= ti.min_quantity) AS totalLowStock
  FROM trucks;
`);

    const stats = {
      activeTrucks: Number(statsResult[0].activeTrucks) || 0,
      inactiveTrucks: Number(statsResult[0].inactiveTrucks) || 0,
      maintenanceTrucks: Number(statsResult[0].maintenanceTrucks) || 0,
      totalItems: Number(statsResult[0].totalItems) || 0,
      totalLowStock: Number(statsResult[0].totalLowStock) || 0,
    };

    const response = {
      success: true,
      data: {
        trucks,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
        stats,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Trucks API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
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
      assigned_to,
      mileage,
      next_maintenance,
      order_approval
    } = body;

    if (!truck_number || !make || !model || !year || !license_plate || !vin) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing required fields: truck_number, make, model, year, license_plate, vin",
          code: "BAD_REQUEST",
        },
        { status: 400 }
      );
    }

    if (vin.length !== 17) {
      return NextResponse.json(
        {
          success: false,
          error: "VIN must be 17 characters",
          code: "BAD_REQUEST",
        },
        { status: 400 }
      );
    }

    const [existingTruck] = await pool.query(
      `
      SELECT id FROM trucks WHERE truck_number = ? OR license_plate = ? OR vin = ?
      `,
      [truck_number, license_plate, vin]
    );

    if (existingTruck.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Truck number, license plate, or VIN already exists",
          code: "DUPLICATE_ENTRY",
        },
        { status: 400 }
      );
    }

    const [result] = await pool.query(
      `
      INSERT INTO trucks (id, truck_number, make, model, year, license_plate, vin, status, location, mileage, assigned_to, next_maintenance,order_approval, created_at, updated_at)
      VALUES (UUID(), ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?, ?,NOW(), NOW())
      `,
      [
        truck_number,
        make,
        model,
        year,
        license_plate,
        vin,
        location || null,
        mileage || 0,
        assigned_to || null,
        next_maintenance || null,
        order_approval ?? false,
      ]
    );
    // inserted row ka full record le aao
    const [newTruck] = await pool.query(
      `
      SELECT 
        t.*, t.order_approval,
        u.id AS technician_id, u.first_name, u.last_name, u.email
      FROM trucks t
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.truck_number = ?
      ORDER BY t.created_at DESC
      LIMIT 1
      `,
      [truck_number]
    );
    return NextResponse.json({
      success: true,
      data: newTruck[0],
    });
  } catch (error: any) {
    console.error("Create truck error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.sqlMessage || "Failed to create truck",
        code: error.code || "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}
