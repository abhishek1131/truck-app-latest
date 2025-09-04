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

    // Get inventory items for assigned trucks
    const [itemRows] = await pool.query(
      `SELECT 
         ii.id,
         ii.part_number AS id_for_ui,
         ii.name,
         ic.name AS category,
         COALESCE(ii.unit, 'pieces') AS unit,
         ii.supplier AS brand,
         ii.description AS notes,
         COALESCE(ii.standard_level, ii.max_quantity, 10) AS standard_level,
         ii.min_quantity AS low_stock_threshold,
         (SELECT SUM(ti.quantity) 
          FROM truck_inventory ti 
          WHERE ti.item_id = ii.id 
          AND ti.truck_id IN (SELECT id FROM trucks WHERE assigned_to = ?)) AS total_quantity,
         (SELECT GROUP_CONCAT(t.truck_number) 
          FROM truck_inventory ti 
          JOIN trucks t ON ti.truck_id = t.id 
          WHERE ti.item_id = ii.id 
          AND t.assigned_to = ?) AS trucks,
         (SELECT MAX(o.created_at) 
          FROM order_items oi 
          JOIN orders o ON oi.order_id = o.id 
          WHERE oi.item_id = ii.id 
          AND o.technician_id = ?) AS last_ordered
       FROM inventory_items ii
       JOIN inventory_categories ic ON ii.category_id = ic.id
       WHERE EXISTS (
         SELECT 1 
         FROM truck_inventory ti 
         JOIN trucks t ON ti.truck_id = t.id 
         WHERE ti.item_id = ii.id 
         AND t.assigned_to = ?
       )`,
      [userId, userId, userId, userId]
    );

    // Get statistics
    const [statsRows] = await pool.query(
      `SELECT 
         (SELECT SUM(ti.quantity) 
          FROM truck_inventory ti 
          JOIN trucks t ON ti.truck_id = t.id 
          WHERE t.assigned_to = ?) AS total_items,
         (SELECT COUNT(DISTINCT ii.id) 
          FROM inventory_items ii 
          JOIN truck_inventory ti ON ii.id = ti.item_id 
          JOIN trucks t ON ti.truck_id = t.id 
          WHERE t.assigned_to = ?) AS item_types,
         (SELECT COUNT(*) 
          FROM truck_inventory ti 
          JOIN trucks t ON ti.truck_id = t.id 
          WHERE t.assigned_to = ? 
          AND ti.quantity <= ti.min_quantity) AS low_stock_items,
         (SELECT COUNT(*) 
          FROM truck_inventory ti 
          JOIN trucks t ON ti.truck_id = t.id 
          WHERE t.assigned_to = ? 
          AND ti.quantity < COALESCE(ti.max_quantity, 10)) AS needs_restock_items`,
      [userId, userId, userId, userId]
    );

    // Format inventory items
    const inventoryItems = (itemRows as any[]).map((item) => ({
      id: item.id_for_ui, // Use part_number as ID for UI
      name: item.name,
      category: item.category,
      totalQuantity: item.total_quantity || 0,
      lowStockThreshold: item.low_stock_threshold,
      standardLevel: item.standard_level,
      lastOrdered: item.last_ordered
        ? new Date(item.last_ordered).toISOString().split("T")[0]
        : "Never",
      trucks: item.trucks ? item.trucks.split(",") : [],
      notes: item.notes,
      unit: item.unit,
      partNumber: item.id_for_ui,
      brand: item.brand,
    }));

    const stats = (statsRows as any[])[0];

    return NextResponse.json({
      inventoryItems,
      stats: {
        totalItems: stats.total_items || 0,
        itemTypes: stats.item_types || 0,
        lowStockItems: stats.low_stock_items || 0,
        needsRestockItems: stats.needs_restock_items || 0,
      },
    });
  } catch (error) {
    console.error("Inventory API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
