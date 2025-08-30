import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
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

    const { data: truck, error } = await supabase
      .from("trucks")
      .select(
        `
        *,
        assigned_technician:users!trucks_assigned_technician_id_fkey(*),
        bins:truck_bins!truck_bins_truck_id_fkey(*),
        inventory:truck_inventory!truck_inventory_truck_id_fkey(
          *,
          inventory_item:inventory_items!truck_inventory_inventory_item_id_fkey(*),
          bin:truck_bins!truck_inventory_bin_id_fkey(*)
        ),
        orders:orders!orders_truck_id_fkey(*)
      `,
      )
      .eq("id", params.id)
      .single()

    if (error) {
      console.error("Truck fetch error:", error)
      return NextResponse.json({ error: "Truck not found" }, { status: 404 })
    }

    return NextResponse.json(truck)
  } catch (error) {
    console.error("Truck details API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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
    const { truck_number, make, model, year, license_plate, vin, location, status, assigned_technician_id, mileage } =
      body

    const { data: updatedTruck, error } = await supabase
      .from("trucks")
      .update({
        truck_number,
        make,
        model,
        year,
        license_plate,
        vin,
        location,
        status,
        assigned_technician_id: assigned_technician_id || null,
        mileage,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select()
      .single()

    if (error) {
      console.error("Truck update error:", error)
      return NextResponse.json({ error: "Failed to update truck" }, { status: 500 })
    }

    return NextResponse.json(updatedTruck)
  } catch (error) {
    console.error("Update truck error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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

    const { error } = await supabase.from("trucks").delete().eq("id", params.id)

    if (error) {
      console.error("Truck deletion error:", error)
      return NextResponse.json({ error: "Failed to delete truck" }, { status: 500 })
    }

    return NextResponse.json({ message: "Truck deleted successfully" })
  } catch (error) {
    console.error("Delete truck error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
