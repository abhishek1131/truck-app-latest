"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"

interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  role: string
  phone: string
  status: string
}

interface AuthWrapperProps {
  children: React.ReactNode
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const publicRoutes = ["/", "/login", "/register"]
    const isPublicRoute = publicRoutes.includes(pathname)

    const sessionToken = localStorage.getItem("session_token")
    const userData = localStorage.getItem("user_data")

    console.log("[v0] AuthWrapper effect running for pathname:", pathname)
    console.log("[v0] Session token exists:", !!sessionToken)
    console.log("[v0] Is public route:", isPublicRoute)

    if (sessionToken && userData) {
      try {
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)
        console.log("[v0] User data loaded:", parsedUser.email, parsedUser.role)

        if (isPublicRoute) {
          const redirectUrl = parsedUser.role === "admin" ? "/admin" : "/dashboard"
          console.log("[v0] Redirecting authenticated user from", pathname, "to:", redirectUrl)
          router.replace(redirectUrl)
          return
        }
      } catch (error) {
        console.error("Error parsing user data:", error)
        localStorage.removeItem("session_token")
        localStorage.removeItem("user_data")
        setUser(null)
      }
    }

    if (!sessionToken && !isPublicRoute) {
      console.log("[v0] No session token, redirecting to login")
      router.replace("/login")
      return
    }

    console.log("[v0] Auth check complete, setting loading to false")
    setIsLoading(false)
  }, [pathname])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E3253D]"></div>
      </div>
    )
  }

  return <>{children}</>
}
