import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import jwt from "jsonwebtoken";

export async function GET(
  request: NextRequest,
  { params }: { params: { truckId: string } }
) {
  try {
    // Verify JWT token
    const authHeader = request.headers.get("authorization");
    const token =
      authHeader?.replace("Bearer ", "") ||
      request.cookies.get("access_token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || "your_jwt_secret");
    } catch (err) {
      return NextResponse.json(
        { success: false, error: "Invalid token" },
        { status: 401 }
      );
    }

    const userId = decoded.id;

    // Check if technician has access to this truck
    const [truckRows] = await pool.query(
      "SELECT assigned_to FROM trucks WHERE id = ?",
      [params.truckId]
    );
    const truck = (truckRows as any[])[0];

    if (!truck || truck.assigned_to !== userId) {
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 }
      );
    }

    // Get truck inventory
    const [inventoryRows] = await pool.query(
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
       WHERE ti.truck_id = ?`,
      [params.truckId]
    );

    const inventory = (inventoryRows as any[]).map((item) => ({
      id: item.id,
      partNumber: item.part_number,
      name: item.name,
      description: item.description,
      unit: item.unit,
      brand: item.brand,
      category: item.category,
      quantity: item.quantity,
      minQuantity: item.min_quantity,
      maxQuantity: item.max_quantity,
      lastRestocked: item.last_restocked
        ? new Date(item.last_restocked).toISOString().split("T")[0]
        : "Never",
      bin: {
        binCode: item.bin_code,
        name: item.bin_name,
      },
    }));

    return NextResponse.json({ success: true, inventory });
  } catch (error) {
    console.error("Truck inventory error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
