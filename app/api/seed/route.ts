import { NextResponse } from "next/server";
import mysql from "mysql2/promise";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";

// Database configuration (use environment variables in .env.local)
const dbConfig = {
  host: "localhost", // From URL
  user: "root", // From URL
  password: "root1234", // From URL
  database: "truck_local_dump", // From URL
};


// Generate a UUID
const generateUUID = () => uuidv4();

export async function GET() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    await connection.beginTransaction();

    // Insert into inventory_categories
    const category1Id = generateUUID();
    const category2Id = generateUUID();
    await connection.execute(
      `INSERT INTO inventory_categories (id, name, description, created_at)
       VALUES (?, ?, ?, NOW()),
              (?, ?, ?, NOW())`,
      [
        category1Id,
        "Tools",
        "Hand tools and equipment",
        category2Id,
        "Parts",
        "Vehicle replacement parts",
      ]
    );

    // Insert into users
    const user1Id = generateUUID();
    const user2Id = generateUUID();
    const hashedPassword = await bcrypt.hash("password123", 10);
    await connection.execute(
      `INSERT INTO users (id, email, first_name, last_name, phone, role, status, password, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW()),
              (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        user1Id,
        "john.doe@example.com",
        "John",
        "Doe",
        "(555) 123-4567",
        "technician",
        "active",
        hashedPassword,
        user2Id,
        "alice.wong@example.com",
        "Alice",
        "Wong",
        "(555) 987-6543",
        "admin",
        "active",
        hashedPassword,
      ]
    );

    // Insert into trucks
    const truck1Id = generateUUID();
    const truck2Id = generateUUID();
    await connection.execute(
      `INSERT INTO trucks (id, truck_number, name, make, model, year, license_plate, vin, status, location, mileage, assigned_to, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW()),
              (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        truck1Id,
        "TRK-004",
        "Ford Transit",
        "Ford",
        "Transit",
        2022,
        "GHI789",
        "1FTBR1Y8XMKA12345",
        "active",
        "South Route",
        10000,
        user1Id,
        truck2Id,
        "TRK-005",
        "Chevy Express",
        "Chevrolet",
        "Express",
        2021,
        "JKL012",
        "1GCWGAFP9M1234567",
        "active",
        "West Route",
        8000,
        user2Id,
      ]
    );

    // Insert into truck_bins
    const bin1Id = generateUUID();
    const bin2Id = generateUUID();
    await connection.execute(
      `INSERT INTO truck_bins (id, truck_id, bin_code, name, description, max_capacity, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW()),
              (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        bin1Id,
        truck1Id,
        "BIN-004",
        "Primary Storage",
        "Main storage compartment",
        100,
        bin2Id,
        truck2Id,
        "BIN-005",
        "Tool Bin",
        "Tool storage",
        50,
      ]
    );

    // Insert into inventory_items
    const item1Id = generateUUID();
    const item2Id = generateUUID();
    await connection.execute(
      `INSERT INTO inventory_items (id, part_number, name, description, category_id, unit_price, cost_price, supplier, unit, min_quantity, max_quantity, standard_level, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW()),
              (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        item1Id,
        "PART-004",
        "Screwdriver Set",
        "Professional screwdriver set",
        category1Id,
        29.99,
        15.0,
        "ToolCo",
        "pieces",
        5,
        50,
        50,
        item2Id,
        "PART-005",
        "Brake Caliper",
        "High-performance brake caliper",
        category2Id,
        99.99,
        60.0,
        "AutoParts Inc",
        "pieces",
        2,
        20,
        20,
      ]
    );

    // Insert into truck_inventory
    await connection.execute(
      `INSERT INTO truck_inventory (id, truck_id, bin_id, item_id, quantity, min_quantity, max_quantity, last_restocked, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW()),
              (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        generateUUID(),
        truck1Id,
        bin1Id,
        item1Id,
        30,
        5,
        50,
        "2025-08-31 10:00:00",
        generateUUID(),
        truck2Id,
        bin2Id,
        item2Id,
        10,
        2,
        20,
        "2025-08-31 10:00:00",
      ]
    );

    // Insert into orders
    const order1Id = generateUUID();
    const order2Id = generateUUID();
    await connection.execute(
      `INSERT INTO orders (id, order_number, type, technician_id, truck_id, status, priority, requested_delivery_date, created_at, updated_at, urgency, user_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), ?, ?),
              (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), ?, ?)`,
      [
        order1Id,
        "#ORD-1250",
        "restock",
        user1Id,
        truck1Id,
        "pending",
        "medium",
        "2025-09-02",
        "normal",
        user1Id,
        order2Id,
        "#ORD-1251",
        "restock",
        user2Id,
        truck2Id,
        "pending",
        "high",
        "2025-09-03",
        "high",
        user2Id,
      ]
    );

    // Insert into credits
    await connection.execute(
      `INSERT INTO credits (id, technician_id, user_id, order_id, type, amount, balance_after, description, created_at, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?),
              (?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)`,
      [
        generateUUID(),
        user1Id,
        user1Id,
        order1Id,
        "earned",
        5.0,
        5.0,
        "Order #ORD-1250 commission",
        "issued",
        generateUUID(),
        user2Id,
        user2Id,
        order2Id,
        "bonus",
        10.0,
        10.0,
        "Performance bonus",
        "issued",
      ]
    );

    // Insert into activities
    await connection.execute(
      `INSERT INTO activities (id, type, message, status, created_at)
       VALUES (?, ?, ?, ?, NOW()),
              (?, ?, ?, ?, NOW())`,
      [
        generateUUID(),
        "order",
        "New order #ORD-1250 from John Doe",
        "new",
        generateUUID(),
        "technician",
        "Alice Wong logged in",
        "success",
      ]
    );

    await connection.commit();
    return NextResponse.json(
      { message: "Database seeded successfully" },
      { status: 200 }
    );
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Seeding error:", error);
    return NextResponse.json(
      { error: "Failed to seed database" },
      { status: 500 }
    );
  } finally {
    if (connection) await connection.end();
  }
}
