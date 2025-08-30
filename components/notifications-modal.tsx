"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import {
  Bell,
  DollarSign,
  ShoppingCart,
  CheckCircle,
  Clock,
  Gift,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

const mockNotifications = [
  {
    id: "1",
    type: "order",
    title: "Order Completed",
    message: "Your order #ORD-001 for HVAC Filter Set has been completed",
    time: "2 minutes ago",
    icon: CheckCircle,
    color: "text-green-600",
    bgColor: "bg-green-100",
  },
  {
    id: "2",
    type: "credit",
    title: "Credits Earned",
    message: "You earned $2.55 in credits from order #ORD-004",
    time: "15 minutes ago",
    icon: DollarSign,
    color: "text-green-600",
    bgColor: "bg-green-100",
  },
  {
    id: "3",
    type: "redemption",
    title: "Redemption Approved",
    message: "Your $50 cash redemption request has been approved",
    time: "1 hour ago",
    icon: Gift,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
  {
    id: "4",
    type: "order",
    title: "Order Shipped",
    message: "Order #ORD-003 has been shipped and is on its way",
    time: "2 hours ago",
    icon: ShoppingCart,
    color: "text-purple-600",
    bgColor: "bg-purple-100",
  },
  {
    id: "5",
    type: "system",
    title: "Monthly Performance Bonus",
    message: "Congratulations! You've earned a $25 performance bonus",
    time: "1 day ago",
    icon: TrendingUp,
    color: "text-yellow-600",
    bgColor: "bg-yellow-100",
  },
  {
    id: "6",
    type: "order",
    title: "Order Pending",
    message: "Order #ORD-002 is pending approval from supply house",
    time: "2 days ago",
    icon: Clock,
    color: "text-orange-600",
    bgColor: "bg-orange-100",
  },
  {
    id: "7",
    type: "credit",
    title: "Credits Earned",
    message: "You earned $1.25 in credits from order #ORD-005",
    time: "3 days ago",
    icon: DollarSign,
    color: "text-green-600",
    bgColor: "bg-green-100",
  },
  {
    id: "8",
    type: "order",
    title: "Order Delivered",
    message: "Order #ORD-006 has been successfully delivered",
    time: "4 days ago",
    icon: CheckCircle,
    color: "text-green-600",
    bgColor: "bg-green-100",
  },
  {
    id: "9",
    type: "system",
    title: "Account Verification",
    message: "Your account has been successfully verified",
    time: "5 days ago",
    icon: CheckCircle,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
  {
    id: "10",
    type: "redemption",
    title: "Redemption Processed",
    message: "Your $25 gift card redemption has been processed",
    time: "1 week ago",
    icon: Gift,
    color: "text-purple-600",
    bgColor: "bg-purple-100",
  },
]

const ITEMS_PER_PAGE = 5

export function NotificationsModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  const totalPages = Math.ceil(mockNotifications.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentNotifications = mockNotifications.slice(startIndex, endIndex)

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="text-white hover:bg-[#006AA1] relative">
          <Bell className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#E3253D] rounded-full text-xs flex items-center justify-center text-white font-bold">
            {mockNotifications.length > 9 ? "9+" : mockNotifications.length}
          </span>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px] flex flex-col">
        <SheetHeader className="flex-shrink-0 px-6 pt-6">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="text-[#10294B]">Notifications</SheetTitle>
              <SheetDescription>Stay updated with your latest activities</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 flex flex-col px-6">
          <ScrollArea className="flex-1 -mx-2 px-2">
            <div className="space-y-3 py-4">
              {currentNotifications.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No notifications yet</p>
                </div>
              ) : (
                currentNotifications.map((notification) => {
                  const Icon = notification.icon
                  return (
                    <div
                      key={notification.id}
                      className="p-4 rounded-lg border bg-white border-gray-200 transition-all duration-200 hover:shadow-md"
                    >
                      <div className="flex items-start space-x-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${notification.bgColor}`}
                        >
                          <Icon className={`h-5 w-5 ${notification.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-[#10294B] truncate">{notification.title}</h4>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{notification.message}</p>
                          <p className="text-xs text-gray-500 mt-2">{notification.time}</p>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </ScrollArea>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between py-4 border-t flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPrevPage}
                disabled={currentPage === 1}
                className="flex items-center gap-2 bg-transparent"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className="flex items-center gap-2 bg-transparent"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
