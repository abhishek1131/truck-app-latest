import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import jwt from "jsonwebtoken";

export async function GET(request: NextRequest) {
  try {
    // Verify JWT token
    const authHeader = request.headers.get("authorization");
    const token =
      authHeader?.replace("Bearer ", "") ||
      request.cookies.get("access_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || "your_jwt_secret");
    } catch (err) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const userId = decoded.id;

    // Verify technician role
    const [userRows] = await pool.query(
      "SELECT role FROM users WHERE id = ? AND status = 'active'",
      [userId]
    );
    const userData = (userRows as any[])[0];

    if (!userData || userData.role !== "technician") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch previous orders
    const [orderRows] = await pool.query(
      `SELECT 
         o.id,
         o.created_at AS date,
         o.status,
         o.truck_id,
         t.truck_number AS truck_name,
         JSON_ARRAYAGG(
           JSON_OBJECT(
             'id', oi.id,
             'inventory_item_id', oi.item_id,
             'quantity', oi.quantity,
             'reason', oi.reason,
             'inventory_item', JSON_OBJECT(
               'id', ii.id,
               'part_number', ii.part_number,
               'name', ii.name,
               'description', ii.description,
               'unit', COALESCE(ii.unit, 'pieces'),
               'supplier', ii.supplier,
               'category', ic.name,
               'standard_level', COALESCE(ii.standard_level, ii.max_quantity, 10),
               'low_stock_threshold', ii.min_quantity
             ),
             'bin', JSON_OBJECT(
               'id', tb.id,
               'bin_code', tb.bin_code,
               'name', tb.name
             ),
             'current_stock', (SELECT ti.quantity 
                              FROM truck_inventory ti 
                              WHERE ti.truck_id = o.truck_id 
                              AND ti.bin_id = oi.bin_id 
                              AND ti.item_id = oi.item_id)
           )
         ) AS items
       FROM orders o
       JOIN trucks t ON o.truck_id = t.id
       LEFT JOIN order_items oi ON o.id = oi.order_id
       LEFT JOIN inventory_items ii ON oi.item_id = ii.id
       LEFT JOIN inventory_categories ic ON ii.category_id = ic.id
       LEFT JOIN truck_bins tb ON oi.bin_id = tb.id
       WHERE o.technician_id = ?
       GROUP BY o.id, o.created_at, o.status, o.truck_id, t.truck_number
       ORDER BY o.created_at DESC`,
      [userId]
    );

    const previousOrders = (orderRows as any[]).map((order) => ({
      id: order.id,
      date: order.date,
      truckId: order.truck_id,
      truckName: order.truck_name,
      items: JSON.parse(order.items)
        .filter((item: any) => item.id)
        .map((item: any) => ({
          id: item.id,
          inventoryItemId: item.inventory_item_id,
          inventoryItem: item.inventory_item,
          requestedQuantity: item.quantity,
          truckId: order.truck_id,
          truckName: order.truck_name,
          binId: item.bin.id,
          binName: item.bin.name,
          currentStock: item.current_stock,
          reason: item.reason,
        })),
      totalItems: JSON.parse(order.items).reduce(
        (sum: number, item: any) => sum + (item.quantity || 0),
        0
      ),
      status: order.status,
    }));

    return NextResponse.json({ previousOrders });
  } catch (error) {
    console.error("Previous orders fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
