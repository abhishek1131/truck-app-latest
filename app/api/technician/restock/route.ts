import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

export async function GET(request: NextRequest) {
  try {
    // Get token
    const authHeader = request.headers.get("authorization");
    const token =
      authHeader?.replace("Bearer ", "") ||
      request.cookies.get("access_token")?.value;

    if (!token)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Verify token
    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || "your_jwt_secret");
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const userId = decoded.id;

    // Check active user
    const [userRows] = await pool.query(
      "SELECT role FROM users WHERE id = ? AND status = 'active'",
      [userId]
    );
    const userData = (userRows as any[])[0];

    if (!userData || userData.role !== "technician") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    // Fetch items where total bin quantity < standard_level
    const [rows] = await pool.query(
      `
      SELECT 
        ti.item_id AS id,
        ii.name AS name,
        ic.name AS category,
        ti.quantity AS currentStock,
        COALESCE(ii.standard_level, ti.min_quantity) AS standardLevel,
        t.id AS truckId,
        t.truck_number AS truck,
        tb.id AS binId,
        tb.name AS binName,
        tb.location AS binLocation,
        total_quantity.totalQty,
        CASE 
          WHEN (COALESCE(ii.standard_level, ti.min_quantity) - total_quantity.totalQty) >= COALESCE(ii.standard_level, ti.min_quantity) * 0.5 THEN 'high'
          WHEN (COALESCE(ii.standard_level, ti.min_quantity) - total_quantity.totalQty) >= COALESCE(ii.standard_level, ti.min_quantity) * 0.2 THEN 'medium'
          ELSE 'low'
        END AS priority
      FROM truck_inventory ti
      JOIN inventory_items ii ON ti.item_id = ii.id
      JOIN inventory_categories ic ON ii.category_id = ic.id
      JOIN trucks t ON ti.truck_id = t.id
      JOIN truck_bins tb ON ti.bin_id = tb.id
      JOIN (
        SELECT 
          ti2.item_id,
          SUM(ti2.quantity) AS totalQty
        FROM truck_inventory ti2
        JOIN trucks t2 ON ti2.truck_id = t2.id
        WHERE t2.assigned_to = ?
        GROUP BY ti2.item_id
      ) total_quantity ON ti.item_id = total_quantity.item_id
      WHERE t.assigned_to = ? 
        AND total_quantity.totalQty < COALESCE(ii.standard_level, ti.min_quantity)
      ORDER BY priority DESC, ii.name
      `,
      [userId, userId]
    );

    console.log("rows", rows);
    // Group items by id
    const restockItems: Record<string, any> = {};

    (rows as any[]).forEach((row) => {
      if (!restockItems[row.id]) {
        restockItems[row.id] = {
          id: row.id,
          name: row.name,
          category: row.category,
          priority: row.priority,
          totalCurrentStock: row.totalQty, // Use total quantity from all bins
          totalStandardLevel: row.standardLevel,
          suggestedQuantity: 0,
          locations: [],
        };
      }

      const suggestedQty = Math.max(row.standardLevel - row.currentStock, 0);

      // Only include bins that need restocking
      if (suggestedQty > 0) {
        restockItems[row.id].locations.push({
          truckId: row.truckId,
          truck: row.truck,
          binId: row.binId,
          binName: row.binName,
          binLocation: row.binLocation,
          currentStock: row.currentStock,
          standardLevel: row.standardLevel,
          suggestedQuantity: suggestedQty,
        });
      }
    });

    // Compute overall suggested quantity per item
    const filteredItems = Object.values(restockItems)
      .map((item: any) => ({
        ...item,
        suggestedQuantity: Math.max(
          item.totalStandardLevel - item.totalCurrentStock,
          0
        ),
      }))
      .filter((item: any) => item.suggestedQuantity > 0); // remove items with 0 suggestedQuantity

    // Sort by priority
    const priorityOrder: { [key: string]: number } = { high: 3, medium: 2, low: 1 };
    filteredItems.sort((a: any, b: any) => priorityOrder[b.priority] - priorityOrder[a.priority]);

    return NextResponse.json({ items: filteredItems });
  } catch (error: any) {
    console.error("Restock fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let connection;
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

    // Verify user is active
    const [userRows] = await pool.query(
      "SELECT role FROM users WHERE id = ? AND status = 'active'",
      [userId]
    );
    const userData = (userRows as any[])[0];

    if (!userData) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { items } = await request.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Invalid items data" },
        { status: 400 }
      );
    }

    // Start transaction
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Get a default supply house
    const [supplyHouseRows] = await connection.query(
      "SELECT id FROM supply_houses WHERE status = 'active' LIMIT 1"
    );
    const supplyHouse = (supplyHouseRows as any[])[0];

    if (!supplyHouse) {
      await connection.rollback();
      return NextResponse.json(
        { error: "No active supply house found" },
        { status: 400 }
      );
    }

    // Create restock order
    const orderId = uuidv4();
    const [truckRows] = await connection.query(
      "SELECT id FROM trucks WHERE truck_number = ? AND assigned_to = ?",
      [items[0].truck, userId]
    );
    const truck = (truckRows as any[])[0];

    if (!truck) {
      await connection.rollback();
      return NextResponse.json(
        { error: `Truck ${items[0].truck} not assigned to you` },
        { status: 403 }
      );
    }

    await connection.query(
      "INSERT INTO restock_orders (id, truck_id, supply_house_id, technician_id, status) VALUES (?, ?, ?, ?, ?)",
      [orderId, truck.id, supplyHouse.id, userId, "pending"]
    );

    // Validate and insert restock order items
    const invalidItems: string[] = [];
    for (const item of items) {
      // Validate item_id exists in inventory_items
      const [itemRows] = await connection.query(
        "SELECT id FROM inventory_items WHERE id = ?",
        [item.id]
      );
      if ((itemRows as any[]).length === 0) {
        invalidItems.push(item.id);
        continue;
      }

      const [binRows] = await connection.query(
        "SELECT id FROM truck_bins WHERE truck_id = ? LIMIT 1",
        [truck.id]
      );
      const bin = (binRows as any[])[0];

      if (!bin) {
        await connection.rollback();
        return NextResponse.json(
          { error: `No bins found for truck ${item.truck}` },
          { status: 404 }
        );
      }

      await connection.query(
        "INSERT INTO restock_order_items (id, restock_order_id, item_id, bin_id, quantity) VALUES (?, ?, ?, ?, ?)",
        [uuidv4(), orderId, item.id, bin.id, item.suggestedQuantity]
      );
    }

    if (invalidItems.length > 0) {
      await connection.rollback();
      return NextResponse.json(
        {
          error: `Invalid item IDs: ${invalidItems.join(
            ", "
          )} not found in inventory_items`,
        },
        { status: 400 }
      );
    }

    // Log activity
    await connection.query(
      "INSERT INTO activities (id, type, message, status, user_id) VALUES (?, ?, ?, ?, ?)",
      [
        uuidv4(),
        "order",
        `Restock order #${orderId} created by technician`,
        "new",
        userId,
      ]
    );

    await connection.commit();

    return NextResponse.json({
      message: "Restock order submitted successfully",
      orderId,
    });
  } catch (error: any) {
    if (connection) {
      await connection.rollback();
    }
    console.error("Restock submit error:", error);
    if (error.code === "ER_NO_REFERENCED_ROW_2") {
      return NextResponse.json(
        { error: `Foreign key constraint failed: Invalid item_id` },
        { status: 400 }
      );
    }
    if (error.code === "ER_BAD_FIELD_ERROR") {
      return NextResponse.json(
        { error: `Database schema error: ${error.sqlMessage}` },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
