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
    const descriptionJson = JSON.stringify({
      location,
      section: section || null,
      binType,
      description: description || null,
    });

    // Insert new bin
    await connection.query(
      "INSERT INTO truck_bins (id, truck_id, bin_code, name, description, max_capacity) VALUES (?, ?, ?, ?, ?, ?)",
      [binId, id, binCode, name, descriptionJson, maxCapacityValue]
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
