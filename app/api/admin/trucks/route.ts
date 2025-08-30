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
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") || ""
    const assigned = searchParams.get("assigned") || ""

    let query = supabase
      .from("trucks")
      .select(
        `
        *,
        assigned_technician:users!trucks_assigned_technician_id_fkey(id, first_name, last_name, email),
        bins:truck_bins!truck_bins_truck_id_fkey(count),
        inventory:truck_inventory!truck_inventory_truck_id_fkey(count)
      `,
        { count: "exact" },
      )
      .order("created_at", { ascending: false })

    // Apply filters
    if (search) {
      query = query.or(`truck_number.ilike.%${search}%,make.ilike.%${search}%,model.ilike.%${search}%`)
    }

    if (status) {
      query = query.eq("status", status)
    }

    if (assigned === "true") {
      query = query.not("assigned_technician_id", "is", null)
    } else if (assigned === "false") {
      query = query.is("assigned_technician_id", null)
    }

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data: trucks, error, count } = await query

    if (error) {
      console.error("Trucks fetch error:", error)
      return NextResponse.json({ error: "Failed to fetch trucks" }, { status: 500 })
    }

    return NextResponse.json({
      trucks: trucks || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error("Trucks API error:", error)
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
    const { truck_number, make, model, year, license_plate, vin, location, assigned_technician_id } = body

    const { data: newTruck, error } = await supabase
      .from("trucks")
      .insert({
        truck_number,
        make,
        model,
        year,
        license_plate,
        vin,
        location,
        assigned_technician_id: assigned_technician_id || null,
        status: "active",
      })
      .select()
      .single()

    if (error) {
      console.error("Truck creation error:", error)
      return NextResponse.json({ error: "Failed to create truck" }, { status: 500 })
    }

    return NextResponse.json(newTruck)
  } catch (error) {
    console.error("Create truck error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
