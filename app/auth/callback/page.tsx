import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function AuthCallbackPage({
  searchParams,
}: {
  searchParams: { code?: string }
}) {
  const code = searchParams.code

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Get user to determine redirect
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()

        if (userData?.role === "admin") {
          redirect("/admin")
        } else {
          redirect("/dashboard")
        }
      }
    }
  }

  // If something went wrong, redirect to login
  redirect("/login")
}
