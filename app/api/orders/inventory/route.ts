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

    const { searchParams } = new URL(request.url);
    const truckId = searchParams.get("truck_id") || "";

    // Fetch inventory items
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
         ii.unit_price
       FROM inventory_items ii
       JOIN inventory_categories ic ON ii.category_id = ic.id`,
      []
    );
    console.log(inventoryRows);

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
