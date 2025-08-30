import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

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
    const { bin_code, truck_id } = body

    // Verify truck is assigned to this technician
    const { data: truck } = await supabase
      .from("trucks")
      .select("id, truck_number")
      .eq("id", truck_id)
      .eq("assigned_technician_id", user.id)
      .single()

    if (!truck) {
      return NextResponse.json({ error: "Truck not assigned to you" }, { status: 403 })
    }

    // Get bin information and inventory
    const { data: bin, error: binError } = await supabase
      .from("truck_bins")
      .select(
        `
        *,
        inventory:truck_inventory!truck_inventory_bin_id_fkey(
          *,
          inventory_item:inventory_items!truck_inventory_inventory_item_id_fkey(*)
        )
      `,
      )
      .eq("truck_id", truck_id)
      .eq("bin_code", bin_code)
      .single()

    if (binError || !bin) {
      return NextResponse.json({ error: "Bin not found in this truck" }, { status: 404 })
    }

    return NextResponse.json({
      bin,
      truck: {
        id: truck.id,
        truck_number: truck.truck_number,
      },
    })
  } catch (error) {
    console.error("Bin scan error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
