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
      "SELECT id, role FROM users WHERE id = ? AND status = 'active'",
      [userId]
    );
    const userData = (userRows as any[])[0];

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userRole = userData.role;
    const adminUserId = userData.id;

    // Get pagination parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    // Get filter parameters
    const status = searchParams.get("status") || "";
    const type = searchParams.get("type") || "";

    let whereClause = "";
    let queryParams: any[] = [];

    // Role-based filtering
    if (userRole === "super_admin") {
      // Super admin can see all notifications
      whereClause = "WHERE 1=1";
    } else if (userRole === "company_admin") {
      // Company admin can see all notifications from technicians in their company
      whereClause = `
        WHERE n.user_id IN (
          SELECT id FROM users 
          WHERE created_by = ? AND role = 'technician' AND status = 'active'
        )
      `;
      queryParams.push(adminUserId);
    } else if (userRole === "technician") {
      // Technician can only see their own notifications
      whereClause = "WHERE n.user_id = ?";
      queryParams.push(userId);
    } else {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Add additional filters
    if (status) {
      whereClause += ` AND n.status = ?`;
      queryParams.push(status);
    }

    if (type) {
      whereClause += ` AND n.type = ?`;
      queryParams.push(type);
    }

    // Build the main query
    const query = `
      SELECT 
        n.id,
        n.message,
        n.type,
        n.status,
        n.item_id,
        n.truck_id,
        n.quantity,
        n.used_quantity,
        n.user_id,
        n.created_at,
        u.name as user_name,
        u.email as user_email,
        ii.name as item_name,
        ii.part_number,
        t.truck_number,
        t.model
      FROM notifications n
      LEFT JOIN users u ON n.user_id = u.id
      LEFT JOIN inventory_items ii ON n.item_id = ii.id
      LEFT JOIN trucks t ON n.truck_id = t.id
      ${whereClause}
      ORDER BY n.created_at DESC
      LIMIT ? OFFSET ?
    `;

    queryParams.push(limit, offset);

    // Execute the query
    const [notificationRows] = await pool.query(query, queryParams);

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM notifications n
      ${whereClause}
    `;
    const countParams = queryParams.slice(0, -2); // Remove limit and offset
    const [countRows] = await pool.query(countQuery, countParams);
    const total = (countRows as any[])[0].total;

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      notifications: notificationRows,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
