import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")

    // Get credits history
    const {
      data: credits,
      error,
      count,
    } = await supabase
      .from("credits")
      .select(
        `
        *,
        order:orders!credits_order_id_fkey(order_number, total_amount)
      `,
        { count: "exact" },
      )
      .eq("technician_id", user.id)
      .order("created_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    if (error) {
      console.error("Credits fetch error:", error)
      return NextResponse.json({ error: "Failed to fetch credits" }, { status: 500 })
    }

    // Calculate balance
    const balance =
      credits?.reduce((total, credit) => {
        return credit.type === "earned" || credit.type === "adjustment" ? total + credit.amount : total - credit.amount
      }, 0) || 0

    return NextResponse.json({
      credits: credits || [],
      balance,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error("Credits API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
