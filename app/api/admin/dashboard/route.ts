import { createClient } from "@/lib/supabase/server"
import { db } from "@/lib/database/queries"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check if user is authenticated and is admin
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const { data: userProfile, error: profileError } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profileError || userProfile?.role !== "admin") {
      return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 })
    }

    // Get dashboard stats
    const statsResult = await db.getDashboardStats()

    if (!statsResult.success) {
      return NextResponse.json(statsResult, { status: 500 })
    }

    return NextResponse.json(statsResult)
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
