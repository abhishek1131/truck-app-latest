import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import pool from "@/lib/db"; // adjust import based on your setup
import { sendLowStockEmailOneItem } from "@/lib/email/low-stock";

export async function POST(request: NextRequest) {
  let connection;
  try {
    // Auth
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
    const body = await request.json();
    const { job_name, truck_id, parts } = body;

    if (!job_name || !truck_id || !parts || parts.length === 0) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 🔑 Step 1: Check if job_name already exists BEFORE updating stock
    const [jobCheck] = await connection.query(
      "SELECT id FROM use_parts_job WHERE job_name = ? LIMIT 1",
      [job_name]
    );
    if ((jobCheck as any[]).length > 0) {
      await connection.rollback();
      return NextResponse.json(
        { success: false, error: "Job name already exists. Please choose a different name." },
        { status: 409 }
      );
    }

    // 🔑 Step 2: Check stock availability and update accordingly
    for (const p of parts) {
      const [bins] = await connection.query(
        `SELECT id, quantity 
         FROM truck_inventory 
         WHERE truck_id = ? AND item_id = ? 
         ORDER BY last_restocked ASC`,
        [truck_id, p.id]
      );

      if ((bins as any[]).length === 0) {
        // Item not found in truck inventory - continue without updating truck_inventory
        console.log(`Item not found in truck inventory: ${p.name}`);
        continue;
      }

      let remaining = p.count;
      let totalAvailable = 0;

      // Calculate total available stock
      for (const bin of bins as any[]) {
        totalAvailable += bin.quantity;
      }

      if (totalAvailable < p.count) {
        // Not enough stock - set all quantities to 0
        for (const bin of bins as any[]) {
          await connection.query(
            `UPDATE truck_inventory 
             SET quantity = 0, last_restocked = NOW() 
             WHERE id = ?`,
            [bin.id]
          );
        }
        console.log(`Not enough stock for item ${p.name} - setting all quantities to 0`);
        continue;
      }

      // Normal stock deduction
      for (const bin of bins as any[]) {
        if (remaining <= 0) break;

        const deduct = Math.min(bin.quantity, remaining);
        const newQty = bin.quantity - deduct;

        await connection.query(
          `UPDATE truck_inventory 
           SET quantity = ?, last_restocked = NOW() 
           WHERE id = ?`,
          [newQty, bin.id]
        );

        remaining -= deduct;
      }
      
      sendLowStockEmailOneItem(p.id);
    }

    // 🔑 Step 3: Insert job after stock update
    const jobId = uuidv4();
    const date = new Date().toISOString().split("T")[0];
    const totalParts = parts.reduce((sum: number, p: any) => sum + (p.count || 0), 0);

    await connection.query(
      `INSERT INTO use_parts_job
       (id, job_name, truck_id, date, parts_used_count, parts, created_by, status)
       VALUES (?, ?, ?, ?, ?, CAST(? AS JSON), ?, 'Completed')`,
      [jobId, job_name, truck_id, date, totalParts, JSON.stringify(parts), userId]
    );

    await connection.commit();

    return NextResponse.json({
      success: true,
      message: "UseParts job created successfully & inventory updated",
      jobId,
      totalParts,
    });
  } catch (error: any) {
    console.error("Create UseParts Job Error:", error);

    if (connection) await connection.rollback();

    if (error.code === "ER_DUP_ENTRY") {
      return NextResponse.json(
        { success: false, error: "Job name already exists. Please choose a different name." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}

export async function GET(request: NextRequest) {
  try {
    // ✅ JWT verification
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

    // ✅ Query params
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const offset = (page - 1) * limit;

    const search = searchParams.get("search") || "";
    const dateFrom = searchParams.get("dateFrom") || "";
    const dateTo = searchParams.get("dateTo") || "";
    const truckId = searchParams.get("truckId") || "";

    // ✅ Build WHERE clause dynamically
    let whereClause = `WHERE j.created_by = ?`;
    const params: any[] = [userId];

    if (search) {
      whereClause += ` AND (j.job_name LIKE ? OR JSON_SEARCH(j.parts, 'all', ?) IS NOT NULL)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    if (dateFrom) {
      whereClause += ` AND j.date >= ?`;
      params.push(dateFrom);
    }

    if (dateTo) {
      whereClause += ` AND j.date <= ?`;
      params.push(dateTo);
    }

    if (truckId && truckId !== "all") {
      whereClause += ` AND j.truck_id = ?`;
      params.push(truckId);
    }

    // ✅ Get total count
    const [countRows] = await pool.query(
      `SELECT COUNT(*) as total FROM use_parts_job j ${whereClause}`,
      params
    );
    const total = (countRows as any[])[0].total;
    const totalPages = Math.ceil(total / limit);
    // ✅ Fetch jobs with pagination
    const [jobs] = await pool.query(
      `SELECT 
         j.id, 
         j.job_name, 
         j.truck_id, 
         t.truck_number AS truck_name,
         t.license_plate AS license_plate,
         j.date, 
         j.parts_used_count, 
         j.parts, 
         j.status, 
         j.created_at, 
         j.updated_at,
         j.created_by,
        CONCAT_WS(' ', u.first_name, u.last_name) AS created_by_name,
        u.email AS created_by_email
       FROM use_parts_job j
       LEFT JOIN trucks t ON j.truck_id = t.id
       LEFT JOIN users u ON j.created_by = u.id
       ${whereClause}
       ORDER BY j.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    // ✅ After fetching jobs
    const jobsWithParts = await Promise.all(
      (jobs as any[]).map(async (job) => {
        let parts = [];
        try {
          parts = typeof job.parts === "string" ? JSON.parse(job.parts) : job.parts || [];
        } catch {
          parts = [];
        }

        if (parts.length > 0) {
          // Collect part IDs
          const partIds = parts.map((p: any) => p.id);

          // Fetch prices from inventory_items
          const [inventoryRows] = await pool.query(
            `SELECT id, unit_price, cost_price FROM inventory_items WHERE id IN (?)`,
            [partIds]
          );

          const inventoryMap = new Map(
            (inventoryRows as any[]).map((row) => [row.id, row])
          );

          // Merge unit_price & cost_price
          parts = parts.map((p: any) => {
            const match = inventoryMap.get(p.id);
            return {
              ...p,
              unit_price: match ? Number(match.unit_price) : 0,
              cost_price: match ? Number(match.cost_price) : 0,
            };
          });
        }

        return {
          ...job,
          parts,
        };
      })
    );

    return NextResponse.json({
      success: true,
      page,
      limit,
      total,
      totalPages,
      jobs: jobsWithParts,
    });
  } catch (error: any) {
    console.error("Fetch UseParts Jobs Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}