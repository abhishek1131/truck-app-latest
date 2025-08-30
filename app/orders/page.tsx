"use client"

import { useAuth } from "@/components/auth-provider"
import { Header } from "@/components/layout/header"
import { Navigation } from "@/components/layout/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  ShoppingCart,
  Plus,
  Search,
  Filter,
  Calendar,
  DollarSign,
  Package,
  Clock,
  CheckCircle,
  AlertCircle,
  Download,
} from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { OrderDetailsModal } from "@/components/order-details-modal"

const mockOrders = [
  {
    id: "ORD-001",
    partName: "HVAC Filter Set - Premium Grade",
    quantity: 5,
    cost: 125.0,
    status: "completed",
    date: "2024-01-15",
    commission: 3.75,
    credit: 0.94,
    supplyHouse: "ABC Supply Co.",
    urgency: "normal",
    description: "High-efficiency filters for commercial HVAC system",
  },
  {
    id: "ORD-002",
    partName: "Copper Pipe Fittings - 3/4 inch",
    quantity: 12,
    cost: 89.5,
    status: "pending",
    date: "2024-01-14",
    commission: 2.69,
    credit: 0.67,
    supplyHouse: "Pro Parts Plus",
    urgency: "high",
    description: "Residential plumbing repair project",
  },
  {
    id: "ORD-003",
    partName: "Electrical Conduit - PVC 2 inch",
    quantity: 8,
    cost: 156.0,
    status: "shipped",
    date: "2024-01-13",
    commission: 4.68,
    credit: 1.17,
    supplyHouse: "Tech Supply Hub",
    urgency: "urgent",
    description: "Emergency electrical installation",
  },
  {
    id: "ORD-004",
    partName: "Industrial Valve Assembly",
    quantity: 2,
    cost: 340.0,
    status: "completed",
    date: "2024-01-12",
    commission: 10.2,
    credit: 2.55,
    supplyHouse: "Quick Parts Express",
    urgency: "normal",
    description: "Manufacturing equipment maintenance",
  },
  {
    id: "ORD-005",
    partName: "LED Light Fixtures - Commercial",
    quantity: 15,
    cost: 280.0,
    status: "processing",
    date: "2024-01-11",
    commission: 8.4,
    credit: 2.1,
    supplyHouse: "ABC Supply Co.",
    urgency: "low",
    description: "Office building lighting upgrade",
  },
]

const statusConfig = {
  pending: { color: "bg-yellow-100 text-yellow-800", icon: Clock },
  processing: { color: "bg-blue-100 text-blue-800", icon: Package },
  shipped: { color: "bg-purple-100 text-purple-800", icon: Package },
  completed: { color: "bg-green-100 text-green-800", icon: CheckCircle },
  cancelled: { color: "bg-red-100 text-red-800", icon: AlertCircle },
}

const urgencyConfig = {
  low: { color: "bg-gray-100 text-gray-800" },
  normal: { color: "bg-blue-100 text-blue-800" },
  high: { color: "bg-orange-100 text-orange-800" },
  urgent: { color: "bg-red-100 text-red-800" },
}

export default function OrdersPage() {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortBy, setSortBy] = useState("date")

  const filteredOrders = mockOrders.filter((order) => {
    const matchesSearch =
      order.partName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || order.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const totalOrders = mockOrders.length
  const totalValue = mockOrders.reduce((sum, order) => sum + order.cost, 0)
  const totalCredits = mockOrders.reduce((sum, order) => sum + order.credit, 0)
  const completedOrders = mockOrders.filter((order) => order.status === "completed").length

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Header />

      <div className="flex">
        <Navigation />

        <main className="flex-1 p-6">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-[#10294B] mb-2">Order Management</h1>
                <p className="text-gray-600">Track and manage all your parts orders</p>
              </div>
              <Button asChild className="bg-[#E3253D] hover:bg-[#E3253D]/90 text-white shadow-lg">
                <Link href="/orders/new">
                  <Plus className="h-4 w-4 mr-2" />
                  New Order
                </Link>
              </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="bg-gradient-to-br from-[#10294B] to-[#006AA1] text-white border-0">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium opacity-90">Total Orders</CardTitle>
                  <ShoppingCart className="h-4 w-4 opacity-90" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalOrders}</div>
                  <p className="text-xs opacity-75">All time orders</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium opacity-90">Total Value</CardTitle>
                  <DollarSign className="h-4 w-4 opacity-90" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${totalValue.toFixed(2)}</div>
                  <p className="text-xs opacity-75">Order value</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-[#E3253D] to-red-600 text-white border-0">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium opacity-90">Credits Earned</CardTitle>
                  <DollarSign className="h-4 w-4 opacity-90" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${totalCredits.toFixed(2)}</div>
                  <p className="text-xs opacity-75">Available credits</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium opacity-90">Completed</CardTitle>
                  <CheckCircle className="h-4 w-4 opacity-90" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{completedOrders}</div>
                  <p className="text-xs opacity-75">Successful orders</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Filters and Search */}
          <Card className="mb-6 border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters & Search
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search orders by part name or order ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="cost">Cost</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                    <SelectItem value="partName">Part Name</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Orders List */}
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const StatusIcon = statusConfig[order.status as keyof typeof statusConfig]?.icon || Clock

              return (
                <Card
                  key={order.id}
                  className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-[#10294B] mb-1">{order.partName}</h3>
                            <p className="text-sm text-gray-600 mb-2">{order.description}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {order.date}
                              </span>
                              <span>Order #{order.id}</span>
                              <span>Supply House: {order.supplyHouse}</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Badge className={statusConfig[order.status as keyof typeof statusConfig]?.color}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </Badge>
                            <Badge className={urgencyConfig[order.urgency as keyof typeof urgencyConfig]?.color}>
                              {order.urgency}
                            </Badge>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t border-gray-100">
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Quantity</div>
                            <div className="font-semibold">{order.quantity} units</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Total Cost</div>
                            <div className="font-semibold">${order.cost.toFixed(2)}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Commission</div>
                            <div className="font-semibold text-blue-600">${order.commission.toFixed(2)}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Credit Earned</div>
                            <div className="font-semibold text-green-600">+${order.credit.toFixed(2)}</div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 lg:ml-6">
                        <OrderDetailsModal order={order} />
                        <Button variant="outline" size="sm" className="w-full lg:w-auto bg-transparent">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {filteredOrders.length === 0 && (
            <Card className="border-0 shadow-lg">
              <CardContent className="text-center py-12">
                <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No orders found</h3>
                <p className="text-gray-500 mb-6">Try adjusting your search or filter criteria</p>
                <Button asChild className="bg-[#E3253D] hover:bg-[#E3253D]/90">
                  <Link href="/orders/new">Create Your First Order</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  )
}
