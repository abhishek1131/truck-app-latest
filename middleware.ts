import { type NextRequest, NextResponse } from "next/server"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow all routes to pass through since authentication is now handled client-side
  console.log("[v0] Middleware allowing all routes (client-side auth enabled)")
  return NextResponse.next()

  // Public routes that don't require authentication
  const publicRoutes = ["/", "/login", "/register"]

  // Allow all authentication API routes
  // if (publicRoutes.includes(pathname) || pathname.startsWith("/api/auth/")) {
  //   console.log("[v0] Public route, allowing access")
  //   return NextResponse.next()
  // }

  // try {
  //   const authHeader = request.headers.get("authorization")
  //   const sessionToken = authHeader?.replace("Bearer ", "")

  //   console.log("[v0] Session token exists:", !!sessionToken)
  //   console.log("[v0] Session token length:", sessionToken?.length || 0)

  //   if (!sessionToken) {
  //     console.log("[v0] No session token, redirecting to login")
  //     return NextResponse.redirect(new URL("/login", request.url))
  //   }

  //   // Parse and validate session
  //   const sessionData = JSON.parse(Buffer.from(sessionToken, "base64").toString())

  //   console.log("[v0] Session data parsed:", sessionData.email, sessionData.role)

  //   // Check if session is expired
  //   if (sessionData.expires < Date.now()) {
  //     console.log("[v0] Session expired, redirecting to login")
  //     return NextResponse.redirect(new URL("/login", request.url))
  //   }

  //   const user = {
  //     id: sessionData.id,
  //     email: sessionData.email,
  //     first_name: sessionData.first_name,
  //     last_name: sessionData.last_name,
  //     role: sessionData.role,
  //     phone: sessionData.phone,
  //     status: sessionData.status,
  //   }

  //   // Role-based route protection
  //   if (pathname.startsWith("/admin") && user.role !== "admin") {
  //     console.log("[v0] Non-admin trying to access admin route, redirecting to dashboard")
  //     return NextResponse.redirect(new URL("/dashboard", request.url))
  //   }

  //   if (pathname.startsWith("/dashboard") && user.role === "admin") {
  //     console.log("[v0] Admin trying to access dashboard, redirecting to admin")
  //     return NextResponse.redirect(new URL("/admin", request.url))
  //   }

  //   console.log("[v0] Authentication successful, allowing access")
  //   return NextResponse.next()
  // } catch (error) {
  //   console.log("[v0] Middleware error:", error)
  //   // If there's an error checking auth, redirect to login
  //   return NextResponse.redirect(new URL("/login", request.url))
  // }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
