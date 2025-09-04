import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import jwt from "jsonwebtoken";
import crypto from "crypto";

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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status") || "";
    const truck = searchParams.get("truck") || "";

    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        o.id,
        o.created_at AS date,
        o.status,
        o.urgency,
        o.notes,
        sh.name AS supply_house,
        t.truck_number,
        t.make,
        t.model,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', oi.id,
            'inventory_item_id', oi.item_id,
            'quantity', oi.quantity,
            'unit_price', oi.unit_price,
            'total_price', oi.total_price,
            'reason', oi.reason,
            'inventory_item', JSON_OBJECT(
              'id', ii.id,
              'part_number', ii.part_number,
              'name', ii.name,
              'description', ii.description,
              'unit', COALESCE(ii.unit, 'pieces'),
              'supplier', ii.supplier,
              'category', ic.name
            ),
            'bin', JSON_OBJECT(
              'id', tb.id,
              'bin_code', tb.bin_code,
              'name', tb.name
            )
          )
        ) AS order_items
      FROM orders o
      LEFT JOIN supply_houses sh ON o.supply_house_id = sh.id
      LEFT JOIN trucks t ON o.truck_id = t.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN inventory_items ii ON oi.item_id = ii.id
      LEFT JOIN inventory_categories ic ON ii.category_id = ic.id
      LEFT JOIN truck_bins tb ON oi.bin_id = tb.id
      WHERE o.technician_id = ?
    `;
    const queryParams: any[] = [userId];

    if (status != 'all') {
      query += " AND o.status = ?";
      queryParams.push(status);
    }

    if (truck) {
      query += " AND o.truck_id = ?";
      queryParams.push(truck);
    }

    query += `
      GROUP BY o.id, o.created_at, o.status, o.urgency, o.notes, sh.name, t.truck_number, t.make, t.model
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `;
    queryParams.push(limit, offset);

    const [ordersRows] = await pool.query(query, queryParams);

    // Count total orders for pagination
    let countQuery = `
      SELECT COUNT(*) AS total
      FROM orders o
      WHERE o.technician_id = ?
    `;
    const countParams: any[] = [userId];
    
    if (status != 'all') {
      console.log("true")
      countQuery += " AND o.status = ?";
      countParams.push(status);
    }

    if (truck) {
      countQuery += " AND o.truck_id = ?";
      countParams.push(truck);
    }

    const [countRows] = await pool.query(countQuery, countParams);
    const total = (countRows as any[])[0].total;

    // Format orders
    const orders = (ordersRows as any[]).map((order) => ({
      id: order.id,
      partName: order.order_items[0]?.inventory_item?.name || "Multiple Items",
      quantity: order.order_items.reduce(
        (sum: number, item: any) => sum + item.quantity,
        0
      ),
      cost: order.order_items.reduce(
        (sum: number, item: any) => sum + item.total_price,
        0
      ),
      status: order.status,
      date: order.date.toISOString().split("T")[0],
      commission: order.order_items.reduce(
        (sum: number, item: any) => sum + item.total_price * 0.03,
        0
      ),
      credit: order.order_items.reduce(
        (sum: number, item: any) => sum + item.total_price * 0.03 * 0.25,
        0
      ),
      supplyHouse: order.supply_house || "Unknown",
      urgency: order.urgency || "normal",
      description:
        order.order_items[0]?.inventory_item?.description || order.notes || "",
      orderItems: (order.order_items).filter((item: any) => item.id),
      truck: {
        id: order.truck_id,
        truckNumber: order.truck_number,
        make: order.make,
        model: order.model,
      },
    }));

    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Orders fetch error:", error);
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

    const body = await request.json();
    console.log("body", body);
    const { truck_id, items, notes, supply_house_id, urgency } = body;

    // Validate truck if provided
    if (truck_id) {
      const [truckRows] = await pool.query(
        "SELECT id FROM trucks WHERE id = ? AND assigned_to = ?",
        [truck_id, userId]
      );
      const truck = (truckRows as any[])[0];

      if (!truck) {
        return NextResponse.json(
          { error: "Truck not assigned to you" },
          { status: 403 }
        );
      }
    }

    // Start transaction
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Handle inventory items
    const orderItems = [];
    for (const item of items) {
      let inventoryItemId = item.inventory_item_id;

      if (item.inventory_item_name && !inventoryItemId) {
        // Check if inventory item exists
        const [inventoryRows] = await connection.query(
          `SELECT id FROM inventory_items WHERE name = ?`,
          [item.inventory_item_name]
        );
        inventoryItemId = (inventoryRows as any[])[0]?.id;

        if (!inventoryItemId) {
          // Create new inventory item
          const [categoryRows] = await connection.query(
            `SELECT id FROM inventory_categories WHERE name = 'General'`
          );
          let categoryId = (categoryRows as any[])[0]?.id;

          if (!categoryId) {
            await connection.query(
              `INSERT INTO inventory_categories (id, name, created_at) VALUES (UUID(), 'General', NOW())`
            );
            const [newCategory] = await connection.query(
              `SELECT id FROM inventory_categories WHERE name = 'General'`
            );
            categoryId = (newCategory as any[])[0].id;
          }

          const partNumber = `PART-${Date.now()}-${Math.floor(
            Math.random() * 1000
          )}`;
          await connection.query(
            `INSERT INTO inventory_items
             (id, part_number, name, description, category_id, unit_price, cost_price, supplier, min_quantity, max_quantity, standard_level, unit, created_at, updated_at)
             VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [
              partNumber,
              item.inventory_item_name,
              item.reason || "",
              categoryId,
              item.unit_price || 0,
              0,
              "",
              10,
              20,
              20,
              "pieces",
            ]
          );

          const [newItem] = await connection.query(
            `SELECT id FROM inventory_items WHERE part_number = ?`,
            [partNumber]
          );
          inventoryItemId = (newItem as any[])[0].id;
        }
      }

      orderItems.push([
        inventoryItemId,
        item.bin_id,
        item.quantity,
        item.unit_price,
        item.quantity * item.unit_price,
        item.reason || "Additional stock needed",
      ]);
    }

    // Create order
    const orderId = crypto.randomUUID();
    await connection.query(
      `INSERT INTO orders (id, technician_id, truck_id, supply_house_id, notes, status, urgency, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'pending', ?, NOW(), NOW())`,
      [
        orderId,
        userId,
        truck_id || null,
        supply_house_id,
        notes || "",
        urgency || "normal",
      ]
    );

    // Create order items
    await connection.query(
      `INSERT INTO order_items (id, order_id, item_id, bin_id, quantity, unit_price, total_price, reason)
       VALUES ?`,
      [orderItems.map((item) => [crypto.randomUUID(), orderId, ...item])]
    );

    // Update truck inventory if truck_id is provided
    if (truck_id) {
      for (const item of items) {
        if (item.bin_id && item.inventory_item_id) {
          await connection.query(
            `UPDATE truck_inventory
             SET quantity = quantity - ?,
                 last_restocked = NOW()
             WHERE truck_id = ? AND bin_id = ? AND item_id = ?`,
            [item.quantity, truck_id, item.bin_id, item.inventory_item_id]
          );
        }
      }
    }

    // Fetch the new order
    const [newOrderRows] = await connection.query(
      `SELECT
         o.id,
         o.created_at AS date,
         o.status,
         o.urgency,
         o.notes,
         sh.name AS supply_house,
         t.truck_number,
         t.make,
         t.model,
         JSON_ARRAYAGG(
           JSON_OBJECT(
             'id', oi.id,
             'inventory_item_id', oi.item_id,
             'quantity', oi.quantity,
             'unit_price', oi.unit_price,
             'total_price', oi.total_price,
             'reason', oi.reason,
             'inventory_item', JSON_OBJECT(
               'id', ii.id,
               'part_number', ii.part_number,
               'name', ii.name,
               'description', ii.description,
               'unit', COALESCE(ii.unit, 'pieces'),
               'supplier', ii.supplier,
               'category', ic.name
             ),
             'bin', JSON_OBJECT(
               'id', tb.id,
               'bin_code', tb.bin_code,
               'name', tb.name
             )
           )
         ) AS order_items
       FROM orders o
       LEFT JOIN supply_houses sh ON o.supply_house_id = sh.id
       LEFT JOIN trucks t ON o.truck_id = t.id
       LEFT JOIN order_items oi ON o.id = oi.order_id
       LEFT JOIN inventory_items ii ON oi.item_id = ii.id
       LEFT JOIN inventory_categories ic ON ii.category_id = ic.id
       LEFT JOIN truck_bins tb ON oi.bin_id = tb.id
       WHERE o.id = ?
       GROUP BY o.id, o.created_at, o.status, o.urgency, o.notes, sh.name, t.truck_number, t.make, t.model`,
      [orderId]
    );

    await connection.commit();

    const newOrder = (newOrderRows as any[])[0];
    newOrder.order_items = newOrder.order_items.filter((item: any) => item.id);

    return NextResponse.json({
      message: "Order created successfully",
      order: newOrder,
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error("Create order error:", error);
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
 
 
 
 
 
