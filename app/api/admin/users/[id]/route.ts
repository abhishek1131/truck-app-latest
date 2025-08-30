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

    const { data: targetUser, error } = await supabase
      .from("users")
      .select(
        `
        *,
        assigned_trucks:trucks!trucks_assigned_technician_id_fkey(*),
        orders:orders!orders_technician_id_fkey(
          *,
          order_items:order_items!order_items_order_id_fkey(*)
        ),
        credits:credits!credits_technician_id_fkey(*)
      `,
      )
      .eq("id", params.id)
      .single()

    if (error) {
      console.error("User fetch error:", error)
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(targetUser)
  } catch (error) {
    console.error("User details API error:", error)
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
    const { first_name, last_name, phone, role, status } = body

    const { data: updatedUser, error } = await supabase
      .from("users")
      .update({
        first_name,
        last_name,
        phone,
        role,
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select()
      .single()

    if (error) {
      console.error("User update error:", error)
      return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
    }

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error("Update user error:", error)
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

    // Delete from auth (this will cascade to users table)
    const { error: authError } = await supabase.auth.admin.deleteUser(params.id)

    if (authError) {
      console.error("Auth user deletion error:", authError)
      return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
    }

    return NextResponse.json({ message: "User deleted successfully" })
  } catch (error) {
    console.error("Delete user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
