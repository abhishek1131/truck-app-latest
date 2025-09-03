"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Bell, Search, Settings } from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

interface Notification {
  id: string;
  user_id: string;
  user_name: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: string | null;
  created_at: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!token || !user) return;
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (result.success && result.data) {
        setNotifications(result.data.notifications);
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to fetch notifications",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch notifications",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [token, user, toast]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  if (!user) return null;

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
      .toUpperCase() || "T";

  return (
    <div className="h-16 bg-white border-b border-gray-200/80 sticky top-0 z-30 shadow-sm">
      <div className="h-full px-4 md:px-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
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
          <div className="hidden lg:flex relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search..."
              className="pl-10 w-64 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
            />
          </div>

          <Link href="/settings" className="md:hidden">
            <Button variant="ghost" size="sm" className="p-2 h-8 w-8">
              <Settings className="h-4 w-4" />
            </Button>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="relative bg-transparent p-2 h-8 w-8 md:h-auto md:w-auto md:px-3"
                disabled={isLoading}
              >
                <Bell className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Notifications</span>
                {notifications.length > 0 && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#E3253D] rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-bold">
                      {notifications.length}
                    </span>
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-80 max-h-96 overflow-y-auto"
            >
              {notifications.length === 0 ? (
                <DropdownMenuItem className="text-gray-500 italic">
                  No notifications
                </DropdownMenuItem>
              ) : (
                notifications.map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    className="flex flex-col items-start py-2 px-4"
                  >
                    <div className="flex items-center w-full">
                      <span className="font-semibold text-[#10294B]">
                        {notification.user_name}
                      </span>
                      <span className="text-xs text-gray-500 ml-auto">
                        {format(
                          new Date(notification.created_at),
                          "MMM d, HH:mm"
                        )}
                      </span>
                    </div>
                    <div className="text-sm text-gray-700">
                      {notification.action}
                    </div>
                    {notification.details && (
                      <div className="text-xs text-gray-500">
                        {notification.details}
                      </div>
                    )}
                    {notification.entity_type === "order" &&
                      notification.entity_id && (
                        <Link
                          href={`/admin/orders/${notification.entity_id}`}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          View Order
                        </Link>
                      )}
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>

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
