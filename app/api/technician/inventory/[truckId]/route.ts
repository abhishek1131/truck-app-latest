import { createClient } from "@/lib/supabase/server"
import { db } from "@/lib/database/queries"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { truckId: string } }) {
  try {
    const supabase = await createClient()

    // Check technician authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Check if technician has access to this truck
    const { data: truck, error: truckError } = await supabase
      .from("trucks")
      .select("assigned_to")
      .eq("id", params.truckId)
      .single()

    if (truckError || truck?.assigned_to !== user.id) {
      return NextResponse.json({ success: false, error: "Access denied" }, { status: 403 })
    }

    const result = await db.getTruckInventory(params.truckId)
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
