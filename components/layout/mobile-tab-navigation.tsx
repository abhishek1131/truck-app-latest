"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Home, Truck, Package, ShoppingCart, RotateCcw, Shield, Users, Settings, Package2 } from "lucide-react"
import { useAuth } from "../auth-provider"

const technicianNavigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Trucks", href: "/trucks", icon: Truck },
  { name: "Inventory", href: "/inventory", icon: Package },
  { name: "Use Parts", href: "/use-parts", icon: Package2 },
  { name: "Order", href: "/order", icon: ShoppingCart },
  { name: "Restock", href: "/restock", icon: RotateCcw },
]

const baseAdminNavigation = [
  { name: "Dashboard", href: "/admin", icon: Shield },
  { name: "Fleet", href: "/admin/trucks", icon: Truck },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Inventory", href: "/admin/inventory", icon: Package },
  { name: "Orders", href: "/admin/orders", icon: ShoppingCart },
]

export function MobileTabNavigation() {
  const pathname = usePathname();
  const { user, logout, loading } = useAuth();

  // Build admin navigation dynamically based on user role
  const adminNavigation = [
    ...baseAdminNavigation,
    ...(user?.role === "super_admin"
      ? [{ name: "Settings", href: "/admin/settings", icon: Settings }]
      : []),
  ];

  const navigation =
    (user?.role === "super_admin" || user?.role === "company_admin") ? adminNavigation : technicianNavigation;

  // Dynamic grid columns based on navigation items count
  const gridCols = navigation.length === 5 ? "grid-cols-5" : "grid-cols-6";

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 md:hidden">
      <div className={`grid ${gridCols} h-20`}>
        {navigation.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center space-y-1 transition-colors duration-200 px-1",
                isActive ? "text-[#E3253D]" : "text-gray-500 active:text-gray-700",
              )}
            >
              <div className={cn("p-1 rounded-lg transition-all duration-200", isActive && "bg-[#E3253D]/10")}>
                <item.icon
                  className={cn("h-5 w-5 transition-all duration-200", isActive ? "text-[#E3253D]" : "text-gray-500")}
                />
              </div>
              <span
                className={cn(
                  "text-[0.55rem] font-medium transition-colors duration-200 text-center leading-tight",
                  isActive ? "text-[#E3253D]" : "text-gray-500",
                )}
                style={{ 
                  maxWidth: "100%", 
                  wordBreak: "break-word",
                  lineHeight: "1.1"
                }}
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