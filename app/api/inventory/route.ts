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

    const searchParams = request.nextUrl.searchParams;
    const itemId = searchParams.get("item");

    if (itemId) {
      // Fetch detailed item info
      const [itemRow] = await pool.query(
        `SELECT 
           ii.id,
           ii.part_number AS partNumber,
           ii.name,
           ic.name AS category,
           COALESCE(ii.unit, 'pieces') AS unit,
           ii.supplier AS brand,
           ii.description AS notes,
           COALESCE(ii.standard_level, ii.max_quantity, 10) AS standardLevel,
           ii.min_quantity AS lowStockThreshold,
           ii.cost_price AS unitCost,
           ii.unit_price AS unitPrice,
           ii.supplier
         FROM inventory_items ii
         JOIN inventory_categories ic ON ii.category_id = ic.id
         WHERE ii.id = ?`,
        [itemId]
      );

      if ((itemRow as any[]).length === 0) {
        return NextResponse.json({ error: "Item not found" }, { status: 404 });
      }

      const basic = (itemRow as any[])[0];

      // Total quantity
      const [totalRow] = await pool.query(
        `SELECT SUM(ti.quantity) as totalQuantity 
         FROM truck_inventory ti 
         WHERE ti.item_id = ?
         AND ti.truck_id IN (SELECT id FROM trucks WHERE assigned_to = ?)`,
        [itemId, userId]
      );
      basic.totalQuantity = (totalRow as any)[0].totalQuantity || 0;

      // Last ordered
      const [lastOrderRow] = await pool.query(
        `SELECT MAX(o.created_at) as lastOrdered 
         FROM order_items oi 
         JOIN orders o ON oi.order_id = o.id 
         WHERE oi.item_id = ?
         AND o.technician_id = ?`,
        [itemId, userId]
      );
      basic.lastOrdered = (lastOrderRow as any)[0].lastOrdered
        ? new Date((lastOrderRow as any)[0].lastOrdered)
          .toISOString()
          .split("T")[0]
        : "Never";

      // Last restocked
      const [lastRestockRow] = await pool.query(
        `SELECT MAX(ti.last_restocked) as lastRestocked 
         FROM truck_inventory ti 
         WHERE ti.item_id = ? 
         AND ti.truck_id IN (SELECT id FROM trucks WHERE assigned_to = ?)`,
        [itemId, userId]
      );
      basic.lastRestocked = (lastRestockRow as any)[0].lastRestocked
        ? new Date((lastRestockRow as any)[0].lastRestocked)
          .toISOString()
          .split("T")[0]
        : "Never";

      // Truck bin distribution
      const [distRows] = await pool.query(
        `SELECT 
           t.id as truckId, 
           t.truck_number as truckName, 
           t.location as location,
           tb.id as binId, 
           tb.bin_code as binName, 
           ti.quantity
         FROM truck_inventory ti
         JOIN trucks t ON ti.truck_id = t.id
         JOIN truck_bins tb ON ti.bin_id = tb.id
         WHERE ti.item_id = ?
         AND t.assigned_to = ?
         ORDER BY t.truck_number, tb.bin_code`,
        [itemId, userId]
      );

      const truckMap = new Map();
      (distRows as any[]).forEach((row) => {
        if (!truckMap.has(row.truckId)) {
          truckMap.set(row.truckId, {
            truckId: row.truckId,
            truckName: row.truckName,
            location: row.location,
            bins: [],
          });
        }
        truckMap.get(row.truckId).bins.push({
          binId: row.binId,
          binName: row.binName,
          quantity: row.quantity,
        });
      });
      basic.truckBinDistribution = Array.from(truckMap.values());

      // Recent activity (restocks only)
      const [activityRows] = await pool.query(
        `SELECT 
           o.created_at as date,
           'Restocked' as action,
           oi.quantity,
           t.truck_number as truck,
           tb.bin_code as bin
         FROM order_items oi
         JOIN orders o ON oi.order_id = o.id
         LEFT JOIN trucks t ON o.truck_id = t.id
         LEFT JOIN truck_bins tb ON oi.bin_id = tb.id
         WHERE oi.item_id = ?
         AND o.technician_id = ?
         AND o.status IN ('delivered', 'shipped')
         ORDER BY o.created_at DESC
         LIMIT 10`,
        [itemId, userId]
      );

      basic.recentActivity = (activityRows as any[]).map((row) => ({
        date: new Date(row.date).toLocaleString(),
        action: row.action,
        quantity: row.quantity,
        truck: row.truck || "N/A",
        bin: row.bin || "N/A",
      }));

      return NextResponse.json(basic);
    } else {
      // Get inventory items for assigned trucks
      const [itemRows] = await pool.query(
        `SELECT 
           ii.id AS internal_id,
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
            JOIN trucks t ON ti.truck_id = t.id 
            WHERE ti.item_id = ii.id 
            AND t.assigned_to = ?) AS total_quantity,
           (SELECT GROUP_CONCAT(t.truck_number) 
            FROM truck_inventory ti 
            JOIN trucks t ON ti.truck_id = t.id 
            WHERE ti.item_id = ii.id 
            AND t.assigned_to = ?) AS trucks,
           (SELECT MAX(o.created_at) 
            FROM order_items oi 
            JOIN orders o ON oi.order_id = o.id 
            WHERE oi.item_id = ii.id 
            AND o.technician_id = ?) AS last_ordered,
           ii.created_at
        FROM inventory_items ii
        JOIN inventory_categories ic ON ii.category_id = ic.id
        ORDER BY ii.created_at DESC;`,
        [userId, userId, userId]
      );

      // Get statistics
      const [statsRows] = await pool.query(
        `SELECT 
   -- Total items quantity (sum of all truck inventory quantities)
   (SELECT SUM(ti.quantity) 
    FROM truck_inventory ti 
    JOIN trucks t ON ti.truck_id = t.id 
    WHERE t.assigned_to = ?) AS total_items,

   -- Total unique item types
   (SELECT COUNT(DISTINCT ii.id) 
    FROM inventory_items ii 
    JOIN truck_inventory ti ON ii.id = ti.item_id 
    JOIN trucks t ON ti.truck_id = t.id 
    WHERE t.assigned_to = ?) AS item_types,

   -- Low stock items (count of items where total stock <= min_quantity)
   (SELECT COUNT(*) 
    FROM (
      SELECT ii.id, SUM(ti.quantity) AS total_qty, ii.min_quantity
      FROM inventory_items ii
      JOIN truck_inventory ti ON ii.id = ti.item_id
      JOIN trucks t ON ti.truck_id = t.id
      WHERE t.assigned_to = ?
      GROUP BY ii.id, ii.min_quantity
      HAVING total_qty <= ii.min_quantity
    ) AS low_stock) AS low_stock_items,

   -- Needs restock items (count of items where total stock < max_quantity or standard level)
   (SELECT COUNT(*) 
    FROM (
      SELECT ii.id, SUM(ti.quantity) AS total_qty, COALESCE(ii.max_quantity, 10) AS max_qty
      FROM inventory_items ii
      JOIN truck_inventory ti ON ii.id = ti.item_id
      JOIN trucks t ON ti.truck_id = t.id
      WHERE t.assigned_to = ?
      GROUP BY ii.id, ii.max_quantity
      HAVING total_qty < max_qty
    ) AS restock) AS needs_restock_items;
`,
        [userId, userId, userId, userId]
      );

      // Format inventory items
      const inventoryItems = (itemRows as any[]).map((item) => ({
        internalId: item.internal_id,
        id: item.id_for_ui,
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
        assigned: (item.total_quantity || 0) > 0 || (item.trucks && item.trucks.length > 0),
      }));

      const stats = (statsRows as any[])[0];

      return NextResponse.json({
        inventoryItems,
        stats: {
          totalItems: stats.total_items || 0,
          assignedItem: stats.item_types || 0,
          lowStockItems: stats.low_stock_items || 0,
          needsRestockItems: stats.needs_restock_items || 0,
        },
      });
    }
  } catch (error) {
    console.error("Inventory API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
