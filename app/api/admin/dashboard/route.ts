import { NextResponse } from "next/server";
import pool from "../../../../lib/db";
import jwt from "jsonwebtoken";
import { verify } from "jsonwebtoken";

interface DashboardResponse {
  success: boolean;
  data?: {
    stats: {
      totalTechnicians: number;
      activeTechnicians: number;
      totalOrders: number;
      pendingOrders: number;
      totalRevenue: number;
      monthlyRevenue: number;
      totalCredits: number;
      pendingRedemptions: number;
    };
    recentActivity: {
      id: string;
      type: "order" | "technician" | "redemption" | "supply_house";
      message: string;
      time: string;
      status: "new" | "success" | "pending" | "info";
    }[];
    topPerformers: {
      name: string;
      orders: number;
      credits: number;
      efficiency: number;
    }[];
  };
  error?: string;
  code?: string;
}

export async function GET(req: Request) {
  try {
    // Verify JWT token
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: No token provided",
          code: "UNAUTHORIZED",
        },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];
    let decoded: { id: string; role: string };
    try {
      decoded = verify(token, process.env.JWT_SECRET as string) as {
        id: string;
        role: string;
      };
      // if (decoded.role !== "admin") {
      //   return NextResponse.json(
      //     {
      //       success: false,
      //       error: "Forbidden: Admin access required",
      //       code: "FORBIDDEN",
      //     },
      //     { status: 403 }
      //   );
      // }
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Invalid token",
          code: "INVALID_TOKEN",
        },
        { status: 401 }
      );
    }

    // Fetch stats
    const [technicianStats] = await pool.query<
      {
        totalTechnicians: number;
        activeTechnicians: number;
      }[]
    >(
      `SELECT 
        COUNT(*) as totalTechnicians,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as activeTechnicians
      FROM users WHERE role = 'technician'`
    );

    const [orderStats] = await pool.query<
      {
        totalOrders: number;
        pendingOrders: number;
        totalRevenue: number;
        monthlyRevenue: number;
      }[]
    >(
      `SELECT 
        COUNT(*) as totalOrders,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pendingOrders,
        SUM(total_amount) as totalRevenue,
        SUM(CASE WHEN created_at >= DATE_SUB(CURDATE(), INTERVAL DAY(CURDATE()) - 1 DAY) THEN total_amount ELSE 0 END) as monthlyRevenue
      FROM orders`
    );

    const [creditStats] = await pool.query<
      {
        totalCredits: number;
        pendingRedemptions: number;
      }[]
    >(
      `SELECT 
        SUM(amount) as totalCredits,
        SUM(CASE WHEN status = 'pending_redemption' THEN 1 ELSE 0 END) as pendingRedemptions
      FROM credits`
    );

    // Fetch recent activities (limit to 5, ordered by created_at)
    const [recentActivity] = await pool.query<
      {
        id: string;
        type: "order" | "technician" | "redemption" | "supply_house";
        message: string;
        status: "new" | "success" | "pending" | "info";
        created_at: Date;
      }[]
    >(
      `SELECT id, type, message, status, created_at 
      FROM activities 
      ORDER BY created_at DESC 
      LIMIT 5`
    );

    // Calculate relative time for activities
    const recentActivityFormatted = recentActivity.map((activity) => {
      const now = new Date();
      const diffMs = now.getTime() - activity.created_at.getTime();
      const diffMins = Math.floor(diffMs / 1000 / 60);
      let time: string;
      if (diffMins < 60) {
        time = `${diffMins} minute${diffMins === 1 ? "" : "s"} ago`;
      } else if (diffMins < 1440) {
        const hours = Math.floor(diffMins / 60);
        time = `${hours} hour${hours === 1 ? "" : "s"} ago`;
      } else {
        const days = Math.floor(diffMins / 1440);
        time = `${days} day${days === 1 ? "" : "s"} ago`;
      }
      return {
        id: activity.id,
        type: activity.type,
        message: activity.message,
        time,
        status: activity.status,
      };
    });

    // Fetch top performers (limit to 5)
// Fetch top performers (limit to 5)
const [topPerformers] = await pool.query<{
  name: string;
  orders: number;
  credits: number | null;
  efficiency: number;
}[]>(
  `SELECT 
    CONCAT(u.first_name, ' ', u.last_name) as name,
    COUNT(o.id) as orders,
    COALESCE(SUM(c.amount), 0) as credits,
    COALESCE(
      (SUM(CASE WHEN o.status = 'completed' THEN 1 ELSE 0 END) / NULLIF(COUNT(o.id), 0)) * 100,
      0
    ) as efficiency
  FROM users u
  LEFT JOIN orders o ON u.id = o.technician_id
  LEFT JOIN credits c ON u.id = c.user_id
  WHERE u.role = 'technician'
  GROUP BY u.id, u.first_name, u.last_name
  ORDER BY orders DESC
  LIMIT 5`
);



    // Format response to match mock data
    const response: DashboardResponse = {
      success: true,
      data: {
        stats: {
          totalTechnicians: technicianStats[0]?.totalTechnicians || 0,
          activeTechnicians: technicianStats[0]?.activeTechnicians || 0,
          totalOrders: orderStats[0]?.totalOrders || 0,
          pendingOrders: orderStats[0]?.pendingOrders || 0,
          totalRevenue: Number(orderStats[0]?.totalRevenue) || 0,
          monthlyRevenue: Number(orderStats[0]?.monthlyRevenue) || 0,
          totalCredits: Number(creditStats[0]?.totalCredits) || 0,
          pendingRedemptions: creditStats[0]?.pendingRedemptions || 0,
        },
        recentActivity: recentActivityFormatted,
        // Format response
        topPerformers: topPerformers.map((p) => ({
          name: p.name,
          orders: p.orders,
          credits: Number((p.credits ?? 0)),
          efficiency: Math.round(p.efficiency),
        })),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json(
      { success: false, error: "Server error", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
