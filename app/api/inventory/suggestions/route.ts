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

    // Get user role information
    const [userRows] = await pool.query(
      "SELECT id, role, created_by FROM users WHERE id = ? AND status = 'active'",
      [userId]
    );
    const userData = (userRows as any[])[0];

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userRole = userData.role;

    // Get search parameters
    const searchParams = request.nextUrl.searchParams;
    const searchKey = searchParams.get("search") || "";
    const limit = parseInt(searchParams.get("limit") || "20");
    const adminUserId = userData.created_by;

    // Validate limit
    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: "Invalid limit. Must be between 1 and 100" },
        { status: 400 }
      );
    }

    // adminUserId is now optional - will use user's created_by if not provided

    let whereClause = "";
    let queryParams: any[] = [];

    // Role-based filtering
    if (userRole === "super_admin") {
      // Super admin can see all inventory items except their own and items with same names
      whereClause = `
        WHERE ii.created_by != ? 
        AND ii.name NOT IN (
          SELECT name FROM inventory_items 
          WHERE created_by = ?
        )
      `;
      queryParams.push(userId, userId);
    } else if (userRole === "company_admin") {
      // Company admin can see inventory from all their technicians except their own and items with same names
      whereClause = `
        WHERE ii.created_by IN (
          SELECT id FROM users 
          WHERE created_by = ? AND role = 'technician' AND status = 'active'
        ) AND ii.created_by != ?
        AND ii.name NOT IN (
          SELECT name FROM inventory_items 
          WHERE created_by = ?
        )
      `;
      queryParams.push(adminUserId, userId, userId);
    } else if (userRole === "technician") {
      // Technician can see inventory from other technicians in their company, not their own and items with same names
      whereClause = `
        WHERE ii.created_by IN (
          SELECT id FROM users 
          WHERE created_by = ? AND role = 'technician' AND status = 'active'
        ) AND ii.created_by != ?
        AND ii.name NOT IN (
          SELECT name FROM inventory_items 
          WHERE created_by = ?
        )
      `;
      queryParams.push(adminUserId, userId, userId);
    } else {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Add search functionality
    if (searchKey) {
      whereClause += ` AND (
        ii.name LIKE ? OR 
        ii.part_number LIKE ? OR 
        ii.brand LIKE ? OR 
        ii.description LIKE ?
      )`;
      const searchPattern = `%${searchKey}%`;
      queryParams.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    // Build the main query
    const query = `
      SELECT 
        ii.id,
        ii.part_number,
        ii.name,
        ii.brand,
        ii.unit_price,
        ii.cost_price,
        ii.description,
        ii.unit,
        ii.supplier,
        ii.min_quantity,
        ii.standard_level,
        ii.max_quantity,
        ii.created_at,
        ii.created_by,
        CONCAT(u.first_name, ' ', u.last_name) AS created_by_name,
        u.email AS created_by_email,
        ic.name AS category_name,
        (SELECT SUM(ti.quantity) 
         FROM truck_inventory ti 
         JOIN trucks t ON ti.truck_id = t.id 
         WHERE ti.item_id = ii.id) AS total_quantity,
        (SELECT GROUP_CONCAT(t.truck_number) 
         FROM truck_inventory ti 
         JOIN trucks t ON ti.truck_id = t.id 
         WHERE ti.item_id = ii.id) AS truck_numbers
      FROM inventory_items ii
      LEFT JOIN users u ON ii.created_by = u.id
      LEFT JOIN inventory_categories ic ON ii.category_id = ic.id
      ${whereClause}
      ORDER BY ii.created_at DESC
      LIMIT ?
    `;

    queryParams.push(limit);

    // Execute the query
    const [inventoryRows] = await pool.query(query, queryParams);

    // Get total count for the search (without limit)
    const countQuery = `
      SELECT COUNT(*) as total
      FROM inventory_items ii
      LEFT JOIN users u ON ii.created_by = u.id
      LEFT JOIN inventory_categories ic ON ii.category_id = ic.id
      ${whereClause}
    `;
    const [countRows] = await pool.query(countQuery, queryParams.slice(0, -1)); // Remove limit
    const total = (countRows as any[])[0].total;

    return NextResponse.json({
      success: true,
      data: {
        suggestions: inventoryRows,
        total: total,
        searchKey: searchKey,
        limit: limit
      }
    });

  } catch (error) {
    console.error("Error fetching inventory suggestions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
