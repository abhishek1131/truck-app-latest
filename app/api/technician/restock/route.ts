import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

export async function GET(request: NextRequest) {
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

    // Verify technician role
    const [userRows] = await pool.query(
      "SELECT role FROM users WHERE id = ? AND status = 'active'",
      [userId]
    );
    const userData = (userRows as any[])[0];

    if (!userData || userData.role !== "technician") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch restock items for assigned trucks
    const [restockItems] = await pool.query(
      `
      SELECT 
        ti.item_id AS id,
        ii.name AS name,
        ti.quantity AS currentStock,
        tsi.standard_quantity AS standardLevel,
        (tsi.standard_quantity - ti.quantity) AS suggestedQuantity,
        t.truck_number AS truck,
        ic.name AS category,
        CASE 
          WHEN (tsi.standard_quantity - ti.quantity) >= tsi.standard_quantity * 0.5 THEN 'high'
          WHEN (tsi.standard_quantity - ti.quantity) >= tsi.standard_quantity * 0.2 THEN 'medium'
          ELSE 'low'
        END AS priority
      FROM truck_inventory ti
      JOIN inventory_items ii ON ti.item_id = ii.id
      JOIN inventory_categories ic ON ii.category_id = ic.id
      JOIN truck_standard_inventory tsi ON ti.item_id = tsi.item_name AND ti.truck_id = tsi.truck_id AND ti.bin_id = tsi.bin_id
      JOIN trucks t ON ti.truck_id = t.id
      WHERE t.assigned_to = ? AND ti.quantity < tsi.standard_quantity
      ORDER BY priority DESC, t.truck_number, ii.name
      `,
      [userId]
    );

    return NextResponse.json({ restockItems });
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

    // Verify technician role
    const [userRows] = await pool.query(
      "SELECT role FROM users WHERE id = ? AND status = 'active'",
      [userId]
    );
    const userData = (userRows as any[])[0];

    if (!userData || userData.role !== "technician") {
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

    // Get a default supply house (e.g., the first active one)
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
    await connection.query(
      "INSERT INTO restock_orders (id, truck_id, supply_house_id, technician_id, status) VALUES (?, ?, ?, ?, ?)",
      [orderId, items[0].truck, supplyHouse.id, userId, "pending"]
    );

    // Insert restock order items
    for (const item of items) {
      const [truckRows] = await connection.query(
        "SELECT id FROM trucks WHERE truck_number = ? AND assigned_to = ?",
        [item.truck, userId]
      );
      const truck = (truckRows as any[])[0];

      if (!truck) {
        await connection.rollback();
        return NextResponse.json(
          { error: `Truck ${item.truck} not assigned to you` },
          { status: 403 }
        );
      }

      const [binRows] = await connection.query(
        "SELECT id FROM truck_bins WHERE truck_id = ? LIMIT 1"
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
