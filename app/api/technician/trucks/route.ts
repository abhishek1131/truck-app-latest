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

    // Get technician's assigned trucks with full details
    const { data: trucks, error } = await supabase
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
      .eq("assigned_technician_id", user.id)
      .order("truck_number", { ascending: true })

    if (error) {
      console.error("Trucks fetch error:", error)
      return NextResponse.json({ error: "Failed to fetch trucks" }, { status: 500 })
    }

    return NextResponse.json({ trucks: trucks || [] })
  } catch (error) {
    console.error("Technician trucks API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
