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
    const {
      name,
      brand,
      category,
      partNumber,
      supplier,
      description,
      lowStockThreshold,
      cost_price,
      unit_price,
      standardLevel,
      unit,
    } = body;

    // Validate category
    const [categoryRows] = await pool.query(
      "SELECT id FROM inventory_categories WHERE name = ?",
      [category]
    );
    let categoryId = (categoryRows as any[])[0]?.id;

    // If category doesn't exist, create it
    if (!categoryId) {
      const [insertCategory] = await pool.query(
        "INSERT INTO inventory_categories (id, name, created_at) VALUES (UUID(), ?, NOW())",
        [category]
      );
      const [newCategory] = await pool.query(
        "SELECT id FROM inventory_categories WHERE name = ?",
        [category]
      );
      categoryId = (newCategory as any[])[0].id;
    }

    // Insert new inventory item
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [insertResult] = await connection.query(
      `INSERT INTO inventory_items 
       (id, part_number, name,brand, description, category_id, unit_price, cost_price, supplier, min_quantity, max_quantity, standard_level, unit, created_at, updated_at, created_by)
       VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), ?)`,
      [
        partNumber,
        name,
        brand || "",
        description || "",
        categoryId,
        unit_price || 0,
        cost_price || 0,
        supplier || "",
        lowStockThreshold || 10,
        standardLevel || lowStockThreshold || 10,
        standardLevel || lowStockThreshold || 10,
        unit || "pieces",
        userId,
      ]
    );    

    const [newItemRows] = await connection.query(
      `SELECT 
         ii.id,
         ii.part_number AS id_for_ui,
         ii.name,
         ic.name AS category,
         COALESCE(ii.unit, 'pieces') AS unit,
         ii.brand,
         ii.supplier,
         ii.unit_price,
         ii.cost_price,
         ii.description AS notes,
         COALESCE(ii.standard_level, ii.max_quantity, 10) AS standard_level,
         ii.min_quantity AS low_stock_threshold,
         ii.created_by
       FROM inventory_items ii
       JOIN inventory_categories ic ON ii.category_id = ic.id
       WHERE ii.part_number = ?`,
      [partNumber]
    );

    await connection.commit();

    const newItem = (newItemRows as any[])[0];

    return NextResponse.json({
      item: {
        id: newItem.id_for_ui,
        name: newItem.name,
        category: newItem.category,
        totalQuantity: 0,
        lowStockThreshold: newItem.low_stock_threshold,
        standardLevel: newItem.standard_level,
        lastOrdered: "Never",
        trucks: [],
        notes: newItem.notes,
        unit: newItem.unit,
        partNumber: newItem.id_for_ui,
        brand: newItem.brand,
        supplier: newItem.supplier,
        unitPrice: newItem.unit_price,
        costPrice: newItem.cost_price,
      },
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    // Fix: error may not have a 'code' property, so use type assertion or check differently
    if ((error as any)?.code === "ER_DUP_ENTRY") {
      const errorMessage = (error as any)?.sqlMessage || "";
      
      // Check which field has the duplicate entry
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
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
