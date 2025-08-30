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
    const { truck_id, bin_id, inventory_item_id, quantity_change, action } = body

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

    // Update inventory using stored procedure
    const { data, error } = await supabase.rpc("update_truck_inventory", {
      p_truck_id: truck_id,
      p_bin_id: bin_id,
      p_inventory_item_id: inventory_item_id,
      p_quantity_change: quantity_change,
    })

    if (error) {
      console.error("Inventory update error:", error)
      return NextResponse.json({ error: "Failed to update inventory" }, { status: 500 })
    }

    // Get updated inventory item
    const { data: updatedItem } = await supabase
      .from("truck_inventory")
      .select(
        `
        *,
        inventory_item:inventory_items!truck_inventory_inventory_item_id_fkey(*),
        bin:truck_bins!truck_inventory_bin_id_fkey(*)
      `,
      )
      .eq("truck_id", truck_id)
      .eq("bin_id", bin_id)
      .eq("inventory_item_id", inventory_item_id)
      .single()

    return NextResponse.json({
      message: "Inventory updated successfully",
      item: updatedItem,
      action,
    })
  } catch (error) {
    console.error("Update inventory error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
