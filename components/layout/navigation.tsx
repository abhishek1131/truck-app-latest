"use client"

import type React from "react"
import { useEffect, useState } from "react"

import { SidebarNavigation } from "./sidebar-navigation"
import { MobileTabNavigation } from "./mobile-tab-navigation"
import { Header } from "./header"

interface NavigationProps {
  children: React.ReactNode
  title: string
  subtitle?: string
}

interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  role: string
  phone: string
  status: string
}

export function Navigation({ children, title, subtitle }: NavigationProps) {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const userData = localStorage.getItem("user_data")
    const sessionToken = localStorage.getItem("session_token")

    if (userData && sessionToken) {
      try {
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)

        // Set Authorization header for API requests
        const originalFetch = window.fetch
        window.fetch = (input, init = {}) =>
          originalFetch(input, {
            ...init,
            headers: {
              ...init.headers,
              Authorization: `Bearer ${sessionToken}`,
            },
          })
      } catch (error) {
        console.error("Error parsing user data:", error)
        localStorage.removeItem("user_data")
        localStorage.removeItem("session_token")
      }
    }
  }, [])

  if (!user) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <SidebarNavigation />

      {/* Main Content */}
      <div className="md:ml-16 flex flex-col min-h-screen">
        {/* Header */}
        <Header title={title} subtitle={subtitle} />

        {/* Page Content */}
        <main className="flex-1 pb-20 md:pb-0">{children}</main>
      </div>

      {/* Mobile Tab Navigation */}
      <MobileTabNavigation />
    </div>
  )
}
