import { createClient } from "@/lib/supabase/server"
import { db } from "@/lib/database/queries"
import { type NextRequest, NextResponse } from "next/server"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()

    // Check admin authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { data: userProfile } = await supabase.from("users").select("role").eq("id", user.id).single()

    if (userProfile?.role !== "admin") {
      return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 })
    }

    const { userId } = await request.json()
    const result = await db.assignTruck(params.id, userId)

    return NextResponse.json(result, {
      status: result.success ? 200 : 400,
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
