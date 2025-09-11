"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Home, Truck, Package, ShoppingCart, RotateCcw, Shield, Users, Settings } from "lucide-react"
import { useAuth } from "../auth-provider"

const technicianNavigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Trucks", href: "/trucks", icon: Truck },
  { name: "Inventory", href: "/inventory", icon: Package },
  { name: "Order", href: "/order", icon: ShoppingCart },
  { name: "Restock", href: "/restock", icon: RotateCcw },
]

const adminNavigation = [
  { name: "Admin Dashboard", href: "/admin", icon: Shield },
  { name: "Fleet Management", href: "/admin/trucks", icon: Truck },
  { name: "User Management", href: "/admin/users", icon: Users },
  { name: "Orders", href: "/admin/orders", icon: ShoppingCart },
  { name: "Settings", href: "/admin/settings", icon: Settings },
]

export function MobileTabNavigation() {
  const pathname = usePathname();
  const { user, logout, loading } = useAuth();
  const navigation =
    user?.role === "admin" ? adminNavigation : technicianNavigation;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 md:hidden">
      <div className="grid grid-cols-5 h-20">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center space-y-1 transition-colors duration-200",
                isActive ? "text-[#E3253D]" : "text-gray-500 active:text-gray-700",
              )}
            >
              <div className={cn("p-1 rounded-lg transition-all duration-200", isActive && "bg-[#E3253D]/10")}>
                <item.icon
                  className={cn("h-6 w-6 transition-all duration-200", isActive ? "text-[#E3253D]" : "text-gray-500")}
                />
              </div>
              <span
                className={cn(
                  "text-[0.6rem] font-medium transition-colors duration-200 text-center", // Reduced font size to 0.6rem
                  isActive ? "text-[#E3253D]" : "text-gray-500",
                )}
                style={{ maxWidth: "100%", padding: "0 2px" }} // Kept maxWidth and padding
              >
                {item.name}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}