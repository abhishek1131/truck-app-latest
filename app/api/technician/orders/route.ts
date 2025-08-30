import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const status = searchParams.get("status") || ""
    const truck = searchParams.get("truck") || ""

    let query = supabase
      .from("orders")
      .select(
        `
        *,
        truck:trucks!orders_truck_id_fkey(id, truck_number, make, model),
        order_items:order_items!order_items_order_id_fkey(
          *,
          inventory_item:inventory_items!order_items_inventory_item_id_fkey(*),
          bin:truck_bins!order_items_bin_id_fkey(*)
        )
      `,
        { count: "exact" },
      )
      .eq("technician_id", user.id)
      .order("created_at", { ascending: false })

    // Apply filters
    if (status) {
      query = query.eq("status", status)
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
    console.error("Technician orders API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { truck_id, items, notes } = body

    // Verify truck is assigned to this technician
    const { data: truck } = await supabase
      .from("trucks")
      .select("id")
      .eq("id", truck_id)
      .eq("assigned_technician_id", user.id)
      .single()

    if (!truck) {
      return NextResponse.json({ error: "Truck not assigned to you" }, { status: 403 })
    }

    // Create order
    const { data: newOrder, error: orderError } = await supabase
      .from("orders")
      .insert({
        technician_id: user.id,
        truck_id,
        notes,
        status: "pending",
      })
      .select()
      .single()

    if (orderError) {
      console.error("Order creation error:", orderError)
      return NextResponse.json({ error: "Failed to create order" }, { status: 500 })
    }

    // Create order items
    const orderItems = items.map((item: any) => ({
      order_id: newOrder.id,
      inventory_item_id: item.inventory_item_id,
      bin_id: item.bin_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.quantity * item.unit_price,
    }))

    const { error: itemsError } = await supabase.from("order_items").insert(orderItems)

    if (itemsError) {
      console.error("Order items creation error:", itemsError)
      // Rollback order creation
      await supabase.from("orders").delete().eq("id", newOrder.id)
      return NextResponse.json({ error: "Failed to create order items" }, { status: 500 })
    }

    // Update truck inventory (reduce quantities)
    for (const item of items) {
      await supabase.rpc("update_truck_inventory", {
        p_truck_id: truck_id,
        p_bin_id: item.bin_id,
        p_inventory_item_id: item.inventory_item_id,
        p_quantity_change: -item.quantity,
      })
    }

    return NextResponse.json({ message: "Order created successfully", order: newOrder })
  } catch (error) {
    console.error("Create order error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
