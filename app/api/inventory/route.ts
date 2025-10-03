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

    // Verify user role
    const [userRows] = await pool.query(
      "SELECT role FROM users WHERE id = ? AND status = 'active'",
      [userId]
    );
    const userData = (userRows as any[])[0];

    if (!userData) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if user has access (technician, company_admin, or super_admin)
    if (!['technician', 'company_admin', 'super_admin'].includes(userData.role)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const itemId = searchParams.get("item");

    // Get pagination parameters
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    // Get filter parameters
    const searchText = searchParams.get("searchText") || "";
    const categoryFilter = searchParams.get("category") || "";

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: "Invalid pagination parameters. Page must be >= 1, limit must be between 1 and 100" },
        { status: 400 }
      );
    }

    const offset = (page - 1) * limit;

    if (itemId) {
      // Fetch detailed item info
      const [itemRow] = await pool.query(
        `SELECT 
           ii.id,
           ii.part_number AS partNumber,
           ii.name,
           ic.name AS category,
           COALESCE(ii.unit, 'pieces') AS unit,
           ii.brand,
           ii.description AS notes,
           COALESCE(ii.standard_level, ii.max_quantity, 10) AS standardLevel,
           ii.min_quantity AS lowStockThreshold,
           ii.unit_price AS unitPrice,
           ii.cost_price AS costPrice,
           ii.supplier
         FROM inventory_items ii
         LEFT JOIN inventory_categories ic ON ii.category_id = ic.id
         WHERE ii.id = ?`,
        [itemId]
      );

      if ((itemRow as any[]).length === 0) {
        return NextResponse.json({ error: "Item not found" }, { status: 404 });
      }

      const basic = (itemRow as any[])[0];

      // Total quantity
      const [totalRow] = await pool.query(
        `SELECT SUM(ti.quantity) as totalQuantity 
         FROM truck_inventory ti 
         WHERE ti.item_id = ?
         AND ti.truck_id IN (SELECT id FROM trucks WHERE assigned_to = ?)`,
        [itemId, userId]
      );
      basic.totalQuantity = (totalRow as any)[0].totalQuantity || 0;

      // Last ordered
      const [lastOrderRow] = await pool.query(
        `SELECT MAX(o.created_at) as lastOrdered 
         FROM order_items oi 
         JOIN orders o ON oi.order_id = o.id 
         WHERE oi.item_id = ?
         AND o.technician_id = ?`,
        [itemId, userId]
      );
      basic.lastOrdered = (lastOrderRow as any)[0].lastOrdered
        ? new Date((lastOrderRow as any)[0].lastOrdered)
          .toISOString()
          .split("T")[0]
        : "Never";

      // Last restocked
      const [lastRestockRow] = await pool.query(
        `SELECT MAX(ti.last_restocked) as lastRestocked 
         FROM truck_inventory ti 
         WHERE ti.item_id = ? 
         AND ti.truck_id IN (SELECT id FROM trucks WHERE assigned_to = ?)`,
        [itemId, userId]
      );
      basic.lastRestocked = (lastRestockRow as any)[0].lastRestocked
        ? new Date((lastRestockRow as any)[0].lastRestocked)
          .toISOString()
          .split("T")[0]
        : "Never";

      // Truck bin distribution - role-based query
      let truckBinQuery = "";
      let truckBinParams = [itemId];
      
      if (userData.role === 'technician') {
        // For technician: only their own trucks
        truckBinQuery = `SELECT 
           t.id as truckId, 
           t.truck_number as truckName, 
           t.location as location,
           tb.id as binId, 
           tb.bin_code as binName, 
           ti.quantity
         FROM truck_inventory ti
         JOIN trucks t ON ti.truck_id = t.id
         JOIN truck_bins tb ON ti.bin_id = tb.id
         WHERE ti.item_id = ?
         AND t.assigned_to = ?
         ORDER BY t.truck_number, tb.bin_code`;
        truckBinParams.push(userId);
      } else if (userData.role === 'company_admin') {
        // For company_admin: trucks of all technicians under them
        truckBinQuery = `SELECT 
           t.id as truckId, 
           t.truck_number as truckName, 
           t.location as location,
           tb.id as binId, 
           tb.bin_code as binName, 
           ti.quantity
         FROM truck_inventory ti
         JOIN trucks t ON ti.truck_id = t.id
         JOIN truck_bins tb ON ti.bin_id = tb.id
         WHERE ti.item_id = ?
         AND t.assigned_to IN (SELECT id FROM users WHERE created_by = ? AND role = 'technician')
         ORDER BY t.truck_number, tb.bin_code`;
        truckBinParams.push(userId);
      } else if (userData.role === 'super_admin') {
        // For super_admin: all trucks
        truckBinQuery = `SELECT 
           t.id as truckId, 
           t.truck_number as truckName, 
           t.location as location,
           tb.id as binId, 
           tb.bin_code as binName, 
           ti.quantity
         FROM truck_inventory ti
         JOIN trucks t ON ti.truck_id = t.id
         JOIN truck_bins tb ON ti.bin_id = tb.id
         WHERE ti.item_id = ?
         ORDER BY t.truck_number, tb.bin_code`;
      }

      const [distRows] = await pool.query(truckBinQuery, truckBinParams);

      const truckMap = new Map();
      (distRows as any[]).forEach((row) => {
        if (!truckMap.has(row.truckId)) {
          truckMap.set(row.truckId, {
            truckId: row.truckId,
            truckName: row.truckName,
            location: row.location,
            bins: [],
          });
        }
        truckMap.get(row.truckId).bins.push({
          binId: row.binId,
          binName: row.binName,
          quantity: row.quantity,
        });
      });
      basic.truckBinDistribution = Array.from(truckMap.values());

      // Recent activity (restocks only)
      const [activityRows] = await pool.query(
        `SELECT 
           o.created_at as date,
           'Restocked' as action,
           oi.quantity,
           t.truck_number as truck,
           tb.bin_code as bin
         FROM order_items oi
         JOIN orders o ON oi.order_id = o.id
         LEFT JOIN trucks t ON o.truck_id = t.id
         LEFT JOIN truck_bins tb ON oi.bin_id = tb.id
         WHERE oi.item_id = ?
         AND o.technician_id = ?
         AND o.status IN ('delivered', 'shipped')
         ORDER BY o.created_at DESC
         LIMIT 10`,
        [itemId, userId]
      );

      basic.recentActivity = (activityRows as any[]).map((row) => ({
        date: new Date(row.date).toLocaleString(),
        action: row.action,
        quantity: row.quantity,
        truck: row.truck || "N/A",
        bin: row.bin || "N/A",
      }));

      return NextResponse.json(basic);
    } else {
      // Build WHERE clause for filters
      let whereClause = "";
      const queryParams = [];

      if (searchText) {
        whereClause += " AND (ii.part_number LIKE ? OR ii.name LIKE ?)";
        queryParams.push(`%${searchText}%`, `%${searchText}%`);
      }

      if (categoryFilter) {
        whereClause += " AND ic.name = ?";
        queryParams.push(categoryFilter);
      }

      // Get total count for pagination
      const [countRows] = await pool.query(
        `SELECT COUNT(*) as total 
         FROM inventory_items ii
         LEFT JOIN inventory_categories ic ON ii.category_id = ic.id
         WHERE ii.created_by = ? ${whereClause}`,
        [userId, ...queryParams]
      );
      const totalItems = (countRows as any[])[0].total;
      const totalPages = Math.ceil(totalItems / limit);

      // Get inventory items for assigned trucks with pagination
      const [itemRows] = await pool.query(
        `SELECT 
     ii.id AS internal_id,
     ii.part_number AS id_for_ui,
     ii.name,
     ic.name AS category,
     COALESCE(ii.unit, 'pieces') AS unit,
     ii.brand,
     ii.unit_price AS unitPrice,
     ii.cost_price AS costPrice,
     ii.description AS notes,
     COALESCE(ii.standard_level, ii.max_quantity, 10) AS standard_level,
     ii.min_quantity AS low_stock_threshold,
     (SELECT SUM(ti.quantity) 
      FROM truck_inventory ti 
      JOIN trucks t ON ti.truck_id = t.id 
      WHERE ti.item_id = ii.id 
      AND t.assigned_to = ?) AS total_quantity,
     (SELECT GROUP_CONCAT(t.truck_number) 
      FROM truck_inventory ti 
      JOIN trucks t ON ti.truck_id = t.id 
      WHERE ti.item_id = ii.id 
      AND t.assigned_to = ?) AS trucks,
     (SELECT MAX(o.created_at) 
      FROM order_items oi 
      JOIN orders o ON oi.order_id = o.id 
      WHERE oi.item_id = ii.id 
      AND o.technician_id = ?) AS last_ordered,
     ii.created_at
  FROM inventory_items ii
  LEFT JOIN inventory_categories ic ON ii.category_id = ic.id
  WHERE ii.created_by = ?
  ${whereClause}
  ORDER BY ii.created_at DESC
  LIMIT ? OFFSET ?`,
        [userId, userId, userId, userId, ...queryParams, limit, offset]
      );

      // Get statistics - optimized and corrected with filters
      const [statsRows] = await pool.query(
        `SELECT 
           COALESCE(SUM(ti.quantity), 0) AS total_items,
           COUNT(DISTINCT ti.item_id) AS item_types,
           (
             SELECT COUNT(*) 
             FROM (
               SELECT 
                 ii.id,
                 SUM(ti2.quantity) AS total_qty,
                 ii.min_quantity
               FROM truck_inventory ti2
               JOIN trucks t2 ON ti2.truck_id = t2.id
               JOIN inventory_items ii ON ti2.item_id = ii.id
               WHERE t2.assigned_to = ? AND ii.created_by = ?
               GROUP BY ii.id, ii.min_quantity
               HAVING SUM(ti2.quantity) < ii.min_quantity
             ) AS sub
           ) AS low_stock_items,
           (
             SELECT COUNT(*) 
             FROM (
               SELECT 
                 ii.id,
                 SUM(ti3.quantity) AS total_qty,
                 COALESCE(ii.standard_level, ii.max_quantity, 10) AS std_level
               FROM truck_inventory ti3
               JOIN trucks t3 ON ti3.truck_id = t3.id
               JOIN inventory_items ii ON ti3.item_id = ii.id
               WHERE t3.assigned_to = ? AND ii.created_by = ?
               GROUP BY ii.id, std_level
               HAVING SUM(ti3.quantity) < std_level
             ) AS sub2
           ) AS needs_restock_items
           
         FROM truck_inventory ti
         JOIN trucks t ON ti.truck_id = t.id
         JOIN inventory_items ii ON ti.item_id = ii.id
         LEFT JOIN inventory_categories ic ON ii.category_id = ic.id
         WHERE t.assigned_to = ? AND ii.created_by = ?${whereClause}`,
        [userId, userId, userId, userId, userId, userId, ...queryParams]
      );

      // Format inventory items
      const inventoryItems = (itemRows as any[]).map((item) => ({
        internalId: item.internal_id,
        id: item.id_for_ui,
        name: item.name,
        category: item.category,
        totalQuantity: item.total_quantity || 0,
        lowStockThreshold: item.low_stock_threshold,
        standardLevel: item.standard_level,
        lastOrdered: item.last_ordered
          ? new Date(item.last_ordered).toISOString().split("T")[0]
          : "Never",
        trucks: item.trucks ? [...new Set(item.trucks.split(","))] : [],
        notes: item.notes,
        unit: item.unit,
        partNumber: item.id_for_ui,
        brand: item.brand,
        costPrice: item.costPrice || 0,
        unitPrice: item.unitPrice || 0,
        assigned: (item.total_quantity || 0) > 0 || (item.trucks && item.trucks.length > 0),
      }));

      const stats = (statsRows as any[])[0];

      return NextResponse.json({
        inventoryItems,
        stats: {
          totalItems: stats.total_items || 0,
          assignedItem: stats.item_types || 0,
          lowStockItems: stats.low_stock_items || 0,
          needsRestockItems: stats.needs_restock_items || 0,
        },
        pagination: {
          currentPage: page,
          totalPages,
          totalItems,
          limit,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1
        }
      });
    }
  } catch (error) {
    console.error("Inventory API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
