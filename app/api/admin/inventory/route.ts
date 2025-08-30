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
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const search = searchParams.get("search") || ""
    const category = searchParams.get("category") || ""
    const lowStock = searchParams.get("lowStock") === "true"

    let query = supabase.from("inventory_items").select("*", { count: "exact" }).order("name", { ascending: true })

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,part_number.ilike.%${search}%,description.ilike.%${search}%`)
    }

    if (category) {
      query = query.eq("category", category)
    }

    if (lowStock) {
      query = query.lt("stock_quantity", supabase.rpc("min_stock_level"))
    }

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data: items, error, count } = await query

    if (error) {
      console.error("Inventory fetch error:", error)
      return NextResponse.json({ error: "Failed to fetch inventory" }, { status: 500 })
    }

    return NextResponse.json({
      items: items || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error("Inventory API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { part_number, name, description, category, unit_price, stock_quantity, min_stock_level } = body

    const { data: newItem, error } = await supabase
      .from("inventory_items")
      .insert({
        part_number,
        name,
        description,
        category,
        unit_price,
        stock_quantity,
        min_stock_level,
      })
      .select()
      .single()

    if (error) {
      console.error("Inventory item creation error:", error)
      return NextResponse.json({ error: "Failed to create inventory item" }, { status: 500 })
    }

    return NextResponse.json(newItem)
  } catch (error) {
    console.error("Create inventory item error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
