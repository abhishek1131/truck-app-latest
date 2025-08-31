import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import jwt from "jsonwebtoken";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Verify truck assignment
    const [truckRows] = await pool.query(
      "SELECT id FROM trucks WHERE id = ? AND assigned_to = ?",
      [params.id, userId]
    );
    const truck = (truckRows as any[])[0];

    if (!truck) {
      return NextResponse.json(
        { error: "Truck not assigned to you" },
        { status: 403 }
      );
    }

    // Fetch standard inventory items
    const [standardItems] = await pool.query(
      `
      SELECT 
        tsi.id,
        tsi.item_name AS name,
        tsi.bin_id AS binId,
        tb.name AS binName,
        tsi.standard_quantity AS standardQuantity,
        tsi.unit
      FROM truck_standard_inventory tsi
      JOIN truck_bins tb ON tsi.bin_id = tb.id
      WHERE tsi.truck_id = ?
      `,
      [params.id]
    );

    return NextResponse.json({ standardItems });
  } catch (error) {
    console.error("Standard inventory fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Verify truck assignment
    const [truckRows] = await pool.query(
      "SELECT id FROM trucks WHERE id = ? AND assigned_to = ?",
      [params.id, userId]
    );
    const truck = (truckRows as any[])[0];

    if (!truck) {
      return NextResponse.json(
        { error: "Truck not assigned to you" },
        { status: 403 }
      );
    }

    const { items } = await request.json();

    if (!items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: "Invalid items data" },
        { status: 400 }
      );
    }

    // Start transaction
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Clear existing standard items for the truck
    await connection.query(
      "DELETE FROM truck_standard_inventory WHERE truck_id = ?",
      [params.id]
    );

    // Insert new standard items
    for (const item of items) {
      const { id, name, binId, standardQuantity, unit } = item;

      // Verify bin exists
      const [binRows] = await connection.query(
        "SELECT id FROM truck_bins WHERE id = ? AND truck_id = ?",
        [binId, params.id]
      );
      const bin = (binRows as any[])[0];

      if (!bin) {
        await connection.rollback();
        return NextResponse.json(
          { error: `Bin ${binId} not found` },
          { status: 404 }
        );
      }

      await connection.query(
        "INSERT INTO truck_standard_inventory (id, truck_id, bin_id, item_name, standard_quantity, unit) VALUES (?, ?, ?, ?, ?, ?)",
        [id, params.id, binId, name, standardQuantity, unit]
      );
    }

    await connection.commit();
    return NextResponse.json({
      message: "Standard inventory levels updated successfully",
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error("Standard inventory update error:", error);
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
  { params }: { params: { id: string; itemId: string } }
) {
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

    // Verify truck assignment
    const [truckRows] = await pool.query(
      "SELECT id FROM trucks WHERE id = ? AND assigned_to = ?",
      [params.id, userId]
    );
    const truck = (truckRows as any[])[0];

    if (!truck) {
      return NextResponse.json(
        { error: "Truck not assigned to you" },
        { status: 403 }
      );
    }

    // Start transaction
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Delete standard item
    const [result] = await connection.query(
      "DELETE FROM truck_standard_inventory WHERE id = ? AND truck_id = ?",
      [params.itemId, params.id]
    );

    if ((result as any).affectedRows === 0) {
      await connection.rollback();
      return NextResponse.json(
        { error: "Standard item not found" },
        { status: 404 }
      );
    }

    await connection.commit();
    return NextResponse.json({ message: "Standard item deleted successfully" });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error("Standard item delete error:", error);
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
