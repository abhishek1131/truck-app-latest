"use client";

import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Bell, Search, Settings } from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const { user } = useAuth();

  if (!user) return null;

  // Construct name from first_name and last_name, with fallback
  const displayName =
    user.first_name || user.last_name
      ? `${user.first_name || ""} ${user.last_name || ""}`.trim()
      : "Unknown User";
  const initials =
    displayName
      .split(" ")
      .filter((n) => n)
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "T"; // Fallback to "T" if no initials

  return (
    <div className="h-16 bg-white border-b border-gray-200/80 sticky top-0 z-30 shadow-sm">
      <div className="h-full px-4 md:px-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Mobile Logo */}
          <div className="flex items-center space-x-3 md:hidden">
            <div className="w-8 h-8 bg-[#E3253D] rounded-lg flex items-center justify-center text-white font-bold text-sm">
              T
            </div>
          </div>

          <div>
            <h1 className="text-xl md:text-2xl font-bold text-[#10294B] tracking-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-gray-600 text-sm font-medium hidden md:block">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2 md:space-x-4">
          {/* Search - Hidden on mobile */}
          <div className="hidden lg:flex relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search..."
              className="pl-10 w-64 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
            />
          </div>

          {/* Mobile Settings Button */}
          <Link href="/settings" className="md:hidden">
            <Button variant="ghost" size="sm" className="p-2 h-8 w-8">
              <Settings className="h-4 w-4" />
            </Button>
          </Link>

          {/* Notifications */}
          <Button
            variant="ghost"
            size="sm"
            className="relative bg-transparent p-2 h-8 w-8 md:h-auto md:w-auto md:px-3"
          >
            <Bell className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Notifications</span>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#E3253D] rounded-full flex items-center justify-center">
              <span className="text-xs text-white font-bold">3</span>
            </div>
          </Button>

          {/* User Avatar */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-[#E3253D] to-red-600 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-lg">
              {initials}
            </div>
            <div className="hidden lg:block">
              <p className="text-sm font-semibold text-[#10294B]">
                {displayName}
              </p>
              <p className="text-xs text-gray-600 capitalize">{user.role}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
