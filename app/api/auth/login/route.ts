import { type NextRequest, NextResponse } from "next/server"
import { loginUser } from "@/lib/auth/auth"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ success: false, error: "Email and password are required" }, { status: 400 })
    }

    console.log("[v0] Login attempt for:", email)

    const result = await loginUser(email, password)

    if (!result.success) {
      console.log("[v0] Login failed:", result.error)
      return NextResponse.json({ success: false, error: result.error }, { status: 401 })
    }

    const redirectUrl = result.user?.role === "admin" ? "/admin" : "/dashboard"

    const sessionData = {
      id: result.user!.id,
      email: result.user!.email,
      first_name: result.user!.first_name,
      last_name: result.user!.last_name,
      role: result.user!.role,
      phone: result.user!.phone,
      status: result.user!.status,
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    }

    const sessionToken = Buffer.from(JSON.stringify(sessionData)).toString("base64")

    console.log("[v0] Session created for user:", result.user!.email, "Role:", result.user!.role)
    console.log("[v0] Session token length:", sessionToken.length)

    return NextResponse.json({
      success: true,
      user: result.user,
      redirectUrl,
      sessionToken, // Send token to client for localStorage storage
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
