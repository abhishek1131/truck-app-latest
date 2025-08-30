import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
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

    if (!userData || userData.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const status = searchParams.get("status") || ""
    const technician = searchParams.get("technician") || ""
    const truck = searchParams.get("truck") || ""

    let query = supabase
      .from("orders")
      .select(
        `
        *,
        technician:users!orders_technician_id_fkey(id, first_name, last_name, email),
        truck:trucks!orders_truck_id_fkey(id, truck_number, make, model),
        order_items:order_items!order_items_order_id_fkey(
          *,
          inventory_item:inventory_items!order_items_inventory_item_id_fkey(name, part_number),
          bin:truck_bins!order_items_bin_id_fkey(bin_code, name)
        )
      `,
        { count: "exact" },
      )
      .order("created_at", { ascending: false })

    // Apply filters
    if (status) {
      query = query.eq("status", status)
    }

    if (technician) {
      query = query.eq("technician_id", technician)
    }

    if (truck) {
      query = query.eq("truck_id", truck)
    }

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data: orders, error, count } = await query

    if (error) {
      console.error("Orders fetch error:", error)
      return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 })
    }

    return NextResponse.json({
      orders: orders || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error("Orders API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
