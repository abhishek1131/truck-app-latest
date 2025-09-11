import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

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

    // Verify user is active
    const [userRows] = await pool.query(
      "SELECT role FROM users WHERE id = ? AND status = 'active'",
      [userId]
    );
    const userData = (userRows as any[])[0];

    if (!userData) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch restock items for assigned trucks
    const [restockItems] = await pool.query(
      `
      SELECT 
        ti.item_id AS id,
        ii.name AS name,
        ti.quantity AS currentStock,
        COALESCE(ii.standard_level, ti.min_quantity) AS standardLevel,
        GREATEST(COALESCE(ii.standard_level, ti.min_quantity) - ti.quantity, 0) AS suggestedQuantity,
        t.id AS truckId,
        t.truck_number AS truck,
        ic.name AS category,
        CASE 
          WHEN (COALESCE(ii.standard_level, ti.min_quantity) - ti.quantity) >= COALESCE(ii.standard_level, ti.min_quantity) * 0.5 THEN 'high'
          WHEN (COALESCE(ii.standard_level, ti.min_quantity) - ti.quantity) >= COALESCE(ii.standard_level, ti.min_quantity) * 0.2 THEN 'medium'
          ELSE 'low'
        END AS priority
      FROM truck_inventory ti
      JOIN inventory_items ii ON ti.item_id = ii.id
      JOIN inventory_categories ic ON ii.category_id = ic.id
      JOIN trucks t ON ti.truck_id = t.id
      WHERE t.assigned_to = ? AND ti.quantity < COALESCE(ii.standard_level, ti.min_quantity)
      ORDER BY t.truck_number, priority DESC, ii.name
      `,
      [userId]
    );

    // Group items by truck
    const groupedByTruck: Record<string, any> = {};

    (restockItems as any[]).forEach((item) => {
      if (!groupedByTruck[item.truckId]) {
        groupedByTruck[item.truckId] = {
          truckId: item.truckId,
          truck: item.truck,
          items: [],
        };
      }
      groupedByTruck[item.truckId].items.push({
        id: item.id,
        name: item.name,
        currentStock: item.currentStock,
        standardLevel: item.standardLevel,
        suggestedQuantity: item.suggestedQuantity,
        category: item.category,
        priority: item.priority,
      });
    });

    // Convert to array
    const response = Object.values(groupedByTruck);

    return NextResponse.json({ trucks: response });
  } catch (error: any) {
    console.error("Restock fetch error:", error);
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
