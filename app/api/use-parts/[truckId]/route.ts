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

    // Fetch all inventory items created by the current user with current stock
    const [rows] = await pool.query(
      `SELECT 
         ii.id AS item_id,
         ii.name AS item_name,
         ii.part_number,
         ii.brand,
         ii.description,
         ii.unit_price,
         ii.cost_price,
         ii.unit,
         ii.min_quantity AS minThreshold,
         ii.standard_level AS standardLevel,
         ic.name AS category,
         ii.created_at,
         ii.updated_at,
         COALESCE(SUM(ti.quantity), 0) AS currentStock
       FROM inventory_items ii
       LEFT JOIN inventory_categories ic ON ii.category_id = ic.id
       LEFT JOIN truck_inventory ti ON ii.id = ti.item_id
       WHERE ii.created_by = ?
       GROUP BY ii.id, ii.name, ii.part_number, ii.brand, ii.description, 
                ii.unit_price, ii.cost_price, ii.unit, ii.min_quantity, 
                ii.standard_level, ic.name, ii.created_at, ii.updated_at
       ORDER BY ii.created_at DESC`,
      [userId]
    );

    const items = (rows as any[]).map((row) => ({
      id: row.item_id,
      name: row.item_name,
      partNumber: row.part_number,
      brand: row.brand,
      description: row.description,
      unitPrice: row.unit_price,
      costPrice: row.cost_price,
      unit: row.unit,
      minThreshold: row.minThreshold,
      standardLevel: row.standardLevel,
      category: row.category,
      currentStock: row.currentStock,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
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
