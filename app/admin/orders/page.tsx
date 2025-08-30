"use client"

import { useAuth } from "@/components/auth-provider"
import { Navigation } from "@/components/layout/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { OrderDetailsAdminModal } from "@/components/order-details-admin-modal"
import { ContactTechnicianModal } from "@/components/contact-technician-modal"
import {
  ShoppingCart,
  Search,
  Filter,
  Calendar,
  DollarSign,
  Package,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  Download,
  MoreHorizontal,
  User,
  Truck,
} from "lucide-react"
import { useState } from "react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const mockOrderGroups = [
  {
    id: "ORD-001",
    technician: "Mike Rodriguez",
    truckId: "TRUCK-001",
    status: "completed",
    date: "2024-01-15",
    totalCost: 310.0,
    totalCommission: 9.3,
    totalCredit: 2.33,
    urgency: "normal",
    items: [
      {
        partName: "HVAC Filter Set - Premium Grade",
        quantity: 5,
        cost: 125.0,
        description: "High-efficiency filters for commercial HVAC system",
      },
      {
        partName: "Thermostat Control Unit",
        quantity: 2,
        cost: 185.0,
        description: "Smart thermostat for HVAC system",
      },
    ],
  },
  {
    id: "ORD-002",
    technician: "Sarah Chen",
    truckId: "TRUCK-004",
    status: "pending",
    date: "2024-01-14",
    totalCost: 89.5,
    totalCommission: 2.69,
    totalCredit: 0.67,
    urgency: "high",
    items: [
      {
        partName: "Copper Pipe Fittings - 3/4 inch",
        quantity: 12,
        cost: 89.5,
        description: "Residential plumbing repair project",
      },
    ],
  },
  {
    id: "ORD-003",
    technician: "David Thompson",
    truckId: "TRUCK-003",
    status: "shipped",
    date: "2024-01-13",
    totalCost: 496.0,
    totalCommission: 14.88,
    totalCredit: 3.72,
    urgency: "urgent",
    items: [
      {
        partName: "Electrical Conduit - PVC 2 inch",
        quantity: 8,
        cost: 156.0,
        description: "Emergency electrical installation",
      },
      {
        partName: "Circuit Breaker Panel",
        quantity: 1,
        cost: 340.0,
        description: "Main electrical panel replacement",
      },
    ],
  },
  {
    id: "ORD-004",
    technician: "Lisa Wang",
    truckId: "TRUCK-005",
    status: "completed",
    date: "2024-01-12",
    totalCost: 620.0,
    totalCommission: 18.6,
    totalCredit: 4.65,
    urgency: "normal",
    items: [
      {
        partName: "Industrial Valve Assembly",
        quantity: 2,
        cost: 340.0,
        description: "Manufacturing equipment maintenance",
      },
      {
        partName: "Pressure Gauge Set",
        quantity: 4,
        cost: 280.0,
        description: "Industrial monitoring equipment",
      },
    ],
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

export default function AdminOrdersPage() {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [urgencyFilter, setUrgencyFilter] = useState("all")
  const [technicianFilter, setTechnicianFilter] = useState("all")
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showContactTechnicianModal, setShowContactTechnicianModal] = useState(false)

  const filteredOrders = mockOrderGroups.filter((order) => {
    const matchesSearch =
      order.technician.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.truckId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.items.some((item) => item.partName.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = statusFilter === "all" || order.status === statusFilter
    const matchesUrgency = urgencyFilter === "all" || order.urgency === urgencyFilter
    const matchesTechnician = technicianFilter === "all" || order.technician === technicianFilter
    return matchesSearch && matchesStatus && matchesUrgency && matchesTechnician
  })

  const totalOrders = mockOrderGroups.length
  const totalValue = mockOrderGroups.reduce((sum, order) => sum + order.totalCost, 0)
  const totalCommissions = mockOrderGroups.reduce((sum, order) => sum + order.totalCommission, 0)
  const totalCredits = mockOrderGroups.reduce((sum, order) => sum + order.totalCredit, 0)

  const uniqueTechnicians = [...new Set(mockOrderGroups.map((order) => order.technician))]

  const handleViewDetails = (order: any) => {
    // Convert to format expected by modal
    const modalOrder = {
      ...order,
      partName: `${order.items.length} items`,
      quantity: order.items.reduce((sum: number, item: any) => sum + item.quantity, 0),
      cost: order.totalCost,
      commission: order.totalCommission,
      credit: order.totalCredit,
      description: order.items.map((item: any) => item.partName).join(", "),
    }
    setSelectedOrder(modalOrder)
    setShowDetailsModal(true)
  }

  const handleContactTechnician = (order: any) => {
    setSelectedOrder(order)
    setShowContactTechnicianModal(true)
  }

  return (
    <Navigation title="Order Management" subtitle="Monitor and manage all orders across technicians and trucks">
      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-[#10294B] to-[#006AA1] text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 opacity-90" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalOrders}</div>
              <p className="text-xs opacity-75">Grouped by technician</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Total Value</CardTitle>
              <DollarSign className="h-4 w-4 opacity-90" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalValue.toLocaleString()}</div>
              <p className="text-xs opacity-75">Order value</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-[#E3253D] to-red-600 text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Commissions</CardTitle>
              <DollarSign className="h-4 w-4 opacity-90" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalCommissions.toFixed(2)}</div>
              <p className="text-xs opacity-75">Total commissions</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Credits Issued</CardTitle>
              <CheckCircle className="h-4 w-4 opacity-90" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalCredits.toFixed(2)}</div>
              <p className="text-xs opacity-75">To technicians</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="border-0 shadow-lg">
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
                    placeholder="Search orders by technician, truck ID, or part name..."
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
              <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by urgency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Urgency</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
              <Select value={technicianFilter} onValueChange={setTechnicianFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by technician" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Technicians</SelectItem>
                  {uniqueTechnicians.map((technician) => (
                    <SelectItem key={technician} value={technician}>
                      {technician}
                    </SelectItem>
                  ))}
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
                          <h3 className="text-lg font-semibold text-[#10294B] mb-1">
                            Order #{order.id} - {order.items.length} Items
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">
                            {order.items.map((item) => item.partName).join(", ")}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {order.date}
                            </span>
                            <span className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              {order.technician}
                            </span>
                            <span className="flex items-center gap-1">
                              <Truck className="h-4 w-4" />
                              {order.truckId}
                            </span>
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

                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-3 border-t border-gray-100">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Total Items</div>
                          <div className="font-semibold">
                            {order.items.reduce((sum, item) => sum + item.quantity, 0)} units
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Total Cost</div>
                          <div className="font-semibold">${order.totalCost.toFixed(2)}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Commission</div>
                          <div className="font-semibold text-blue-600">${order.totalCommission.toFixed(2)}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Credit Issued</div>
                          <div className="font-semibold text-green-600">${order.totalCredit.toFixed(2)}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Platform Fee</div>
                          <div className="font-semibold text-purple-600">
                            ${(order.totalCommission - order.totalCredit).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 lg:ml-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewDetails(order)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleContactTechnician(order)}>
                            <User className="mr-2 h-4 w-4" />
                            Contact Technician
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Download className="mr-2 h-4 w-4" />
                            Download Invoice
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modals */}
      {selectedOrder && (
        <>
          <OrderDetailsAdminModal
            isOpen={showDetailsModal}
            onClose={() => {
              setShowDetailsModal(false)
              setSelectedOrder(null)
            }}
            order={selectedOrder}
          />

          <ContactTechnicianModal
            isOpen={showContactTechnicianModal}
            onClose={() => {
              setShowContactTechnicianModal(false)
              setSelectedOrder(null)
            }}
            technician={{
              name: selectedOrder.technician,
              email: "technician@email.com",
              phone: "(555) 123-4567",
            }}
            orderId={selectedOrder.id}
          />
        </>
      )}
    </Navigation>
  )
}
