"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ShoppingCart, Search, Filter, Calendar, DollarSign, Package, Truck } from "lucide-react"

interface SupplyHouseOrdersModalProps {
  isOpen: boolean
  onClose: () => void
  supplyHouse: {
    id: string
    name: string
    location: string
    phone: string
    email: string
    status: string
    totalOrders: number
    totalRevenue: number
    rating: number
    joinDate: string
  }
}

const mockOrders = [
  {
    id: "ORD-12345",
    date: "2024-01-15",
    technician: "Mike Rodriguez",
    items: [
      { name: "HVAC Filter Set - Premium Grade", quantity: 2, price: 45.99 },
      { name: "Thermostat - Digital", quantity: 1, price: 89.99 },
    ],
    total: 181.97,
    status: "completed",
    commission: 18.2,
  },
  {
    id: "ORD-12340",
    date: "2024-01-12",
    technician: "Sarah Chen",
    items: [
      { name: "Electrical Wire - 12 AWG", quantity: 5, price: 12.5 },
      { name: "Circuit Breaker - 20A", quantity: 3, price: 25.99 },
    ],
    total: 140.47,
    status: "shipped",
    commission: 14.05,
  },
  {
    id: "ORD-12338",
    date: "2024-01-10",
    technician: "David Thompson",
    items: [
      { name: "PVC Pipes - 4 inch", quantity: 10, price: 8.99 },
      { name: "Pipe Fittings Set", quantity: 15, price: 3.5 },
    ],
    total: 142.4,
    status: "pending",
    commission: 14.24,
  },
]

export function SupplyHouseOrdersModal({ isOpen, onClose, supplyHouse }: SupplyHouseOrdersModalProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const filteredOrders = mockOrders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.technician.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || order.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const totalOrders = mockOrders.length
  const completedOrders = mockOrders.filter((o) => o.status === "completed").length
  const totalRevenue = mockOrders.reduce((sum, order) => sum + order.total, 0)
  const totalCommission = mockOrders.reduce((sum, order) => sum + order.commission, 0)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="flex flex-col p-0 gap-0 overflow-hidden"
        style={{
          width: "1200px",
          maxWidth: "95vw",
          height: "90vh",
          minWidth: "1000px",
        }}
      >
        {/* Fixed Header */}
        <div className="flex-shrink-0 px-4 py-3 border-b bg-gray-50">
          <DialogHeader>
            <DialogTitle className="text-lg text-[#10294B] flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Orders - {supplyHouse.name}
            </DialogTitle>
            <p className="text-sm text-gray-600 mt-1">View all orders and transactions for this supply house</p>
          </DialogHeader>
        </div>

        {/* Scrollable Content */}
        <ScrollArea className="flex-1 overflow-auto">
          <div className="px-4 py-3 space-y-3">
            {/* Statistics Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              <Card>
                <CardContent className="px-3 pb-2 pt-3 text-center">
                  <Package className="h-4 w-4 text-[#10294B] mx-auto mb-1" />
                  <div className="text-lg font-bold text-[#10294B] mb-0.5">{totalOrders}</div>
                  <p className="text-gray-600 font-medium text-xs">Total Orders</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="px-3 pb-2 pt-3 text-center">
                  <Truck className="h-4 w-4 text-green-600 mx-auto mb-1" />
                  <div className="text-lg font-bold text-green-600 mb-0.5">{completedOrders}</div>
                  <p className="text-gray-600 font-medium text-xs">Completed</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="px-3 pb-2 pt-3 text-center">
                  <DollarSign className="h-4 w-4 text-blue-600 mx-auto mb-1" />
                  <div className="text-lg font-bold text-blue-600 mb-0.5">${totalRevenue.toFixed(2)}</div>
                  <p className="text-gray-600 font-medium text-xs">Total Revenue</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="px-3 pb-2 pt-3 text-center">
                  <Calendar className="h-4 w-4 text-purple-600 mx-auto mb-1" />
                  <div className="text-lg font-bold text-purple-600 mb-0.5">${totalCommission.toFixed(2)}</div>
                  <p className="text-gray-600 font-medium text-xs">Commission</p>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card>
              <CardHeader className="px-4 pb-1 pt-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Filter className="h-3 w-3" />
                  Filters & Search
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-2 pt-1">
                <div className="flex flex-col md:flex-row gap-2">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3" />
                      <Input
                        placeholder="Search by order ID, technician, or items..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-7 h-8 text-sm"
                      />
                    </div>
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full md:w-32 h-8">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="shipped">Shipped</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Orders List */}
            <Card>
              <CardHeader className="px-4 pb-1 pt-3">
                <CardTitle className="text-sm">Orders ({filteredOrders.length})</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-2 pt-1">
                <div className="space-y-2">
                  {filteredOrders.map((order) => (
                    <div key={order.id} className="border rounded p-2 hover:bg-gray-50">
                      <div className="flex justify-between items-start mb-1">
                        <div>
                          <h4 className="font-semibold text-[#10294B] text-sm">{order.id}</h4>
                          <p className="text-gray-600 text-xs">Technician: {order.technician}</p>
                          <p className="text-xs text-gray-500">{order.date}</p>
                        </div>
                        <div className="text-right">
                          <Badge
                            className={
                              order.status === "completed"
                                ? "bg-green-100 text-green-800 text-xs mb-1"
                                : order.status === "shipped"
                                  ? "bg-blue-100 text-blue-800 text-xs mb-1"
                                  : order.status === "pending"
                                    ? "bg-yellow-100 text-yellow-800 text-xs mb-1"
                                    : "bg-red-100 text-red-800 text-xs mb-1"
                            }
                          >
                            {order.status}
                          </Badge>
                          <div className="text-sm font-semibold">${order.total.toFixed(2)}</div>
                        </div>
                      </div>

                      <div className="mb-1">
                        <p className="text-xs text-gray-500 mb-1">Items:</p>
                        <div className="space-y-0.5">
                          {order.items.map((item, index) => (
                            <div key={index} className="flex justify-between text-xs">
                              <span className="truncate mr-2">
                                {item.name} (x{item.quantity})
                              </span>
                              <span className="flex-shrink-0">${(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-1 border-t border-gray-100">
                        <div className="flex gap-4 text-xs">
                          <span className="font-medium">
                            Total: <span className="text-[#10294B]">${order.total.toFixed(2)}</span>
                          </span>
                          <span className="font-medium">
                            Commission: <span className="text-green-600">${order.commission.toFixed(2)}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>

        {/* Fixed Footer */}
        <div className="flex-shrink-0 border-t bg-gray-50 px-4 py-2">
          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose} className="text-sm bg-transparent">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
