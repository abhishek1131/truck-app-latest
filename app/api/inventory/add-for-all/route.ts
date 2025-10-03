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

    console.log("userData", userData);
    // Only company_admin can use this API
    if (userData.role !== "company_admin") {
      return NextResponse.json({ error: "Access denied. Only company admin can add items for all technicians." }, { status: 403 });
    }

    const { itemId } = await request.json();

    if (!itemId) {
      return NextResponse.json({ error: "itemId is required" }, { status: 400 });
    }

    // Get item details from inventory_items
    const [itemRows] = await pool.query(
      `SELECT 
        ii.id,
        ii.name,
        ii.description,
        ii.category_id,
        ii.unit,
        ii.part_number,
        ii.brand,
        ii.cost_price,
        ii.unit_price,
        ii.min_quantity,
        ii.standard_level,
        ii.max_quantity,
        ic.name as category_name
      FROM inventory_items ii
      LEFT JOIN inventory_categories ic ON ii.category_id = ic.id
      WHERE ii.id = ?`,
      [itemId]
    );

    if (!Array.isArray(itemRows) || itemRows.length === 0) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const item = itemRows[0] as any;

    console.log("item", item);
    // Get all technicians under this company admin
    const [technicianRows] = await pool.query(
      `SELECT id, first_name, last_name, email 
       FROM users 
       WHERE created_by = ? AND role = 'technician'`,
      [userId]
    );

    if (!Array.isArray(technicianRows) || technicianRows.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: "No technicians found under this company admin",
        addedCount: 0,
        technicians: []
      });
    }

    const technicians = technicianRows as any[];
    console.log("technicians", technicians);
    const addedItems = [];
    const skippedItems = [];

    // For each technician, check if they already have this item
    for (const technician of technicians) {
      // Check if technician already has this item (by name)
      const [existingRows] = await pool.query(
        `SELECT id FROM inventory_items 
         WHERE created_by = ? AND name = ?`,
        [technician.id, item.name]
      );

      if (Array.isArray(existingRows) && existingRows.length > 0) {
        // Technician already has this item
        skippedItems.push({
          technicianId: technician.id,
          technicianName: `${technician.first_name} ${technician.last_name}`,
          reason: "Item already exists"
        });
        continue;
      }

      // Add the item for this technician
      const [insertResult] = await pool.query(
        `INSERT INTO inventory_items (
          id, name, description, category_id, unit, part_number, brand,
          cost_price, unit_price, min_quantity, standard_level, max_quantity,
          created_by, created_at, updated_at
        ) VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          item.name,
          item.description,
          item.category_id,
          item.unit,
          item.part_number,
          item.brand,
          item.cost_price,
          item.unit_price,
          item.min_quantity,
          item.standard_level,
          item.max_quantity,
          technician.id
        ]
      );

      const insertResultTyped = insertResult as any;
      addedItems.push({
        technicianId: technician.id,
        technicianName: `${technician.first_name} ${technician.last_name}`,
        technicianEmail: technician.email,
        itemId: insertResultTyped.insertId
      });
    }

    return NextResponse.json({
      success: true,
      message: `Item "${item.name}" processed for ${technicians.length} technicians`,
      itemDetails: {
        id: item.id,
        name: item.name,
        description: item.description,
        category: item.category_name,
        partNumber: item.part_number,
        brand: item.brand
      },
      summary: {
        totalTechnicians: technicians.length,
        addedCount: addedItems.length,
        skippedCount: skippedItems.length
      },
      addedItems,
      skippedItems
    });

  } catch (error) {
    console.error("Add for all technicians error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
