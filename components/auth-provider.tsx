"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User as SupabaseUser } from "@supabase/supabase-js"

interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  role: "technician" | "admin"
  status: "active" | "inactive" | "suspended"
  assignedTrucks?: string[]
}

interface AuthContextType {
  user: User | null
  supabaseUser: SupabaseUser | null
  login: (email: string, password: string) => Promise<boolean>
  register: (data: RegisterData) => Promise<boolean>
  logout: () => Promise<void>
  loading: boolean
}

interface RegisterData {
  name: string
  email: string
  password: string
  role: "technician" | "admin"
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session?.user) {
        setSupabaseUser(session.user)
        await fetchUserProfile(session.user.id)
      }

      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setSupabaseUser(session.user)
        await fetchUserProfile(session.user.id)
      } else {
        setSupabaseUser(null)
        setUser(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase.from("users").select("*").eq("id", userId).single()

      if (error) {
        console.error("Error fetching user profile:", error)
        return
      }

      if (data) {
        setUser(data)
      }
    } catch (error) {
      console.error("Error fetching user profile:", error)
    }
  }

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true)

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error("Login error:", error)
        return false
      }

      if (data.user) {
        setSupabaseUser(data.user)
        await fetchUserProfile(data.user.id)
        return true
      }

      return false
    } catch (error) {
      console.error("Login error:", error)
      return false
    } finally {
      setLoading(false)
    }
  }

  const register = async (registerData: RegisterData): Promise<boolean> => {
    try {
      setLoading(true)

      // Split name into first and last name
      const nameParts = registerData.name.trim().split(" ")
      const firstName = nameParts[0] || ""
      const lastName = nameParts.slice(1).join(" ") || ""

      const { data, error } = await supabase.auth.signUp({
        email: registerData.email,
        password: registerData.password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/dashboard`,
          data: {
            first_name: firstName,
            last_name: lastName,
            role: registerData.role,
          },
        },
      })

      if (error) {
        console.error("Registration error:", error)
        return false
      }

      if (data.user) {
        // User profile will be created automatically by the trigger
        return true
      }

      return false
    } catch (error) {
      console.error("Registration error:", error)
      return false
    } finally {
      setLoading(false)
    }
  }

  const logout = async (): Promise<void> => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setSupabaseUser(null)
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  return (
    <AuthContext.Provider value={{ user, supabaseUser, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
