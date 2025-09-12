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

    // if (!userData || userData.role !== "technician") {
    //   return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    // }

    // Get assigned trucks
    const [truckRows] = await pool.query(
      `SELECT 
         t.id,
         t.truck_number,
         COALESCE(t.name, t.truck_number) AS name,
         t.status,
         (SELECT COUNT(*) FROM truck_bins tb WHERE tb.truck_id = t.id) AS bin_count,
         (SELECT SUM(ti.quantity) FROM truck_inventory ti WHERE ti.truck_id = t.id) AS total_items,
         (SELECT COUNT(*) FROM truck_inventory ti 
          JOIN inventory_items ii ON ti.item_id = ii.id 
          WHERE ti.truck_id = t.id AND ti.quantity < ti.min_quantity) AS low_stock
       FROM trucks t
       WHERE t.assigned_to = ? AND t.status = 'active'`,
      [userId]
    );

    // Get recent orders
    const [orderRows] = await pool.query(
      `SELECT 
         o.id,
         o.order_number,
         COALESCE(o.type, 'restock') AS type,
         o.truck_id,
         t.truck_number,
         o.status,
         o.commission,
         o.created_at,
         (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) AS item_count
       FROM orders o
       LEFT JOIN trucks t ON o.truck_id = t.id
       WHERE o.technician_id = ?
       ORDER BY o.created_at DESC
       LIMIT 5`,
      [userId]
    );

    // Get statistics
    const [totalItemsRow] = await pool.query(
      `SELECT SUM(ti.quantity) AS total_items
       FROM truck_inventory ti
       JOIN trucks t ON ti.truck_id = t.id
       WHERE t.assigned_to = ?`,
      [userId]
    );
    const [lowStockRow] = await pool.query(
      `SELECT COUNT(*) AS low_stock
       FROM truck_inventory ti
       JOIN trucks t ON ti.truck_id = t.id
       WHERE t.assigned_to = ? AND ti.quantity < ti.min_quantity`,
      [userId]
    );
    const [totalOrdersRow] = await pool.query(
      `SELECT COUNT(*) AS total_orders
       FROM orders
       WHERE technician_id = ?`,
      [userId]
    );

    // Format trucks
    const trucks = (truckRows as any[]).map((truck) => ({
      id: truck.id, // Use truck_number as ID for UI consistency
      name: truck.name,
      items: truck.total_items || 0,
      lowStock: truck.low_stock || 0,
      status: truck.low_stock > 0 ? "needs_attention" : truck.status,
    }));

    // Format recent orders
    const recentOrders = (orderRows as any[]).map((order) => ({
      id: order.order_number,
      type: order.type,
      items: order.item_count,
      truck: order.truck_number,
      date: new Date(order.created_at).toISOString().split("T")[0],
      status: order.status,
      commission: order.commission || 0,
    }));

    // Calculate stats
    const totalItems = (totalItemsRow as any[])[0].total_items || 0;
    const totalLowStock = (lowStockRow as any[])[0].low_stock || 0;
    const totalOrders = (totalOrdersRow as any[])[0].total_orders || 0;

    const dashboard = {
      trucks,
      recentOrders,
      stats: {
        totalTrucks: trucks.length,
        totalItems,
        totalLowStock,
        totalOrders,
      },
    };

    return NextResponse.json(dashboard);
  } catch (error) {
    console.error("Technician dashboard error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
