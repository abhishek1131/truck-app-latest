import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { verify } from "jsonwebtoken";

interface Order {
  id: string;
  order_number: string;
  technician: string;
  technician_email: string;
  technician_phone: string | null;
  truck_id: string;
  truck_number: string;
  status: string;
  urgency: string;
  total_amount: number;
  commission: number;
  credit: number;
  created_at: string;
  items: {
    id: string;
    part_name: string;
    part_number: string;
    bin_code: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    category: string;
    description: string;
  }[];
}

interface OrdersResponse {
  success: boolean;
  data?: {
    orders: Order[];
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

    const { searchParams } = new URL(req.url);
    const page = Number.parseInt(searchParams.get("page") || "1");
    const limit = Number.parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status") || "";
    const technician = searchParams.get("technician") || "";
    const truck = searchParams.get("truck") || "";
    const search = searchParams.get("search") || "";

    let query = `
      SELECT 
        o.id,
        o.order_number,
        CONCAT(u.first_name, ' ', u.last_name) as technician,
        u.email as technician_email,
        u.phone as technician_phone,
        t.id as truck_id,
        t.truck_number,
        o.status,
        o.urgency,
        o.total_amount,
        o.commission,
        o.credit,
        o.created_at,
        oi.id as item_id,
        oi.part_number,
        oi.bin_code,
        oi.quantity,
        oi.unit_price,
        oi.total_price,
        oi.category,
        oi.description
      FROM orders o
      JOIN users u ON o.technician_id = u.id
      JOIN trucks t ON o.truck_id = t.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
    `;

    const conditions: string[] = [];
    const values: any[] = [];

    if (status) {
      conditions.push("o.status = ?");
      values.push(status);
    }
    if (technician) {
      conditions.push("u.id = ?");
      values.push(technician);
    }
    if (truck) {
      conditions.push("t.id = ?");
      values.push(truck);
    }
    if (search) {
      conditions.push(
        `(u.first_name LIKE ? OR u.last_name LIKE ? OR o.id LIKE ? OR o.order_number LIKE ? OR t.truck_number LIKE ? OR oi.part_number LIKE ?)`
      );
      const searchTerm = `%${search}%`;
      values.push(
        searchTerm,
        searchTerm,
        searchTerm,
        searchTerm,
        searchTerm,
        searchTerm
      );
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY o.created_at DESC";

    const from = (page - 1) * limit;
    query += ` LIMIT ${limit} OFFSET ${from}`;

    const [rows] = await pool.query(query, values);

    const [countResult] = await pool.query(
      `SELECT COUNT(DISTINCT o.id) as total FROM orders o
       JOIN users u ON o.technician_id = u.id
       JOIN trucks t ON o.truck_id = t.id
       LEFT JOIN order_items oi ON o.id = oi.order_id
       ${conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : ""}`,
      values
    );

    const total = (countResult as any)[0].total;

    const ordersMap: { [key: string]: Order } = {};
    (rows as any[]).forEach((row) => {
      if (!ordersMap[row.id]) {
        ordersMap[row.id] = {
          id: row.id,
          order_number: row.order_number,
          technician: row.technician,
          technician_email: row.technician_email,
          technician_phone: row.technician_phone,
          truck_id: row.truck_id,
          truck_number: row.truck_number,
          status: row.status,
          urgency: row.urgency,
          total_amount: parseFloat(row.total_amount || 0),
          commission: parseFloat(row.commission || 0),
          credit: parseFloat(row.credit || 0),
          created_at: new Date(row.created_at).toISOString().split("T")[0],
          items: [],
        };
      }
      if (row.item_id) {
        ordersMap[row.id].items.push({
          id: row.item_id,
          part_name: row.description || row.part_number, // Use description as part_name, fallback to part_number
          part_number: row.part_number || "",
          bin_code: row.bin_code || "",
          quantity: row.quantity,
          unit_price: parseFloat(row.unit_price || 0),
          total_price: parseFloat(row.total_price || 0),
          category: row.category || "",
          description: row.description || "",
        });
      }
    });

    const orders = Object.values(ordersMap);

    return NextResponse.json({
      success: true,
      data: {
        orders,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    console.error("Orders GET error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.sqlMessage || "Failed to fetch orders",
        code: error.code || "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}
