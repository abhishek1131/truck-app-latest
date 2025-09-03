import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; binId: string }> }
) {
  try {
    const { id, binId } = await params;
    console.log(`Fetching bin details for truckId: ${id}, binId: ${binId}`);

    const authHeader = request.headers.get("authorization");
    const token =
      authHeader?.replace("Bearer ", "") ||
      request.cookies.get("access_token")?.value;

    if (!token) {
      console.log("No token provided");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || "your_jwt_secret");
      console.log(`Authenticated user: ${decoded.id}`);
    } catch (err) {
      console.error("JWT verification error:", err);
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const userId = decoded.id;

    // Check user role
    const [userRows] = await pool.query(
      "SELECT role FROM users WHERE id = ? AND status = 'active'",
      [userId]
    );
    const userData = (userRows as any[])[0];

    if (!userData) {
      console.log(`User not found or inactive: userId=${userId}`);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let effectiveUserId = userId;

    // If user is admin, find the technician assigned to the truck via bin
    if (userData.role === "admin") {
      const [truckRows] = await pool.query(
        `
        SELECT t.assigned_to
        FROM trucks t
        JOIN truck_bins tb ON t.id = tb.truck_id
        WHERE tb.id = ? AND tb.truck_id = ?
        `,
        [binId, id]
      );
      const truck = (truckRows as any[])[0];

      if (!truck) {
        console.log(`Truck or bin not found: truckId=${id}, binId=${binId}`);
        return NextResponse.json(
          { error: "Truck or bin not found" },
          { status: 404 }
        );
      }

      if (!truck.assigned_to) {
        console.log(`No technician assigned to truck: truckId=${id}`);
        return NextResponse.json(
          { error: "No technician assigned to truck" },
          { status: 403 }
        );
      }

      effectiveUserId = truck.assigned_to;
      console.log(
        `Admin access: Using technician ID ${effectiveUserId} for truck ${id}`
      );
    } else if (userData.role !== "technician") {
      console.log(`Forbidden: User ${userId} is not a technician or admin`);
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Verify truck exists and is assigned to effectiveUserId
    const [truckRows] = await pool.query(
      "SELECT id, assigned_to FROM trucks WHERE id = ?",
      [id]
    );
    const truck = (truckRows as any[])[0];
    console.log(
      `Truck details: id=${id}, assigned_to=${
        truck?.assigned_to || "not found"
      }`
    );

    if (!truck) {
      console.log(`Truck not found: truckId=${id}`);
      return NextResponse.json({ error: "Truck not found" }, { status: 404 });
    }

    if (truck.assigned_to !== effectiveUserId) {
      console.log(
        `Effective user ${effectiveUserId} not assigned to truck ${id}`
      );
      return NextResponse.json(
        { error: "Truck not assigned to the technician" },
        { status: 403 }
      );
    }

    // Fetch bin details
    const [binRows] = await pool.query(
      `
      SELECT 
        tb.id,
        tb.name,
        tb.bin_code AS code,
        tb.name AS location,
        t.truck_number,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', ti.item_id,
            'inventory_item_id', ti.item_id,
            'name', COALESCE(ii.name, ''),
            'category', COALESCE(ic.name, ''),
            'current_stock', COALESCE(ti.quantity, 0),
            'standard_level', COALESCE(ii.standard_level, 0),
            'unit', COALESCE(ii.unit, 'pieces'),
            'last_restocked', ti.last_restocked,
            'is_low_stock', CASE WHEN ti.quantity IS NULL THEN FALSE ELSE ti.quantity <= COALESCE(ii.min_quantity, 0) END
          )
        ) AS inventory
      FROM truck_bins tb
      JOIN trucks t ON tb.truck_id = t.id
      LEFT JOIN truck_inventory ti ON tb.id = ti.bin_id AND tb.truck_id = ti.truck_id
      LEFT JOIN inventory_items ii ON ti.item_id = ii.id
      LEFT JOIN inventory_categories ic ON ii.category_id = ic.id
      WHERE tb.id = ? AND tb.truck_id = ? AND t.assigned_to = ?
      GROUP BY tb.id, tb.name, tb.bin_code, t.truck_number
      `,
      [binId, id, effectiveUserId]
    );

    const bin = (binRows as any[])[0];

    if (!bin) {
      console.log(
        `Bin not found: binId=${binId}, truckId=${id}, effectiveUserId=${effectiveUserId}`
      );
      return NextResponse.json(
        { error: "Bin not found or not assigned to the technician's truck" },
        { status: 404 }
      );
    }

    // Log raw inventory value for debugging
    console.log(`Raw inventory value: ${bin.inventory}`);

    let inventory;
    try {
      inventory = bin.inventory
        ? JSON.parse(JSON.stringify(bin.inventory))
        : [];
      console.log(`Parsed inventory:`, inventory);
      if (!Array.isArray(inventory)) {
        console.warn(`Parsed inventory is not an array:`, inventory);
        inventory = [inventory]; // Wrap in array if single object
      }
    } catch (parseError: any) {
      console.error(`Failed to parse inventory JSON: ${parseError.message}`);
      console.error(`Raw inventory: ${bin.inventory}`);
      inventory = [];
    }

    const formattedBin = {
      id: bin.id,
      name: bin.name,
      code: bin.code,
      location: bin.location,
      truckNumber: bin.truck_number,
      inventory: inventory.filter((item: any) => item && item.id),
    };

    console.log(
      `Successfully fetched bin: ${bin.id} with ${formattedBin.inventory.length} items`
    );
    return NextResponse.json(formattedBin);
  } catch (error: any) {
    console.error("Bin details API error:", {
      message: error.message,
      stack: error.stack,
      sqlMessage: error.sqlMessage,
      sql: error.sql,
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; binId: string }> }
) {
  let connection;
  try {
    const { id, binId } = await params;
    console.log(`Adding item to bin: truckId=${id}, binId=${binId}`);

    const authHeader = request.headers.get("authorization");
    const token =
      authHeader?.replace("Bearer ", "") ||
      request.cookies.get("access_token")?.value;

    if (!token) {
      console.log("No token provided");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || "your_jwt_secret");
      console.log(`Authenticated user: ${decoded.id}`);
    } catch (err) {
      console.error("JWT verification error:", err);
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const userId = decoded.id;

    // Check user role
    const [userRows] = await pool.query(
      "SELECT role FROM users WHERE id = ? AND status = 'active'",
      [userId]
    );
    const userData = (userRows as any[])[0];

    if (!userData) {
      console.log(`User not found or inactive: userId=${userId}`);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let effectiveUserId = userId;

    // If user is admin, find the technician assigned to the truck via bin
    if (userData.role === "admin") {
      const [truckRows] = await pool.query(
        `
        SELECT t.assigned_to
        FROM trucks t
        JOIN truck_bins tb ON t.id = tb.truck_id
        WHERE tb.id = ? AND tb.truck_id = ?
        `,
        [binId, id]
      );
      const truck = (truckRows as any[])[0];

      if (!truck) {
        console.log(`Truck or bin not found: truckId=${id}, binId=${binId}`);
        return NextResponse.json(
          { error: "Truck or bin not found" },
          { status: 404 }
        );
      }

      if (!truck.assigned_to) {
        console.log(`No technician assigned to truck: truckId=${id}`);
        return NextResponse.json(
          { error: "No technician assigned to truck" },
          { status: 403 }
        );
      }

      effectiveUserId = truck.assigned_to;
      console.log(
        `Admin access: Using technician ID ${effectiveUserId} for truck ${id}`
      );
    } else if (userData.role !== "technician") {
      console.log(`Forbidden: User ${userId} is not a technician or admin`);
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Verify truck exists and is assigned to effectiveUserId
    const [truckRows] = await pool.query(
      "SELECT id FROM trucks WHERE id = ? AND assigned_to = ?",
      [id, effectiveUserId]
    );
    const truck = (truckRows as any[])[0];

    if (!truck) {
      console.log(
        `Truck not found or not assigned: truckId=${id}, userId=${effectiveUserId}`
      );
      return NextResponse.json(
        { error: "Truck not assigned to the technician" },
        { status: 403 }
      );
    }

    const [binRows] = await pool.query(
      "SELECT id FROM truck_bins WHERE id = ? AND truck_id = ?",
      [binId, id]
    );
    const bin = (binRows as any[])[0];

    if (!bin) {
      console.log(`Bin not found: binId=${binId}, truckId=${id}`);
      return NextResponse.json({ error: "Bin not found" }, { status: 404 });
    }

    const body = await request.json();
    const { inventory_item_id, quantity } = body;

    if (!inventory_item_id || !quantity || quantity < 0) {
      console.log("Invalid request body:", { inventory_item_id, quantity });
      return NextResponse.json(
        { error: "Invalid inventory item or quantity" },
        { status: 400 }
      );
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [itemRows] = await connection.query(
      "SELECT id FROM inventory_items WHERE id = ?",
      [inventory_item_id]
    );
    const item = (itemRows as any[])[0];

    if (!item) {
      console.log(
        `Inventory item not found: inventory_item_id=${inventory_item_id}`
      );
      await connection.rollback();
      return NextResponse.json(
        { error: "Inventory item not found" },
        { status: 404 }
      );
    }

    const [existingInventory] = await connection.query(
      "SELECT quantity FROM truck_inventory WHERE truck_id = ? AND bin_id = ? AND item_id = ?",
      [id, binId, inventory_item_id]
    );

    if ((existingInventory as any[]).length > 0) {
      await connection.query(
        "UPDATE truck_inventory SET quantity = ?, last_restocked = NOW() WHERE truck_id = ? AND bin_id = ? AND item_id = ?",
        [quantity, id, binId, inventory_item_id]
      );
      console.log(
        `Updated inventory item: item_id=${inventory_item_id}, new_quantity=${quantity}`
      );
    } else {
      // Generate UUID for id column
      const newId = uuidv4();
      await connection.query(
        "INSERT INTO truck_inventory (id, truck_id, bin_id, item_id, quantity, min_quantity, max_quantity, last_restocked) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())",
        [newId, id, binId, inventory_item_id, quantity, 10, 20]
      );
      console.log(
        `Inserted new inventory item: id=${newId}, item_id=${inventory_item_id}, quantity=${quantity}`
      );
    }

    await connection.commit();
    console.log(`Successfully added/updated item in bin: binId=${binId}`);

    return NextResponse.json({ message: "Item added to bin successfully" });
  } catch (error: any) {
    if (connection) {
      await connection.rollback();
    }
    console.error("Add item to bin error:", {
      message: error.message,
      stack: error.stack,
      sqlMessage: error.sqlMessage,
      sql: error.sql,
    });
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
  { params }: { params: Promise<{ id: string; binId: string }> }
) {
  let connection;
  try {
    const { id, binId } = await params;

    // Get itemId from query parameters instead of path parameters
    const url = new URL(request.url);
    const itemId = url.searchParams.get("itemId");

    console.log(`URL: ${request.url}`);
    console.log(`Query params:`, Object.fromEntries(url.searchParams));
    console.log(
      `Deleting item from bin: truckId=${id}, binId=${binId}, itemId=${itemId}`
    );

    if (!itemId) {
      console.log("ItemId query parameter is missing");
      return NextResponse.json(
        { error: "itemId query parameter is required" },
        { status: 400 }
      );
    }

    const authHeader = request.headers.get("authorization");
    const token =
      authHeader?.replace("Bearer ", "") ||
      request.cookies.get("access_token")?.value;

    if (!token) {
      console.log("No token provided");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || "your_jwt_secret");
      console.log(`Authenticated user: ${decoded.id}`);
    } catch (err) {
      console.error("JWT verification error:", err);
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const userId = decoded.id;

    // Check user role
    const [userRows] = await pool.query(
      "SELECT role FROM users WHERE id = ? AND status = 'active'",
      [userId]
    );
    const userData = (userRows as any[])[0];

    if (!userData) {
      console.log(`User not found or inactive: userId=${userId}`);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let effectiveUserId = userId;

    // If user is admin, find the technician assigned to the truck via bin
    if (userData.role === "admin") {
      const [truckRows] = await pool.query(
        `
        SELECT t.assigned_to
        FROM trucks t
        JOIN truck_bins tb ON t.id = tb.truck_id
        WHERE tb.id = ? AND tb.truck_id = ?
        `,
        [binId, id]
      );
      const truck = (truckRows as any[])[0];

      if (!truck) {
        console.log(`Truck or bin not found: truckId=${id}, binId=${binId}`);
        return NextResponse.json(
          { error: "Truck or bin not found" },
          { status: 404 }
        );
      }

      if (!truck.assigned_to) {
        console.log(`No technician assigned to truck: truckId=${id}`);
        return NextResponse.json(
          { error: "No technician assigned to truck" },
          { status: 403 }
        );
      }

      effectiveUserId = truck.assigned_to;
      console.log(
        `Admin access: Using technician ID ${effectiveUserId} for truck ${id}`
      );
    } else if (userData.role !== "technician") {
      console.log(`Forbidden: User ${userId} is not a technician or admin`);
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Verify truck exists and is assigned to effectiveUserId
    const [truckRows] = await pool.query(
      "SELECT id FROM trucks WHERE id = ? AND assigned_to = ?",
      [id, effectiveUserId]
    );
    const truck = (truckRows as any[])[0];

    if (!truck) {
      console.log(
        `Truck not found or not assigned: truckId=${id}, userId=${effectiveUserId}`
      );
      return NextResponse.json(
        { error: "Truck not assigned to the technician" },
        { status: 403 }
      );
    }

    const [binRows] = await pool.query(
      "SELECT id FROM truck_bins WHERE id = ? AND truck_id = ?",
      [binId, id]
    );
    const bin = (binRows as any[])[0];

    if (!bin) {
      console.log(`Bin not found: binId=${binId}, truckId=${id}`);
      return NextResponse.json({ error: "Bin not found" }, { status: 404 });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Debug: Check what's actually in the database
    console.log(`Searching for item with ID: ${itemId}`);

    const [inventoryRows] = await connection.query(
      "SELECT item_id FROM truck_inventory WHERE truck_id = ? AND bin_id = ? AND item_id = ?",
      [id, binId, itemId]
    );

    console.log(`Found inventory items:`, inventoryRows);

    if ((inventoryRows as any[]).length === 0) {
      console.log(
        `Inventory item not found: itemId=${itemId}, binId=${binId}, truckId=${id}`
      );

      // Additional debug: Check if item exists with different truck_id or bin_id
      const [allItemsInBin] = await connection.query(
        "SELECT item_id, truck_id, bin_id FROM truck_inventory WHERE truck_id = ? AND bin_id = ?",
        [id, binId]
      );
      console.log(`All items in bin ${binId}:`, allItemsInBin);

      await connection.rollback();
      return NextResponse.json(
        {
          error: "Inventory item not found in bin",
          debug: {
            searchedItemId: itemId,
            truckId: id,
            binId: binId,
            allItemsInBin: allItemsInBin,
          },
        },
        { status: 404 }
      );
    }

    // Delete the item
    const [deleteResult] = await connection.query(
      "DELETE FROM truck_inventory WHERE truck_id = ? AND bin_id = ? AND item_id = ?",
      [id, binId, itemId]
    );

    console.log(`Delete result:`, deleteResult);

    await connection.commit();
    console.log(
      `Successfully deleted item: itemId=${itemId} from binId=${binId}`
    );

    return NextResponse.json({
      message: "Item removed from bin successfully",
      deletedItemId: itemId,
      affectedRows: (deleteResult as any).affectedRows,
    });
  } catch (error: any) {
    if (connection) {
      await connection.rollback();
    }
    console.error("Delete item from bin error:", {
      message: error.message,
      stack: error.stack,
      sqlMessage: error.sqlMessage,
      sql: error.sql,
    });
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