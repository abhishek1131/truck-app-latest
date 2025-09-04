import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    // Verify admin access
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()

    // if (!userData || userData.role !== "admin") {
    //   return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    // }

    // Get dashboard statistics
    const [
      { count: totalUsers },
      { count: totalTechnicians },
      { count: totalTrucks },
      { count: activeTrucks },
      { count: trucksInMaintenance },
      { count: totalOrders },
      { count: pendingOrders },
      { count: completedOrders },
      { data: recentOrders },
      { data: lowStockItems },
      { data: topTechnicians },
    ] = await Promise.all([
      supabase.from("users").select("*", { count: "exact", head: true }),
      supabase.from("users").select("*", { count: "exact", head: true }).eq("role", "technician"),
      supabase.from("trucks").select("*", { count: "exact", head: true }),
      supabase.from("trucks").select("*", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("trucks").select("*", { count: "exact", head: true }).eq("status", "maintenance"),
      supabase.from("orders").select("*", { count: "exact", head: true }),
      supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "completed"),
      supabase
        .from("orders")
        .select(
          `
          *,
          technician:users!orders_technician_id_fkey(first_name, last_name),
          truck:trucks!orders_truck_id_fkey(truck_number)
        `,
        )
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("inventory_items")
        .select("*")
        .lt("stock_quantity", supabase.rpc("min_stock_level"))
        .order("stock_quantity", { ascending: true })
        .limit(10),
      supabase
        .from("orders")
        .select(
          `
          technician_id,
          technician:users!orders_technician_id_fkey(first_name, last_name),
          total_amount
        `,
        )
        .eq("status", "completed")
        .order("total_amount", { ascending: false })
        .limit(5),
    ])

    // Calculate revenue statistics
    const { data: revenueData } = await supabase
      .from("orders")
      .select("total_amount, commission_amount, created_at")
      .eq("status", "completed")

    const totalRevenue = revenueData?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0
    const totalCommissions = revenueData?.reduce((sum, order) => sum + (order.commission_amount || 0), 0) || 0

    // Calculate monthly revenue (last 12 months)
    const monthlyRevenue = Array.from({ length: 12 }, (_, i) => {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0)

      const monthRevenue =
        revenueData
          ?.filter((order) => {
            const orderDate = new Date(order.created_at)
            return orderDate >= monthStart && orderDate <= monthEnd
          })
          .reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0

      return {
        month: date.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
        revenue: monthRevenue,
      }
    }).reverse()

    const stats = {
      users: {
        total: totalUsers || 0,
        technicians: totalTechnicians || 0,
        admins: (totalUsers || 0) - (totalTechnicians || 0),
      },
      trucks: {
        total: totalTrucks || 0,
        active: activeTrucks || 0,
        maintenance: trucksInMaintenance || 0,
        inactive: (totalTrucks || 0) - (activeTrucks || 0) - (trucksInMaintenance || 0),
      },
      orders: {
        total: totalOrders || 0,
        pending: pendingOrders || 0,
        completed: completedOrders || 0,
        inProgress: (totalOrders || 0) - (pendingOrders || 0) - (completedOrders || 0),
      },
      revenue: {
        total: totalRevenue,
        commissions: totalCommissions,
        monthly: monthlyRevenue,
      },
      recentOrders: recentOrders || [],
      lowStockItems: lowStockItems || [],
      topTechnicians: topTechnicians || [],
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Dashboard stats error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
