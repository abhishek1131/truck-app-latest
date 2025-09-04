"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Home,
  Truck,
  Package,
  ShoppingCart,
  RotateCcw,
  Settings,
  LogOut,
  Users,
  Shield,
} from "lucide-react";
import { useAuth } from "@/components/auth-provider";

const technicianNavigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Trucks", href: "/trucks", icon: Truck },
  { name: "Inventory", href: "/inventory", icon: Package },
  { name: "Order", href: "/order", icon: ShoppingCart },
  { name: "Restock", href: "/restock", icon: RotateCcw },
  { name: "Settings", href: "/settings", icon: Settings },
];

const adminNavigation = [
  { name: "Admin Dashboard", href: "/admin", icon: Shield },
  { name: "Fleet Management", href: "/admin/trucks", icon: Truck },
  { name: "User Management", href: "/admin/users", icon: Users },
  { name: "Orders", href: "/admin/orders", icon: ShoppingCart },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export function SidebarNavigation() {
  const pathname = usePathname();
  const { user, logout, loading } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);

  const navigation =
    user?.role === "admin" ? adminNavigation : technicianNavigation;

  // Construct name from first_name and last_name, with fallback
  const displayName =
    user?.first_name || user?.last_name
      ? `${user?.first_name || ""} ${user?.last_name || ""}`.trim()
      : "Unknown User";
  const initials =
    displayName
      .split(" ")
      .filter((n) => n)
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "T"; // Fallback to "T" if no initials

  return (
    <>
      {/* Desktop Sidebar - Hidden on mobile */}
      <div
        className={cn(
          "fixed left-0 top-0 z-50 h-full bg-white border-r border-gray-200 transition-all duration-300 ease-in-out hidden md:flex md:flex-col",
          isExpanded ? "w-64" : "w-16"
        )}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
      >
        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-[#E3253D] rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              T
            </div>
            {isExpanded && (
              <div className="flex flex-col">
                <span className="text-lg font-bold text-[#10294B]">
                  TruXtoK
                </span>
                <span className="text-xs text-gray-500">
                  {user?.role === "admin" ? "Administrator" : "Technician"}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation - Takes up remaining space */}
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navigation.map((item) => {
            const isActive =
              user?.role === "admin"
                ? pathname === item.href ||
                  (item.href !== "/admin" &&
                    pathname.startsWith(item.href + "/"))
                : pathname === item.href ||
                  pathname.startsWith(item.href + "/");

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200",
                  isActive
                    ? "bg-[#E3253D] text-white"
                    : "text-gray-700 hover:bg-gray-100 hover:text-[#10294B]"
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {isExpanded && <span className="ml-3">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User Profile - Fixed at bottom */}
        <div className="border-t border-gray-200 p-2 flex-shrink-0">
          {user && (
            <div
              className={cn(
                "flex items-center px-3 py-2",
                isExpanded ? "space-x-3" : "justify-center"
              )}
            >
              <div className="w-8 h-8 bg-[#10294B] rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                {initials}
              </div>
              {isExpanded && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {displayName}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
              )}
            </div>
          )}
          <button
            onClick={logout}
            disabled={loading}
            className={cn(
              "flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 rounded-lg transition-colors duration-200",
              !isExpanded && "justify-center",
              loading && "opacity-50 cursor-not-allowed"
            )}
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {isExpanded && <span className="ml-3">Logout</span>}
          </button>
        </div>
      </div>
    </>
  );
}
