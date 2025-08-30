"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { User, MapPin, Calendar, Star, ShoppingCart, DollarSign, Clock, Mail, Phone } from "lucide-react"

interface TechnicianDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  technician: {
    id: string
    name: string
    email: string
    phone: string
    specialization: string
    location: string
    joinDate: string
    lastActive: string
    status: string
    totalOrders: number
    creditBalance: number
    rating: number
    completedJobs: number
    avatar: string
  }
}

const mockOrderHistory = [
  {
    id: "ORD-001",
    date: "2024-01-15",
    customer: "ABC Supply Co.",
    items: "HVAC Filter Set",
    amount: "$145.99",
    credits: "$7.30",
    status: "completed",
  },
  {
    id: "ORD-002",
    date: "2024-01-14",
    customer: "XYZ Hardware",
    items: "Electrical Components",
    amount: "$289.50",
    credits: "$14.48",
    status: "completed",
  },
  {
    id: "ORD-003",
    date: "2024-01-13",
    customer: "Pro Tools Inc.",
    items: "Plumbing Supplies",
    amount: "$167.25",
    credits: "$8.36",
    status: "shipped",
  },
  {
    id: "ORD-004",
    date: "2024-01-12",
    customer: "BuildMax Supply",
    items: "Industrial Tools",
    amount: "$324.75",
    credits: "$16.24",
    status: "completed",
  },
  {
    id: "ORD-005",
    date: "2024-01-11",
    customer: "TechPro Solutions",
    items: "Safety Equipment",
    amount: "$198.50",
    credits: "$9.93",
    status: "completed",
  },
]

const mockCreditHistory = [
  {
    id: "CR-001",
    date: "2024-01-15",
    type: "earned",
    amount: "$7.30",
    description: "Order completion bonus",
  },
  {
    id: "CR-002",
    date: "2024-01-14",
    type: "earned",
    amount: "$14.48",
    description: "High-value order bonus",
  },
  {
    id: "CR-003",
    date: "2024-01-13",
    type: "redeemed",
    amount: "-$25.00",
    description: "Tool purchase redemption",
  },
  {
    id: "CR-004",
    date: "2024-01-12",
    type: "earned",
    amount: "$16.24",
    description: "Order completion bonus",
  },
  {
    id: "CR-005",
    date: "2024-01-11",
    type: "earned",
    amount: "$9.93",
    description: "Order completion bonus",
  },
]

const mockActivity = [
  {
    id: "ACT-001",
    date: "2024-01-15",
    time: "10:30 AM",
    action: "Completed order ORD-001",
    details: "HVAC Filter Set delivery to ABC Supply Co.",
  },
  {
    id: "ACT-002",
    date: "2024-01-14",
    time: "2:15 PM",
    action: "Order shipped",
    details: "ORD-002 shipped to XYZ Hardware",
  },
  {
    id: "ACT-003",
    date: "2024-01-13",
    time: "9:45 AM",
    action: "New order placed",
    details: "ORD-003 placed with Pro Tools Inc.",
  },
  {
    id: "ACT-004",
    date: "2024-01-12",
    time: "3:20 PM",
    action: "Completed order ORD-004",
    details: "Industrial Tools delivery to BuildMax Supply",
  },
  {
    id: "ACT-005",
    date: "2024-01-11",
    time: "11:15 AM",
    action: "Completed order ORD-005",
    details: "Safety Equipment delivery to TechPro Solutions",
  },
]

export function TechnicianDetailsModal({ isOpen, onClose, technician }: TechnicianDetailsModalProps) {
  const [activeTab, setActiveTab] = useState("overview")

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="flex flex-col p-0 gap-0"
        style={{
          maxWidth: "95vw",
          width: "1200px",
          height: "90vh",
          minWidth: "1000px",
        }}
      >
        <DialogHeader className="flex-shrink-0 px-4 py-3 border-b">
          <DialogTitle className="text-lg text-[#10294B] flex items-center gap-2">
            <User className="h-4 w-4" />
            Technician Details
          </DialogTitle>
          <DialogDescription className="text-sm">
            Complete information and activity history for {technician.name}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <div className="flex-shrink-0 px-4 pt-2">
              <TabsList className="grid w-full grid-cols-4 h-9">
                <TabsTrigger value="overview" className="text-sm">
                  Overview
                </TabsTrigger>
                <TabsTrigger value="orders" className="text-sm">
                  Orders
                </TabsTrigger>
                <TabsTrigger value="credits" className="text-sm">
                  Credits
                </TabsTrigger>
                <TabsTrigger value="activity" className="text-sm">
                  Activity
                </TabsTrigger>
              </TabsList>
            </div>

            <ScrollArea className="flex-1 overflow-auto">
              <div className="px-4 py-3">
                <TabsContent value="overview" className="mt-0 space-y-3">
                  {/* Personal Information - Ultra Compact */}
                  <Card>
                    <CardHeader className="pb-1 pt-3 px-4">
                      <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                        <User className="h-3 w-3" />
                        Personal Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-3 pt-1">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#10294B] text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                          {technician.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-bold text-[#10294B] truncate">{technician.name}</h3>
                            <Badge
                              className={
                                technician.status === "active"
                                  ? "bg-green-100 text-green-800 text-xs px-2 py-0.5"
                                  : "bg-red-100 text-red-800 text-xs px-2 py-0.5"
                              }
                            >
                              {technician.status === "active" ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                          <p className="text-blue-600 font-medium text-sm mb-2">
                            {technician.specialization} Specialist
                          </p>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
                            <div className="flex items-center gap-1.5 text-gray-600">
                              <MapPin className="h-3 w-3 flex-shrink-0" />
                              <span className="font-medium min-w-0">Location:</span>
                              <span className="text-gray-800 truncate">{technician.location}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-gray-600">
                              <Mail className="h-3 w-3 flex-shrink-0" />
                              <span className="font-medium min-w-0">Email:</span>
                              <span className="text-gray-800 truncate">{technician.email}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-gray-600">
                              <Phone className="h-3 w-3 flex-shrink-0" />
                              <span className="font-medium min-w-0">Phone:</span>
                              <span className="text-gray-800">{technician.phone}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-gray-600">
                              <Calendar className="h-3 w-3 flex-shrink-0" />
                              <span className="font-medium min-w-0">Join Date:</span>
                              <span className="text-gray-800">{technician.joinDate}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Statistics */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <Card>
                      <CardContent className="p-3 text-center">
                        <ShoppingCart className="h-6 w-6 text-[#10294B] mx-auto mb-1" />
                        <div className="text-lg font-bold text-[#10294B] mb-0.5">{technician.totalOrders}</div>
                        <p className="text-gray-600 font-medium text-xs">Total Orders</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-3 text-center">
                        <DollarSign className="h-6 w-6 text-green-600 mx-auto mb-1" />
                        <div className="text-lg font-bold text-green-600 mb-0.5">
                          ${technician.creditBalance.toFixed(2)}
                        </div>
                        <p className="text-gray-600 font-medium text-xs">Credit Balance</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-3 text-center">
                        <Clock className="h-6 w-6 text-blue-600 mx-auto mb-1" />
                        <div className="text-lg font-bold text-blue-600 mb-0.5">
                          {technician.lastActive.split("-").slice(1).join("-")}
                        </div>
                        <p className="text-gray-600 font-medium text-xs">Last Active</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-3 text-center">
                        <Star className="h-6 w-6 text-yellow-600 mx-auto mb-1" />
                        <div className="text-lg font-bold text-yellow-600 mb-0.5">{technician.rating}</div>
                        <p className="text-gray-600 font-medium text-xs">Rating</p>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="orders" className="mt-0 space-y-3">
                  <Card>
                    <CardHeader className="pb-2 pt-3 px-4">
                      <CardTitle className="text-sm font-semibold">Recent Orders</CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-3 pt-0">
                      <div className="space-y-2">
                        {mockOrderHistory.map((order) => (
                          <div key={order.id} className="border rounded p-3 hover:bg-gray-50">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="font-semibold text-[#10294B] text-sm">{order.id}</h4>
                                <p className="text-gray-600 text-sm">{order.items}</p>
                              </div>
                              <Badge
                                className={
                                  order.status === "completed"
                                    ? "bg-green-100 text-green-800 text-xs"
                                    : "bg-blue-100 text-blue-800 text-xs"
                                }
                              >
                                {order.status}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-xs text-gray-600">
                              <div>
                                <span className="font-medium">Date:</span> {order.date}
                              </div>
                              <div>
                                <span className="font-medium">Customer:</span> {order.customer}
                              </div>
                              <div>
                                <span className="font-medium">Amount:</span> {order.amount}
                              </div>
                              <div>
                                <span className="font-medium">Credits:</span>{" "}
                                <span className="text-green-600">{order.credits}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="credits" className="mt-0 space-y-3">
                  <Card>
                    <CardHeader className="pb-2 pt-3 px-4">
                      <CardTitle className="text-sm font-semibold">Credit History</CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-3 pt-0">
                      <div className="space-y-2">
                        {mockCreditHistory.map((credit) => (
                          <div key={credit.id} className="border rounded p-3 hover:bg-gray-50">
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-medium text-gray-800 text-sm">{credit.description}</p>
                                <p className="text-xs text-gray-600">{credit.date}</p>
                              </div>
                              <div
                                className={`font-bold text-sm ${credit.type === "earned" ? "text-green-600" : "text-red-600"}`}
                              >
                                {credit.amount}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="activity" className="mt-0 space-y-3">
                  <Card>
                    <CardHeader className="pb-2 pt-3 px-4">
                      <CardTitle className="text-sm font-semibold">Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-3 pt-0">
                      <div className="space-y-2">
                        {mockActivity.map((activity) => (
                          <div key={activity.id} className="border rounded p-3 hover:bg-gray-50">
                            <div className="flex items-start gap-2">
                              <div className="w-2 h-2 bg-blue-600 rounded-full mt-1.5 flex-shrink-0"></div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-800 text-sm">{activity.action}</p>
                                <p className="text-xs text-gray-600 mb-1">{activity.details}</p>
                                <p className="text-xs text-gray-500">
                                  {activity.date} at {activity.time}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </div>
            </ScrollArea>
          </Tabs>
        </div>

        <div className="flex justify-between gap-2 px-4 py-3 border-t flex-shrink-0">
          <Button variant="outline" onClick={onClose} className="text-sm bg-transparent">
            Close
          </Button>
          <Button className="bg-[#10294B] hover:bg-[#0f1f35] text-sm">Edit Profile</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
