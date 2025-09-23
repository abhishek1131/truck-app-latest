import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import jwt from "jsonwebtoken";

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token =
      authHeader?.replace("Bearer ", "") ||
      request.cookies.get("access_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded: any = jwt.verify(
      token,
      process.env.JWT_SECRET || "your_jwt_secret"
    );

    const body = await request.json();
    const {
      id,
      name,
      standardLevel,
      lowStockThreshold,
      category,
      unit,
      partNumber,
      brand,
      cost_price,
      notes,
    } = body;

    if (!id)
      return NextResponse.json(
        { error: "Item ID is required" },
        { status: 400 }
      );

      // Before UPDATE
      let categoryId: string | null = null;
      if (body.category) {
        const [catRows] = await pool.query(
          `SELECT id FROM inventory_categories WHERE name = ?`,
          [body.category]
        );
        if ((catRows as any[]).length > 0) {
          categoryId = (catRows as any[])[0].id;
        } else {
          // Optional: create category if it doesn't exist
          // or return error
          return NextResponse.json({ error: "Invalid category" }, { status: 400 });
        }
      }

    // Update editable fields (except name)
    const [result] = await pool.query(
      `UPDATE inventory_items 
       SET 
         standard_level = ?, 
         name = ?,
         min_quantity = ?, 
         category_id = ?, 
         unit = ?, 
         part_number = ?, 
         brand = ?, 
         cost_price = ?, 
         description = ?, 
         updated_at = NOW()
       WHERE id = ?`,
      [
        standardLevel ?? 10,
        name,
        lowStockThreshold ?? 10,
        categoryId,
        unit || "pieces",
        partNumber || null,
        brand || null,
        cost_price || 0,
        notes || null,
        id,
      ]
    );

    // Fetch updated item
    const [rows] = await pool.query(
      `SELECT 
        i.id,
        i.part_number AS id_for_ui,
        i.name,
        c.name AS category,
        COALESCE(i.unit, 'pieces') AS unit,
        i.brand,
        i.supplier,
        i.unit_price,
        i.cost_price,
        i.description AS notes,
        COALESCE(i.standard_level, i.max_quantity, 10) AS standard_level,
        i.min_quantity AS low_stock_threshold
      FROM inventory_items i
      LEFT JOIN inventory_categories c ON i.category_id = c.id
      WHERE i.id = ?`,
      [id]
    );

    const updatedItem = (rows as any[])[0];
    if (!updatedItem)
      return NextResponse.json(
        { error: "Item not found" },
        { status: 404 }
      );

    return NextResponse.json({
      item: {
        id: updatedItem.id_for_ui,
        name: updatedItem.name,
        category: updatedItem.category,
        lowStockThreshold: updatedItem.low_stock_threshold,
        standardLevel: updatedItem.standard_level,
        notes: updatedItem.notes,
        unit: updatedItem.unit,
        brand: updatedItem.brand,
        supplier: updatedItem.supplier,
        unitPrice: updatedItem.unit_price,
        costPrice: updatedItem.cost_price,
        totalQuantity: 0,
        lastOrdered: "Never",
        trucks: [],
        partNumber: updatedItem.id_for_ui,
      },
    });
  } catch (error: any) {
    if (error?.code === "ER_DUP_ENTRY") {
      const errorMessage = error?.sqlMessage || "";
      if (errorMessage.includes("name_UNIQUE")) {
        return NextResponse.json(
          { error: "Item name already exists" },
          { status: 400 }
        );
      } else if (errorMessage.includes("part_number")) {
        return NextResponse.json(
          { error: "Part number already exists" },
          { status: 400 }
        );
      } else {
        return NextResponse.json(
          { error: "Duplicate entry found" },
          { status: 400 }
        );
      }
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
