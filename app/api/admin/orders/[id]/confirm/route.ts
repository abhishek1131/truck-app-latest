import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
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

    // Update order status to confirmed
    const { data: updatedOrder, error } = await supabase
      .from("orders")
      .update({
        status: "confirmed",
        confirmed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .eq("status", "pending") // Only confirm pending orders
      .select()
      .single()

    if (error) {
      console.error("Order confirmation error:", error)
      return NextResponse.json({ error: "Failed to confirm order" }, { status: 500 })
    }

    if (!updatedOrder) {
      return NextResponse.json({ error: "Order not found or already confirmed" }, { status: 404 })
    }

    return NextResponse.json({ message: "Order confirmed successfully", order: updatedOrder })
  } catch (error) {
    console.error("Confirm order error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
