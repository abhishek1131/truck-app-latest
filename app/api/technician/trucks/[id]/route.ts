import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
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

    // Get truck details (only if assigned to this technician)
    const { data: truck, error } = await supabase
      .from("trucks")
      .select(
        `
        *,
        bins:truck_bins!truck_bins_truck_id_fkey(*),
        inventory:truck_inventory!truck_inventory_truck_id_fkey(
          *,
          inventory_item:inventory_items!truck_inventory_inventory_item_id_fkey(*),
          bin:truck_bins!truck_inventory_bin_id_fkey(*)
        )
      `,
      )
      .eq("id", params.id)
      .eq("assigned_technician_id", user.id)
      .single()

    if (error) {
      console.error("Truck fetch error:", error)
      return NextResponse.json({ error: "Truck not found or not assigned to you" }, { status: 404 })
    }

    return NextResponse.json(truck)
  } catch (error) {
    console.error("Truck details API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
