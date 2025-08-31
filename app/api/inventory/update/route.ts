import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import jwt from "jsonwebtoken";

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

    const body = await request.json();
    const { truck_id, bin_id, inventory_item_id, quantity_change, action } =
      body;

    // Verify truck is assigned to this technician
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

    // Start transaction
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Update inventory
    await connection.query(
      `UPDATE truck_inventory 
       SET quantity = quantity + ?, 
           last_restocked = ? 
       WHERE truck_id = ? AND bin_id = ? AND item_id = ?`,
      [quantity_change, new Date(), truck_id, bin_id, inventory_item_id]
    );

    // Get updated inventory item
    const [updatedRows] = await connection.query(
      `SELECT 
         ti.id,
         ti.quantity,
         ti.min_quantity,
         ti.max_quantity,
         ti.last_restocked,
         ii.part_number,
         ii.name,
         ii.description,
         COALESCE(ii.unit, 'pieces') AS unit,
         ii.supplier AS brand,
         ic.name AS category,
         tb.bin_code,
         tb.name AS bin_name
       FROM truck_inventory ti
       JOIN inventory_items ii ON ti.item_id = ii.id
       JOIN inventory_categories ic ON ii.category_id = ic.id
       JOIN truck_bins tb ON ti.bin_id = tb.id
       WHERE ti.truck_id = ? AND ti.bin_id = ? AND ti.item_id = ?`,
      [truck_id, bin_id, inventory_item_id]
    );

    await connection.commit();

    const updatedItem = (updatedRows as any[])[0];

    return NextResponse.json({
      message: "Inventory updated successfully",
      item: {
        id: updatedItem.id,
        partNumber: updatedItem.part_number,
        name: updatedItem.name,
        description: updatedItem.description,
        unit: updatedItem.unit,
        brand: updatedItem.brand,
        category: updatedItem.category,
        quantity: updatedItem.quantity,
        minQuantity: updatedItem.min_quantity,
        maxQuantity: updatedItem.max_quantity,
        lastRestocked: updatedItem.last_restocked
          ? new Date(updatedItem.last_restocked).toISOString().split("T")[0]
          : "Never",
        bin: {
          binCode: updatedItem.bin_code,
          name: updatedItem.bin_name,
        },
      },
      action,
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error("Update inventory error:", error);
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
