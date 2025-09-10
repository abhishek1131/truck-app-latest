import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let connection;
  try {
    const { id } = await params;

    // Verify JWT token
    const authHeader = request.headers.get("authorization");
    const token =
      authHeader?.replace("Bearer ", "") ||
      request.cookies.get("access_token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized: No token provided" },
        { status: 401 }
      );
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || "your_jwt_secret");
    } catch (err) {
      console.error("JWT verification error:", err);
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const userId = decoded.id;

    // Get a single connection for all queries
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Verify user status
    const [userRows] = await connection.query(
      "SELECT status FROM users WHERE id = ? AND status = 'active'",
      [userId]
    );
    const userData = (userRows as any[])[0];

    // if (!userData) {
    //   console.error(`User not found or inactive: userId=${userId}`);
    //   await connection.rollback();
    //   return NextResponse.json(
    //     { error: "Forbidden: User not found or inactive" },
    //     { status: 403 }
    //   );
    // }

    // Verify truck exists
    const [truckRows] = await connection.query(
      "SELECT id FROM trucks WHERE id = ?",
      [id]
    );
    const truck = (truckRows as any[])[0];

    if (!truck) {
      await connection.rollback();
      return NextResponse.json({ error: "Truck not found" }, { status: 404 });
    }

    const body = await request.json();
    const {
      binCode,
      name,
      location,
      section,
      description,
      maxCapacity,
      binType,
    } = body;

    // Validate required fields
    if (!binCode || !name || !location || !binType) {
      await connection.rollback();
      return NextResponse.json(
        {
          error: "Missing required fields: binCode, name, location, or binType",
        },
        { status: 400 }
      );
    }

    // Validate binCode uniqueness
    const [existingBin] = await connection.query(
      "SELECT id FROM truck_bins WHERE truck_id = ? AND bin_code = ?",
      [id, binCode]
    );
    if ((existingBin as any[]).length > 0) {
      await connection.rollback();
      return NextResponse.json(
        { error: "Bin code already exists for this truck" },
        { status: 400 }
      );
    }

    const binId = uuidv4();
    const maxCapacityValue = parseInt(maxCapacity) || 100;

    // Insert new bin
    await connection.query(
      `INSERT INTO truck_bins 
       (id, truck_id, bin_code, name, description, max_capacity, location, section, binType) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        binId,
        id,
        binCode,
        name,
        description || null,
        maxCapacityValue,
        location,
        section || null,
        binType,
      ]
    );

    await connection.commit();

    // Format response
    const newBin = {
      id: binId,
      binCode,
      name,
      location,
      section: section || "",
      description: description || "",
      maxCapacity: maxCapacityValue,
      binType,
      totalItems: 0,
      lowStockItems: 0,
      categories: [],
      lastUpdated: "Just now",
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({
      message: "Bin added successfully",
      bin: newBin,
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error("Add bin error:", error);
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

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  let connection;
  try {
    const { id: truckId } = await context.params;
    const url = new URL(request.url);
    const binId = url.searchParams.get("binId");

    if (!binId) {
      return NextResponse.json(
        { error: "binId query parameter is required" },
        { status: 400 }
      );
    }

    // 🔑 Token check
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

    // ✅ Check user role
    const [userRows] = await pool.query(
      "SELECT role FROM users WHERE id = ? AND status = 'active'",
      [userId]
    );
    const userData = (userRows as any[])[0];

    if (!userData) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let effectiveUserId = userId;

    if (userData.role === "admin") {
      const [truckRows] = await pool.query(
        `SELECT assigned_to FROM trucks WHERE id = ?`,
        [truckId]
      );
      const truck = (truckRows as any[])[0];

      if (!truck?.assigned_to) {
        return NextResponse.json(
          { error: "No technician assigned to this truck" },
          { status: 403 }
        );
      }

      effectiveUserId = truck.assigned_to;
    } else if (userData.role !== "technician") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ✅ Check if truck is assigned to effectiveUserId
    const [truckRows] = await pool.query(
      "SELECT id FROM trucks WHERE id = ? AND assigned_to = ?",
      [truckId, effectiveUserId]
    );
    if ((truckRows as any[]).length === 0) {
      return NextResponse.json(
        { error: "Truck not assigned to this user" },
        { status: 403 }
      );
    }

    // ✅ Check if bin exists
    const [binRows] = await pool.query(
      "SELECT id FROM truck_bins WHERE id = ? AND truck_id = ?",
      [binId, truckId]
    );

    if ((binRows as any[]).length === 0) {
      return NextResponse.json({ error: "Bin not found" }, { status: 404 });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    // ✅ Delete all items first (if you want cascade delete)
    await connection.query(
      "DELETE FROM truck_inventory WHERE bin_id = ? AND truck_id = ?",
      [binId, truckId]
    );

    // ✅ Delete bin itself
    const [deleteResult] = await connection.query(
      "DELETE FROM truck_bins WHERE id = ? AND truck_id = ?",
      [binId, truckId]
    );

    await connection.commit();

    return NextResponse.json({
      message: "Bin deleted successfully",
      deletedBinId: binId,
      affectedRows: (deleteResult as any).affectedRows,
    });
  } catch (error: any) {
    if (connection) await connection.rollback();
    console.error("Delete bin error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}