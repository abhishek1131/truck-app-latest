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

    if (!userData || userData.role !== "technician") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get technician's assigned trucks with bins and inventory
    const [trucks] = await pool.query(
      `
      SELECT 
        t.id,
        t.truck_number AS name,
        t.location,
        t.status,
        t.make,
        t.model,
        t.updated_at,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', tb.id,
            'name', tb.name,
            'bin_code', tb.bin_code,
            'location', tb.name,
            'updated_at', tb.updated_at,
            'inventory', (
              SELECT JSON_ARRAYAGG(
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
              )
              FROM truck_inventory ti
              JOIN inventory_items ii ON ti.item_id = ii.id
              JOIN inventory_categories ic ON ii.category_id = ic.id
              WHERE ti.truck_id = t.id AND ti.bin_id = tb.id
            )
          )
        ) AS bins
      FROM trucks t
      LEFT JOIN truck_bins tb ON t.id = tb.truck_id
      WHERE t.assigned_to = ?
      GROUP BY t.id, t.truck_number, t.location, t.status, t.make, t.model, t.updated_at
      ORDER BY t.truck_number ASC
      `,
      [userId]
    );

    // Format trucks data
    const formattedTrucks = (trucks as any[]).map((truck) => {
      const bins = (truck.bins || "[]").filter((bin: any) => bin.id);
      return {
        id: truck.id,
        name: truck.name,
        location: truck.location,
        status: truck.status,
        make: truck.make,
        model: truck.model,
        totalItems: bins.reduce((sum: number, bin: any) => {
          return (
            sum +
            (bin.inventory
              ? bin.inventory.reduce(
                  (s: number, item: any) => s + item.current_stock,
                  0
                )
              : 0)
          );
        }, 0),
        lowStockItems: bins.reduce((sum: number, bin: any) => {
          return (
            sum +
            (bin.inventory
              ? bin.inventory.filter((item: any) => item.is_low_stock).length
              : 0)
          );
        }, 0),
        bins: bins.length,
        lastUpdated: new Date(truck.updated_at).toLocaleString(),
        binsData: bins.map((bin: any) => ({
          id: bin.id,
          name: bin.name,
          code: bin.bin_code,
          location: bin.location,
          totalItems: bin.inventory
            ? bin.inventory.reduce(
                (sum: number, item: any) => sum + item.current_stock,
                0
              )
            : 0,
          lowStockItems: bin.inventory
            ? bin.inventory.filter((item: any) => item.is_low_stock).length
            : 0,
          categories: bin.inventory
            ? [...new Set(bin.inventory.map((item: any) => item.category))]
            : [],
          lastUpdated: new Date(bin.updated_at).toLocaleString(),
          inventory: bin.inventory || [],
        })),
      };
    });

    return NextResponse.json({ trucks: formattedTrucks });
  } catch (error) {
    console.error("Technician trucks API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
