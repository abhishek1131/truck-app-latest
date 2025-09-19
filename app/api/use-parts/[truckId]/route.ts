import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import jwt from "jsonwebtoken";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ truckId: string }> }
) {
  try {
    const { truckId } = await context.params;
    // Verify JWT token
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

    // Check truck access
    const [truckRows] = await pool.query(
      "SELECT assigned_to FROM trucks WHERE id = ?",
      [truckId]
    );
    const truck = (truckRows as any[])[0];

    if (!truck || truck.assigned_to !== userId) {
      return NextResponse.json({ success: false, error: "Access denied" }, { status: 403 });
    }

    // Fetch items with bins
    const [rows] = await pool.query(
      `SELECT 
         ii.id AS item_id,
         ii.name AS item_name,
         SUM(ti.quantity) AS currentStock,
         MIN(ti.min_quantity) AS minThreshold,
         ii.standard_level AS standardLevel,
         JSON_ARRAYAGG(
            JSON_OBJECT(
                'id', tb.id,
                'name', tb.name
            )
         ) AS bins
       FROM truck_inventory ti
       JOIN inventory_items ii ON ti.item_id = ii.id
       JOIN truck_bins tb ON ti.bin_id = tb.id
       WHERE ti.truck_id = ?
       GROUP BY ii.id, ii.name`,
      [truckId]
    );

    const items = (rows as any[]).map((row) => ({
      id: row.item_id,
      name: row.item_name,
      currentStock: row.currentStock,
      minThreshold: row.minThreshold,
      standardLevel: row.standardLevel,
      bins: row.bins,
    }));

    return NextResponse.json({ success: true, items });
  } catch (error) {
    console.error("Truck items API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
