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

    // Verify technician role
    const [userRows] = await pool.query(
      "SELECT role FROM users WHERE id = ? AND status = 'active'",
      [userId]
    );
    const userData = (userRows as any[])[0];

    // if (!userData || userData.role !== "technician") {
    //   return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    // }

    const { searchParams } = new URL(request.url);
    const truckId = searchParams.get("truck_id") || "";

    // Fetch inventory items with total quantity
const [inventoryRows] = await pool.query(
  `SELECT 
     ii.id,
     ii.part_number,
     ii.name,
     ii.description AS notes,
     COALESCE(ii.unit, 'pieces') AS unit,
     ii.supplier AS brand,
     ic.name AS category,
     ii.min_quantity AS low_stock_threshold,
     COALESCE(ii.standard_level, ii.max_quantity, 10) AS standard_level,
     ii.unit_price,
     COALESCE(SUM(ti.quantity), 0) AS total_quantity
   FROM inventory_items ii
   JOIN inventory_categories ic ON ii.category_id = ic.id
   LEFT JOIN truck_inventory ti ON ti.item_id = ii.id
   WHERE ii.created_by = ?
   GROUP BY ii.id`,
  [userId]
);

    let truckBinItems: any[] = [];
    if (truckId) {
      // Fetch truck bin items
      const [binRows] = await pool.query(
        `SELECT 
           ti.item_id AS inventory_item_id,
           ti.quantity AS current_quantity,
           tb.id AS bin_id,
           tb.name AS bin_name
         FROM truck_inventory ti
         JOIN truck_bins tb ON ti.bin_id = tb.id
         JOIN trucks t ON ti.truck_id = t.id
         WHERE ti.truck_id = ? AND t.assigned_to = ?`,
        [truckId, userId]
      );
      truckBinItems = binRows;
    }

    return NextResponse.json({
      inventoryItems: inventoryRows,
      truckBinItems,
    });
  } catch (error) {
    console.error("Inventory fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  let connection;
  try {
    // 🔑 Auth
    const authHeader = request.headers.get("authorization");
    const token =
      authHeader?.replace("Bearer ", "") ||
      request.cookies.get("access_token")?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || "your_jwt_secret");
    } catch (err) {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 });
    }

    const userId = decoded.id;
    const body = await request.json();
    const { order_id, truck_id, items } = body;

    if (!order_id || !truck_id || !items || items.length === 0) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    for (const item of items) {
      let remaining = item.count;

      // 1️⃣ Get bins for this truck
      const [bins] = await connection.query(
        `SELECT id, max_capacity 
         FROM truck_bins 
         WHERE truck_id = ? 
         ORDER BY id ASC`,
        [truck_id]
      );

      if ((bins as any[]).length === 0) {
        await connection.rollback();
        return NextResponse.json(
          { success: false, error: `No bins found for truck ${truck_id}` },
          { status: 404 }
        );
      }

      for (const bin of bins as any[]) {
        if (remaining <= 0) break;

        // 2️⃣ Check existing inventory in this bin
        const [existingRows] = await connection.query(
          `SELECT id, quantity, max_quantity 
           FROM truck_inventory 
           WHERE truck_id = ? AND bin_id = ? AND item_id = ?`,
          [truck_id, bin.id, item.id]
        );
        const existing = (existingRows as any[])[0];

        const currentQty = existing ? existing.quantity : 0;
        const maxQty = existing?.max_quantity ?? bin.max_capacity ?? 20;

        const available = maxQty - currentQty;

        if (available > 0) {
          const addQty = Math.min(available, remaining);
          const newQty = currentQty + addQty;

          if (existing) {
            // Update
            await connection.query(
              `UPDATE truck_inventory 
               SET quantity = ?, last_restocked = NOW() 
               WHERE id = ?`,
              [newQty, existing.id]
            );
          } else {
            // Insert
            const newId = uuidv4();
            await connection.query(
              `INSERT INTO truck_inventory 
               (id, truck_id, bin_id, item_id, quantity, min_quantity, max_quantity, last_restocked)
               VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
              [newId, truck_id, bin.id, item.id, addQty, 10, maxQty]
            );
          }

          remaining -= addQty;
        }
      }

      // 3️⃣ If still remaining → dump into last bin
      if (remaining > 0) {
        const lastBin = (bins as any[])[(bins as any[]).length - 1];

        const [existingRows] = await connection.query(
          `SELECT id, quantity, max_quantity 
           FROM truck_inventory 
           WHERE truck_id = ? AND bin_id = ? AND item_id = ?`,
          [truck_id, lastBin.id, item.id]
        );
        const existing = (existingRows as any[])[0];

        const addQty = remaining;

        if (existing) {
          await connection.query(
            `UPDATE truck_inventory 
             SET quantity = quantity + ?, last_restocked = NOW() 
             WHERE id = ?`,
            [addQty, existing.id]
          );
        } else {
          const newId = uuidv4();
          await connection.query(
            `INSERT INTO truck_inventory 
             (id, truck_id, bin_id, item_id, quantity, min_quantity, max_quantity, last_restocked)
             VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
            [newId, truck_id, lastBin.id, item.id, addQty, 10, lastBin.max_capacity ?? 20]
          );
        }

        remaining = 0;
      }
    }

    await connection.query(
      `UPDATE orders SET is_stock_item = TRUE WHERE id = ?`,
      [order_id]
    );
    
    await connection.commit();

    return NextResponse.json({
      success: true,
      message: "Stock items distributed into bins successfully",
    });
  } catch (error: any) {
    console.error("Stock Item API Error:", error);

    if (connection) await connection.rollback();

    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}
