import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import jwt from "jsonwebtoken";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; binId: string } }
) {
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

    // Get bin details
    const [binRows] = await pool.query(
      `
      SELECT 
        tb.id,
        tb.name,
        tb.bin_code AS code,
        tb.name AS location,
        t.truck_number,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', ti.item_id,
            'inventory_item_id', ti.item_id,
            'name', ii.name,
            'category', ic.name,
            'current_stock', ti.quantity,
            'standard_level', ii.standard_level,
            'unit', COALESCE(ii.unit, 'pieces'),
            'last_restocked', ti.last_restocked,
            'is_low_stock', ti.quantity <= ii.min_quantity
          )
        ) AS inventory
      FROM truck_bins tb
      JOIN trucks t ON tb.truck_id = t.id
      LEFT JOIN truck_inventory ti ON tb.id = ti.bin_id AND tb.truck_id = ti.truck_id
      LEFT JOIN inventory_items ii ON ti.item_id = ii.id
      LEFT JOIN inventory_categories ic ON ii.category_id = ic.id
      WHERE tb.id = ? AND tb.truck_id = ? AND t.assigned_to = ?
      GROUP BY tb.id, tb.name, tb.bin_code, t.truck_number
      `,
      [params.binId, params.id, userId]
    );

    const bin = (binRows as any[])[0];

    if (!bin) {
      return NextResponse.json(
        { error: "Bin not found or not assigned to your truck" },
        { status: 404 }
      );
    }

    const formattedBin = {
      id: bin.id,
      name: bin.name,
      code: bin.code,
      location: bin.location,
      truckNumber: bin.truck_number,
      inventory: JSON.parse(bin.inventory || "[]").filter(
        (item: any) => item.id
      ),
    };

    return NextResponse.json(formattedBin);
  } catch (error) {
    console.error("Bin details API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; binId: string } }
) {
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

    // Verify truck and bin
    const [truckRows] = await pool.query(
      "SELECT id FROM trucks WHERE id = ? AND assigned_to = ?",
      [params.id, userId]
    );
    const truck = (truckRows as any[])[0];

    if (!truck) {
      return NextResponse.json(
        { error: "Truck not assigned to you" },
        { status: 403 }
      );
    }

    const [binRows] = await pool.query(
      "SELECT id FROM truck_bins WHERE id = ? AND truck_id = ?",
      [params.binId, params.id]
    );
    const bin = (binRows as any[])[0];

    if (!bin) {
      return NextResponse.json({ error: "Bin not found" }, { status: 404 });
    }

    const body = await request.json();
    const { inventory_item_id, quantity } = body;

    if (!inventory_item_id || !quantity || quantity <= 0) {
      return NextResponse.json(
        { error: "Invalid inventory item or quantity" },
        { status: 400 }
      );
    }

    // Start transaction
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Check if item exists
    const [itemRows] = await connection.query(
      "SELECT id FROM inventory_items WHERE id = ?",
      [inventory_item_id]
    );
    const item = (itemRows as any[])[0];

    if (!item) {
      await connection.rollback();
      return NextResponse.json(
        { error: "Inventory item not found" },
        { status: 404 }
      );
    }

    // Add or update truck_inventory
    const [existingInventory] = await connection.query(
      "SELECT quantity FROM truck_inventory WHERE truck_id = ? AND bin_id = ? AND item_id = ?",
      [params.id, params.binId, inventory_item_id]
    );

    if ((existingInventory as any[]).length > 0) {
      await connection.query(
        "UPDATE truck_inventory SET quantity = quantity + ?, last_restocked = NOW() WHERE truck_id = ? AND bin_id = ? AND item_id = ?",
        [quantity, params.id, params.binId, inventory_item_id]
      );
    } else {
      await connection.query(
        "INSERT INTO truck_inventory (truck_id, bin_id, item_id, quantity, min_quantity, max_quantity, last_restocked) VALUES (?, ?, ?, ?, ?, ?, NOW())",
        [
          params.id,
          params.binId,
          inventory_item_id,
          quantity,
          10,
          20,
          new Date(),
        ]
      );
    }

    await connection.commit();

    return NextResponse.json({ message: "Item added to bin successfully" });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error("Add item to bin error:", error);
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



