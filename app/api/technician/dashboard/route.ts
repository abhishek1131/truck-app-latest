import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    // Verify technician access
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()

    if (!userData || userData.role !== "technician") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get technician's assigned trucks
    const { data: assignedTrucks } = await supabase
      .from("trucks")
      .select(
        `
        *,
        bins:truck_bins!truck_bins_truck_id_fkey(count),
        inventory:truck_inventory!truck_inventory_truck_id_fkey(
          quantity,
          inventory_item:inventory_items!truck_inventory_inventory_item_id_fkey(name)
        )
      `,
      )
      .eq("assigned_technician_id", user.id)
      .eq("status", "active")

    // Get recent orders
    const { data: recentOrders } = await supabase
      .from("orders")
      .select(
        `
        *,
        truck:trucks!orders_truck_id_fkey(truck_number, make, model),
        order_items:order_items!order_items_order_id_fkey(
          quantity,
          total_price,
          inventory_item:inventory_items!order_items_inventory_item_id_fkey(name)
        )
      `,
      )
      .eq("technician_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5)

    // Get credits balance
    const { data: creditsData } = await supabase
      .from("credits")
      .select("amount, type")
      .eq("technician_id", user.id)
      .order("created_at", { ascending: false })

    const creditsBalance =
      creditsData?.reduce((total, credit) => {
        return credit.type === "earned" || credit.type === "adjustment" ? total + credit.amount : total - credit.amount
      }, 0) || 0

    // Get order statistics
    const [{ count: totalOrders }, { count: pendingOrders }, { count: completedOrders }, { data: monthlyOrdersData }] =
      await Promise.all([
        supabase.from("orders").select("*", { count: "exact", head: true }).eq("technician_id", user.id),
        supabase
          .from("orders")
          .select("*", { count: "exact", head: true })
          .eq("technician_id", user.id)
          .eq("status", "pending"),
        supabase
          .from("orders")
          .select("*", { count: "exact", head: true })
          .eq("technician_id", user.id)
          .eq("status", "completed"),
        supabase
          .from("orders")
          .select("total_amount, created_at")
          .eq("technician_id", user.id)
          .eq("status", "completed")
          .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
      ])

    const monthlyEarnings = monthlyOrdersData?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0

    // Calculate inventory alerts (low stock items in assigned trucks)
    const inventoryAlerts = []
    if (assignedTrucks) {
      for (const truck of assignedTrucks) {
        const { data: lowStockItems } = await supabase
          .from("truck_inventory")
          .select(
            `
            quantity,
            inventory_item:inventory_items!truck_inventory_inventory_item_id_fkey(name, min_stock_level),
            bin:truck_bins!truck_inventory_bin_id_fkey(bin_code)
          `,
          )
          .eq("truck_id", truck.id)
          .lt("quantity", 10) // Low stock threshold

        if (lowStockItems) {
          inventoryAlerts.push(
            ...lowStockItems.map((item) => ({
              truck: truck.truck_number,
              item: item.inventory_item?.name,
              binCode: item.bin?.bin_code,
              quantity: item.quantity,
            })),
          )
        }
      }
    }

    const dashboard = {
      trucks: {
        assigned: assignedTrucks?.length || 0,
        active: assignedTrucks?.filter((t) => t.status === "active").length || 0,
        totalBins: assignedTrucks?.reduce((sum, truck) => sum + (truck.bins?.[0]?.count || 0), 0) || 0,
        totalItems: assignedTrucks?.reduce((sum, truck) => sum + (truck.inventory?.length || 0), 0) || 0,
      },
      orders: {
        total: totalOrders || 0,
        pending: pendingOrders || 0,
        completed: completedOrders || 0,
        monthlyEarnings,
      },
      credits: {
        balance: creditsBalance,
        recent: creditsData?.slice(0, 5) || [],
      },
      recentOrders: recentOrders || [],
      assignedTrucks: assignedTrucks || [],
      inventoryAlerts: inventoryAlerts.slice(0, 10), // Limit to 10 alerts
    }

    return NextResponse.json(dashboard)
  } catch (error) {
    console.error("Technician dashboard error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
