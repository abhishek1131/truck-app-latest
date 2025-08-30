"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Building2, Mail, Phone, MapPin, Calendar, Users, Star, User, ShoppingCart } from "lucide-react"

interface SupplyHouseDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  supplyHouse: {
    id: string
    name: string
    address: string
    phone: string
    email: string
    status: string
    joinDate: string
    totalOrders: number
    activeTechnicians: number
    lastOrder: string
    rating: number
    specialties: string[]
    manager: string
  }
}

const mockOrderHistory = [
  {
    id: "ORD-001",
    date: "2024-01-15",
    technician: "Mike Rodriguez",
    items: "HVAC Filter Set",
    amount: "$125.00",
    status: "completed",
  },
  {
    id: "ORD-002",
    date: "2024-01-12",
    technician: "Sarah Chen",
    items: "Electrical Components",
    amount: "$89.50",
    status: "shipped",
  },
  {
    id: "ORD-003",
    date: "2024-01-10",
    technician: "David Thompson",
    items: "Plumbing Fittings",
    amount: "$67.25",
    status: "completed",
  },
]

const mockTechnicians = [
  { name: "Mike Rodriguez", orders: 15, lastOrder: "2024-01-15", status: "active" },
  { name: "Sarah Chen", orders: 12, lastOrder: "2024-01-14", status: "active" },
  { name: "David Thompson", orders: 8, lastOrder: "2024-01-13", status: "active" },
  { name: "Lisa Wang", orders: 6, lastOrder: "2024-01-12", status: "active" },
]

export function SupplyHouseDetailsModal({ isOpen, onClose, supplyHouse }: SupplyHouseDetailsModalProps) {
  const statusConfig = {
    active: { color: "bg-green-100 text-green-800", label: "Active" },
    inactive: { color: "bg-red-100 text-red-800", label: "Inactive" },
    pending: { color: "bg-yellow-100 text-yellow-800", label: "Pending" },
    suspended: { color: "bg-gray-100 text-gray-800", label: "Suspended" },
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="flex flex-col overflow-hidden"
        style={{
          width: "1200px",
          maxWidth: "95vw",
          minWidth: "1000px",
          height: "90vh",
        }}
      >
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-2xl text-[#10294B]">Supply House Details</DialogTitle>
          <DialogDescription>Complete information and activity history</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="overview" className="w-full h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-4 flex-shrink-0">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="orders">Orders</TabsTrigger>
              <TabsTrigger value="technicians">Technicians</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-hidden mt-4">
              <ScrollArea className="h-full">
                <div className="pr-4">
                  <TabsContent value="overview" className="space-y-6 mt-0">
                    {/* Company Information */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Building2 className="h-5 w-5" />
                          Company Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center space-x-4">
                          <div className="w-16 h-16 bg-[#10294B] rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                            {supplyHouse.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-xl font-semibold text-[#10294B] truncate">{supplyHouse.name}</h3>
                            <p className="text-gray-600 truncate">Manager: {supplyHouse.manager}</p>
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              <Badge className={statusConfig[supplyHouse.status as keyof typeof statusConfig]?.color}>
                                {statusConfig[supplyHouse.status as keyof typeof statusConfig]?.label}
                              </Badge>
                              <Badge variant="outline">ID: {supplyHouse.id}</Badge>
                              <Badge className="bg-blue-100 text-blue-800">
                                <Star className="h-3 w-3 mr-1" />
                                {supplyHouse.rating}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                          <div className="flex items-center gap-3 min-w-0">
                            <MapPin className="h-4 w-4 text-gray-500 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-gray-500">Address</p>
                              <p className="font-medium truncate">{supplyHouse.address}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 min-w-0">
                            <Phone className="h-4 w-4 text-gray-500 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-gray-500">Phone</p>
                              <p className="font-medium">{supplyHouse.phone}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 min-w-0">
                            <Mail className="h-4 w-4 text-gray-500 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-gray-500">Email</p>
                              <p className="font-medium truncate">{supplyHouse.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 min-w-0">
                            <Calendar className="h-4 w-4 text-gray-500 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-gray-500">Join Date</p>
                              <p className="font-medium">{supplyHouse.joinDate}</p>
                            </div>
                          </div>
                        </div>

                        <div className="pt-4 border-t">
                          <p className="text-sm text-gray-500 mb-2">Specialties</p>
                          <div className="flex flex-wrap gap-2">
                            {supplyHouse.specialties.map((specialty) => (
                              <Badge key={specialty} variant="outline" className="text-xs">
                                {specialty}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Statistics */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <Card>
                        <CardContent className="p-4 text-center">
                          <ShoppingCart className="h-8 w-8 text-[#10294B] mx-auto mb-2" />
                          <div className="text-2xl font-bold text-[#10294B]">{supplyHouse.totalOrders}</div>
                          <p className="text-sm text-gray-600">Total Orders</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                          <div className="text-2xl font-bold text-blue-600">{supplyHouse.activeTechnicians}</div>
                          <p className="text-sm text-gray-600">Active Technicians</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <Star className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                          <div className="text-2xl font-bold text-yellow-600">{supplyHouse.rating}</div>
                          <p className="text-sm text-gray-600">Rating</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <Calendar className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                          <div className="text-lg font-bold text-purple-600 break-words">{supplyHouse.lastOrder}</div>
                          <p className="text-sm text-gray-600">Last Order</p>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="orders" className="space-y-4 mt-0">
                    <Card>
                      <CardHeader>
                        <CardTitle>Recent Orders</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {mockOrderHistory.map((order) => (
                            <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <span className="font-semibold">{order.id}</span>
                                  <Badge
                                    className={
                                      order.status === "completed"
                                        ? "bg-green-100 text-green-800"
                                        : "bg-blue-100 text-blue-800"
                                    }
                                  >
                                    {order.status}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-600 truncate">{order.items}</p>
                                <div className="flex items-center gap-4 text-xs text-gray-500 mt-1 flex-wrap">
                                  <span>{order.date}</span>
                                  <span className="flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    <span className="truncate">{order.technician}</span>
                                  </span>
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0 ml-4">
                                <div className="font-semibold">{order.amount}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="technicians" className="space-y-4 mt-0">
                    <Card>
                      <CardHeader>
                        <CardTitle>Connected Technicians</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {mockTechnicians.map((tech, index) => (
                            <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-[#10294B] rounded-full flex items-center justify-center text-white font-bold text-sm">
                                  {tech.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="font-medium truncate">{tech.name}</p>
                                  <p className="text-sm text-gray-500">Last order: {tech.lastOrder}</p>
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0 ml-4">
                                <div className="font-semibold">{tech.orders} orders</div>
                                <Badge className="bg-green-100 text-green-800 text-xs">{tech.status}</Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="performance" className="space-y-4 mt-0">
                    <Card>
                      <CardHeader>
                        <CardTitle>Performance Metrics</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                              <span className="text-sm font-medium">Order Completion Rate</span>
                              <span className="text-lg font-bold text-green-600">98.5%</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                              <span className="text-sm font-medium">Average Response Time</span>
                              <span className="text-lg font-bold text-blue-600">2.3 hrs</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                              <span className="text-sm font-medium">Customer Satisfaction</span>
                              <span className="text-lg font-bold text-purple-600">{supplyHouse.rating}/5.0</span>
                            </div>
                          </div>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                              <span className="text-sm font-medium">Monthly Growth</span>
                              <span className="text-lg font-bold text-yellow-600">+12.5%</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                              <span className="text-sm font-medium">Return Rate</span>
                              <span className="text-lg font-bold text-red-600">1.2%</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </div>
              </ScrollArea>
            </div>
          </Tabs>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t flex-shrink-0">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button className="bg-[#E3253D] hover:bg-[#E3253D]/90">Edit Information</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
