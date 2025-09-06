import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import jwt from "jsonwebtoken";

export async function GET(request: NextRequest) {
  try {
    // Verify JWT token from Authorization header or localStorage
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

    // if (!userData || userData.role !== "technician") {
    //   return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    // }

    // Get pagination parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    // Fetch credits with order details
    const [creditRows] = await pool.query(
      `SELECT 
         c.id,
         c.type,
         c.amount,
         c.description,
         c.created_at,
         c.status,
         o.order_number
       FROM credits c
       LEFT JOIN orders o ON c.order_id = o.id
       WHERE c.technician_id = ?
       ORDER BY c.created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );

    // Fetch total count for pagination
    const [countRows] = await pool.query(
      "SELECT COUNT(*) as total FROM credits WHERE technician_id = ?",
      [userId]
    );
    const total = (countRows as any[])[0].total;

    // Map credits to match expected UI format
    const credits = (creditRows as any[]).map((credit) => ({
      id: credit.id,
      type: credit.type,
      amount: credit.amount,
      description: credit.order_number
        ? `Order #${credit.order_number} - ${credit.description}`
        : credit.description,
      date: new Date(credit.created_at).toISOString().split("T")[0], // Format as YYYY-MM-DD
      orderId: credit.order_number || null,
      status: credit.status === "redeemed" ? "completed" : credit.status,
    }));

    // Calculate balance
    const [balanceRows] = await pool.query(
      `SELECT 
         SUM(CASE 
           WHEN type IN ('earned', 'bonus', 'adjustment') THEN amount 
           ELSE -amount 
         END) as balance
       FROM credits 
       WHERE technician_id = ?`,
      [userId]
    );
    const balance = (balanceRows as any[])[0].balance || 0;

    return NextResponse.json({
      credits,
      balance,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Credits API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
