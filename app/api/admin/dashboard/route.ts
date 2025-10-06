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
      totalTrucks: number;
      totalItems: number;
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

    // Get current user details for role-based filtering
    const [currentUserRows] = await pool.query(
      `SELECT role, company_name FROM users WHERE id = ?`,
      [decoded.id]
    );
    const currentUser = (currentUserRows as any[])[0];
    
    if (!currentUser || (currentUser.role !== "super_admin" && currentUser.role !== "company_admin")) {
      return NextResponse.json(
        { success: false, error: "Forbidden", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    const isSuperAdmin = currentUser.role === "super_admin";
    const userCompany = currentUser.company_name;

    // Fetch stats with role-based filtering
    const technicianQuery = isSuperAdmin 
    ? `SELECT 
        COUNT(*) as totalTechnicians,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as activeTechnicians
      FROM users WHERE role = 'technician' OR role = 'company_admin'`
    : `SELECT 
        COUNT(*) as totalTechnicians,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as activeTechnicians
      FROM users WHERE role = 'technician' AND (company_name = ? OR created_by = ?)`;
    
    const technicianParams = isSuperAdmin ? [] : [userCompany, decoded.id];
    const [technicianStats] = await pool.query(technicianQuery, technicianParams);

    const orderQuery = isSuperAdmin 
      ? `SELECT 
          COUNT(*) as totalOrders,
          SUM(CASE WHEN o.status = 'pending' THEN 1 ELSE 0 END) as pendingOrders,
          SUM(o.total_amount) as totalRevenue,
          SUM(CASE WHEN o.created_at >= DATE_SUB(CURDATE(), INTERVAL DAY(CURDATE()) - 1 DAY) THEN o.total_amount ELSE 0 END) as monthlyRevenue
        FROM orders o`
      : `SELECT 
          COUNT(*) as totalOrders,
          SUM(CASE WHEN o.status = 'pending' THEN 1 ELSE 0 END) as pendingOrders,
          SUM(o.total_amount) as totalRevenue,
          SUM(CASE WHEN o.created_at >= DATE_SUB(CURDATE(), INTERVAL DAY(CURDATE()) - 1 DAY) THEN o.total_amount ELSE 0 END) as monthlyRevenue
        FROM orders o
        INNER JOIN users u ON o.technician_id = u.id
        WHERE u.company_name = ? OR u.created_by = ?`;
    
    const orderParams = isSuperAdmin ? [] : [userCompany, decoded.id];
    const [orderStats] = await pool.query(orderQuery, orderParams);

    const creditQuery = isSuperAdmin 
      ? `SELECT 
          SUM(c.amount) as totalCredits,
          SUM(CASE WHEN c.status = 'pending_redemption' THEN 1 ELSE 0 END) as pendingRedemptions
        FROM credits c`
      : `SELECT 
          SUM(c.amount) as totalCredits,
          SUM(CASE WHEN c.status = 'pending_redemption' THEN 1 ELSE 0 END) as pendingRedemptions
        FROM credits c
        INNER JOIN users u ON c.user_id = u.id
        WHERE u.company_name = ? OR u.created_by = ?`;
    
    const creditParams = isSuperAdmin ? [] : [userCompany, decoded.id];
    const [creditStats] = await pool.query(creditQuery, creditParams);

    const truckQuery = isSuperAdmin 
      ? `SELECT COUNT(*) as totalTrucks FROM trucks`
      : `SELECT COUNT(*) as totalTrucks 
        FROM trucks t
        WHERE t.created_by = ?`;
    
    const truckParams = isSuperAdmin ? [] : [decoded.id];
    const [truckStats] = await pool.query(truckQuery, truckParams);

    const itemQuery = isSuperAdmin 
      ? `SELECT COUNT(*) as totalItems FROM inventory_items`
      : `SELECT COUNT(*) as totalItems 
        FROM inventory_items i
        INNER JOIN users u ON i.created_by = u.id
        WHERE u.company_name = ? OR u.created_by = ?`;
    
    const itemParams = isSuperAdmin ? [] : [userCompany, decoded.id];
    const [itemStats] = await pool.query(itemQuery, itemParams);

    // Fetch recent activities with role-based filtering
    const activityQuery = isSuperAdmin 
      ? `SELECT id, type, message, status, created_at 
        FROM activities 
        ORDER BY created_at DESC 
        LIMIT 5`
      : `SELECT a.id, a.type, a.message, a.status, a.created_at 
        FROM activities a
        INNER JOIN users u ON a.user_id = u.id
        WHERE u.created_by = ?
        ORDER BY a.created_at DESC 
        LIMIT 5`;
    
    const activityParams = isSuperAdmin ? [] : [decoded.id];
    const [recentActivity] = await pool.query(activityQuery, activityParams);

    // Calculate relative time for activities
    const recentActivityFormatted = (recentActivity as any[]).map((activity: any) => {
      const now = new Date();
      // Ensure we're working with proper Date objects
      const activityDate = new Date(activity.created_at);
      const diffMs = now.getTime() - activityDate.getTime();
      const diffMins = Math.floor(diffMs / 1000 / 60);
      let time: string;
      
      if (diffMins < 1) {
        time = "Just now";
      } else if (diffMins < 60) {
        time = `${diffMins} minute${diffMins === 1 ? "" : "s"} ago`;
      } else if (diffMins < 1440) {
        const hours = Math.floor(diffMins / 60);
        const remainingMins = diffMins % 60;
        if (remainingMins === 0) {
          time = `${hours} hour${hours === 1 ? "" : "s"} ago`;
        } else {
          time = `${hours}h ${remainingMins}m ago`;
        }
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

    // Fetch top performers with role-based filtering
    const topPerformersQuery = isSuperAdmin 
      ? `SELECT 
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
        ORDER BY COUNT(o.id) DESC
        LIMIT 5`
      : `SELECT 
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
        WHERE u.role = 'technician' AND (u.company_name = ? OR u.created_by = ?)
        GROUP BY u.id, u.first_name, u.last_name
        ORDER BY COUNT(o.id) DESC
        LIMIT 5`;
    
    const topPerformersParams = isSuperAdmin ? [] : [userCompany, decoded.id];
    const [topPerformers] = await pool.query(topPerformersQuery, topPerformersParams);



    // Format response to match mock data
    const response: DashboardResponse = {
      success: true,
      data: {
        stats: {
          totalTechnicians: (technicianStats as any[])[0]?.totalTechnicians || 0,
          activeTechnicians: (technicianStats as any[])[0]?.activeTechnicians || 0,
          totalTrucks: (truckStats as any[])[0]?.totalTrucks || 0,
          totalItems: (itemStats as any[])[0]?.totalItems || 0,
          totalOrders: (orderStats as any[])[0]?.totalOrders || 0,
          pendingOrders: (orderStats as any[])[0]?.pendingOrders || 0,
          totalRevenue: Number((orderStats as any[])[0]?.totalRevenue) || 0,
          monthlyRevenue: Number((orderStats as any[])[0]?.monthlyRevenue) || 0,
          totalCredits: Number((creditStats as any[])[0]?.totalCredits) || 0,
          pendingRedemptions: (creditStats as any[])[0]?.pendingRedemptions || 0,
        },
        recentActivity: recentActivityFormatted,
        // Format response
        topPerformers: (topPerformers as any[]).map((p: any) => ({
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
