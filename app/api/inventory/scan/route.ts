import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import jwt from "jsonwebtoken";

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { bin_code, truck_id } = body;

    // Verify truck is assigned to this technician
    const [truckRows] = await pool.query(
      "SELECT id, truck_number FROM trucks WHERE id = ? AND assigned_to = ?",
      [truck_id, userId]
    );
    const truck = (truckRows as any[])[0];

    if (!truck) {
      return NextResponse.json(
        { error: "Truck not assigned to you" },
        { status: 403 }
      );
    }

    // Get bin information and inventory
    const [binRows] = await pool.query(
      `SELECT 
         tb.id,
         tb.bin_code,
         tb.name,
         tb.description,
         tb.max_capacity,
         JSON_ARRAYAGG(
           JSON_OBJECT(
             'id', ti.id,
             'quantity', ti.quantity,
             'min_quantity', ti.min_quantity,
             'max_quantity', ti.max_quantity,
             'last_restocked', ti.last_restocked,
             'inventory_item', JSON_OBJECT(
               'id', ii.id,
               'part_number', ii.part_number,
               'name', ii.name,
               'description', ii.description,
               'unit', COALESCE(ii.unit, 'pieces'),
               'brand', ii.supplier,
               'category', ic.name
             )
           )
         ) AS inventory
       FROM truck_bins tb
       LEFT JOIN truck_inventory ti ON tb.id = ti.bin_id
       LEFT JOIN inventory_items ii ON ti.item_id = ii.id
       LEFT JOIN inventory_categories ic ON ii.category_id = ic.id
       WHERE tb.truck_id = ? AND tb.bin_code = ?
       GROUP BY tb.id, tb.bin_code, tb.name, tb.description, tb.max_capacity`,
      [truck_id, bin_code]
    );

    const bin = (binRows as any[])[0];

    if (!bin) {
      return NextResponse.json(
        { error: "Bin not found in this truck" },
        { status: 404 }
      );
    }

    // Parse inventory JSON
    bin.inventory = bin.inventory ? JSON.parse(bin.inventory) : [];

    return NextResponse.json({
      bin,
      truck: {
        id: truck.id,
        truck_number: truck.truck_number,
      },
    });
  } catch (error) {
    console.error("Bin scan error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
