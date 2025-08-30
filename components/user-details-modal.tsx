"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { User, Truck, ShoppingCart, Calendar, Package, CheckCircle, Clock, MapPin, Mail, Phone } from "lucide-react"

interface UserDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  user: {
    id: string
    name: string
    email: string
    phone: string
    location: string
    role: string
    status: string
    joinDate: string
    lastActive: string
    assignedTrucks: string[]
    totalOrders: number
    avatar: string
  }
}

const mockUserTrucks = [
  { id: "TRUCK-001", name: "Ford Transit 350", status: "active", location: "Downtown Route" },
  { id: "TRUCK-002", name: "Chevrolet Express", status: "maintenance", location: "Service Center" },
]

const mockUserOrders = [
  {
    id: "ORD-001",
    date: "2024-01-15",
    items: 3,
    cost: 245.5,
    status: "completed",
    truckId: "TRUCK-001",
  },
  {
    id: "ORD-002",
    date: "2024-01-12",
    items: 2,
    cost: 189.0,
    status: "shipped",
    truckId: "TRUCK-001",
  },
  {
    id: "ORD-003",
    date: "2024-01-10",
    items: 5,
    cost: 356.75,
    status: "completed",
    truckId: "TRUCK-002",
  },
]

const statusConfig = {
  active: { color: "bg-green-100 text-green-800", label: "Active" },
  inactive: { color: "bg-red-100 text-red-800", label: "Inactive" },
  maintenance: { color: "bg-yellow-100 text-yellow-800", label: "Maintenance" },
  completed: { color: "bg-green-100 text-green-800", icon: CheckCircle },
  shipped: { color: "bg-purple-100 text-purple-800", icon: Package },
  pending: { color: "bg-yellow-100 text-yellow-800", icon: Clock },
}

const tabs = [
  { id: "overview", label: "Overview" },
  { id: "trucks", label: "Assigned Trucks" },
  { id: "orders", label: "Order History" },
]

export function UserDetailsModal({ isOpen, onClose, user }: UserDetailsModalProps) {
  const [activeTab, setActiveTab] = useState("overview")

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[#10294B]">User Details - {user.name}</DialogTitle>
          <DialogDescription>Complete information about this user</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Header */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="w-16 h-16 bg-[#10294B] rounded-full flex items-center justify-center text-white font-bold text-xl">
              {user.avatar}
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-[#10294B]">{user.name}</h3>
              <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                <span className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {user.email}
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {user.phone}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {user.location}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <Badge className={statusConfig[user.status as keyof typeof statusConfig]?.color}>
                {statusConfig[user.status as keyof typeof statusConfig]?.label}
              </Badge>
              <Badge variant="outline">{user.role}</Badge>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="w-full">
            <div className="flex border-b border-gray-200 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? "border-[#E3253D] text-[#E3253D]"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="min-h-[300px]">
            {activeTab === "overview" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      User Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-600">User ID:</span>
                      <p className="font-semibold">{user.id}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Join Date:</span>
                      <p className="font-semibold">{user.joinDate}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Last Active:</span>
                      <p className="font-semibold">{user.lastActive}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Role:</span>
                      <p className="font-semibold capitalize">{user.role}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5" />
                      Activity Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Total Orders:</span>
                      <p className="font-semibold text-2xl text-green-600">{user.totalOrders}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Assigned Trucks:</span>
                      <p className="font-semibold text-2xl text-blue-600">{user.assignedTrucks.length}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Total Value:</span>
                      <p className="font-semibold text-2xl text-purple-600">
                        ${mockUserOrders.reduce((sum, order) => sum + order.cost, 0).toFixed(2)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === "trucks" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-[#10294B]">Assigned Trucks ({mockUserTrucks.length})</h3>
                </div>
                {mockUserTrucks.map((truck) => (
                  <Card key={truck.id} className="border-0 shadow-md">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Truck className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold">{truck.name}</h4>
                            <p className="text-sm text-gray-500 flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {truck.location}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={statusConfig[truck.status as keyof typeof statusConfig]?.color}>
                            {statusConfig[truck.status as keyof typeof statusConfig]?.label}
                          </Badge>
                          <Badge variant="outline">{truck.id}</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {mockUserTrucks.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Truck className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No trucks assigned to this user</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "orders" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-[#10294B]">Order History ({mockUserOrders.length})</h3>
                </div>
                {mockUserOrders.map((order) => {
                  const StatusIcon = statusConfig[order.status as keyof typeof statusConfig]?.icon || Clock
                  return (
                    <Card key={order.id} className="border-0 shadow-md">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                              <Package className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold">Order #{order.id}</h4>
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {order.date}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Truck className="h-3 w-3" />
                                  {order.truckId}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="font-semibold">${order.cost.toFixed(2)}</p>
                              <p className="text-sm text-gray-500">{order.items} items</p>
                            </div>
                            <Badge className={statusConfig[order.status as keyof typeof statusConfig]?.color}>
                              {StatusIcon && <StatusIcon className="h-3 w-3 mr-1" />}
                              {order.status}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
                {mockUserOrders.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No orders found for this user</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
