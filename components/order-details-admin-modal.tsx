"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Package,
  User,
  DollarSign,
  MapPin,
  Phone,
  Mail,
  Clock,
  CheckCircle,
  AlertCircle,
  Truck,
  Calendar,
  FileText,
  Hash,
  Box,
} from "lucide-react"

interface OrderItem {
  id: string
  partName: string
  partNumber: string
  binCode: string
  quantity: number
  unitCost: number
  totalCost: number
  category: string
  description: string
}

interface OrderDetailsAdminModalProps {
  isOpen: boolean
  onClose: () => void
  order: {
    id: string
    partName: string
    quantity: number
    cost: number
    status: string
    date: string
    commission: number
    credit: number
    technician: string
    urgency: string
    description: string
    items?: OrderItem[]
    truckId?: string
    truckName?: string
  }
}

const statusConfig = {
  pending: { color: "bg-yellow-100 text-yellow-800", icon: Clock },
  processing: { color: "bg-blue-100 text-blue-800", icon: Package },
  shipped: { color: "bg-purple-100 text-purple-800", icon: Truck },
  completed: { color: "bg-green-100 text-green-800", icon: CheckCircle },
  cancelled: { color: "bg-red-100 text-red-800", icon: AlertCircle },
}

const urgencyConfig = {
  low: { color: "bg-gray-100 text-gray-800" },
  normal: { color: "bg-blue-100 text-blue-800" },
  high: { color: "bg-orange-100 text-orange-800" },
  urgent: { color: "bg-red-100 text-red-800" },
}

const mockTechnicianDetails = {
  name: "Mike Rodriguez",
  email: "mike.rodriguez@email.com",
  phone: "(555) 123-4567",
  location: "Dallas, TX",
  specialization: "HVAC",
}

export function OrderDetailsAdminModal({ isOpen, onClose, order }: OrderDetailsAdminModalProps) {
  const StatusIcon = statusConfig[order.status as keyof typeof statusConfig]?.icon || Clock

  const formatCurrency = (value: number | undefined): string => {
    return value ? `$${value.toFixed(2)}` : "$0.00"
  }

  const parseBinCode = (binCode: string | undefined): { aisle: string; bay: string; shelf: string } => {
    if (!binCode || typeof binCode !== "string") {
      return { aisle: "N/A", bay: "N/A", shelf: "N/A" }
    }
    const parts = binCode.split("-")
    return {
      aisle: parts[0] || "N/A",
      bay: parts[1] || "N/A",
      shelf: parts[2] || "N/A",
    }
  }

  const orderItems: OrderItem[] = order.items || [
    {
      id: "1",
      partName: "HVAC Filter - MERV 13",
      partNumber: "HF-M13-20x25",
      binCode: "A1-B3-C5",
      quantity: 2,
      unitCost: 24.99,
      totalCost: 49.98,
      category: "Filters",
      description: "High-efficiency air filter for residential HVAC systems",
    },
    {
      id: "2",
      partName: "Copper Pipe Fitting",
      partNumber: "CP-90-3/4",
      binCode: "B2-A1-D2",
      quantity: 4,
      unitCost: 8.75,
      totalCost: 35.0,
      category: "Plumbing",
      description: "90-degree copper elbow fitting, 3/4 inch",
    },
    {
      id: "3",
      partName: "Wire Nuts - Yellow",
      partNumber: "WN-Y-12AWG",
      binCode: "C3-B2-A4",
      quantity: 10,
      unitCost: 0.45,
      totalCost: 4.5,
      category: "Electrical",
      description: "Yellow wire nuts for 12 AWG wire connections",
    },
    {
      id: "4",
      partName: "PVC Pipe - 2 inch",
      partNumber: "PVC-2-10FT",
      binCode: "D1-C3-B1",
      quantity: 1,
      unitCost: 12.99,
      totalCost: 12.99,
      category: "Plumbing",
      description: "2-inch PVC pipe, 10-foot length",
    },
  ]

  const totalOrderValue = orderItems.reduce((sum, item) => sum + item.totalCost, 0)
  const totalItems = orderItems.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="flex flex-col overflow-hidden"
        style={{
          width: "1200px",
          maxWidth: "95vw",
          minWidth: "900px",
          height: "90vh",
        }}
      >
        <DialogHeader className="flex-shrink-0 px-4 py-3">
          <DialogTitle className="text-xl text-[#10294B]">Complete Order Details</DialogTitle>
          <DialogDescription className="text-sm">
            Full order breakdown with all items and bin locations - Order #{order.id}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="overview" className="w-full h-full flex flex-col">
            <div className="flex-shrink-0 mx-4">
              <TabsList className="grid w-full grid-cols-3 h-9 max-w-full">
                <TabsTrigger value="overview" className="text-xs px-2">
                  Complete Order
                </TabsTrigger>
                <TabsTrigger value="technician" className="text-xs px-2">
                  Technician & Truck
                </TabsTrigger>
                <TabsTrigger value="financial" className="text-xs px-2">
                  Financial
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-hidden mt-2">
              <ScrollArea className="h-full overflow-auto">
                <div className="px-4 py-3 space-y-3">
                  <TabsContent value="overview" className="space-y-3 mt-0">
                    {/* Order Summary Header */}
                    <Card>
                      <CardHeader className="px-4 pb-1 pt-3">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg mb-1">Order #{order.id}</CardTitle>
                            <p className="text-gray-600 mb-2 text-sm">{order.description}</p>
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {order.date}
                              </span>
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {order.technician}
                              </span>
                              <span className="flex items-center gap-1">
                                <Truck className="h-3 w-3" />
                                {order.truckName || "Truck #001"}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <Badge
                              className={`text-xs ${statusConfig[order.status as keyof typeof statusConfig]?.color}`}
                            >
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </Badge>
                            <Badge
                              className={`text-xs ${urgencyConfig[order.urgency as keyof typeof urgencyConfig]?.color}`}
                            >
                              {order.urgency.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="px-4 pb-2 pt-1">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="text-center">
                            <Package className="h-6 w-6 text-[#10294B] mx-auto mb-1" />
                            <div className="text-lg font-bold text-[#10294B]">{totalItems}</div>
                            <p className="text-xs text-gray-600">Total Items</p>
                          </div>
                          <div className="text-center">
                            <Box className="h-6 w-6 text-purple-600 mx-auto mb-1" />
                            <div className="text-lg font-bold text-purple-600">{orderItems.length}</div>
                            <p className="text-xs text-gray-600">Item Types</p>
                          </div>
                          <div className="text-center">
                            <DollarSign className="h-6 w-6 text-green-600 mx-auto mb-1" />
                            <div className="text-lg font-bold text-green-600">{formatCurrency(totalOrderValue)}</div>
                            <p className="text-xs text-gray-600">Order Total</p>
                          </div>
                          <div className="text-center">
                            <Hash className="h-6 w-6 text-blue-600 mx-auto mb-1" />
                            <div className="text-lg font-bold text-blue-600">
                              {new Set(orderItems.map((item) => parseBinCode(item.binCode).aisle)).size}
                            </div>
                            <p className="text-xs text-gray-600">Bin Locations</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="px-4 pb-1 pt-3">
                        <CardTitle className="flex items-center gap-2 text-sm">
                          <Package className="h-4 w-4" />
                          Complete Items List ({orderItems.length} items)
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="px-4 pb-2 pt-1">
                        <div className="space-y-3">
                          {orderItems.map((item, index) => (
                            <div key={item.id} className="border rounded-lg p-3 bg-gray-50">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-semibold text-sm">{item.partName}</h4>
                                    <Badge variant="outline" className="text-xs">
                                      {item.category}
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-gray-600 mb-2">{item.description}</p>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                                    <div>
                                      <span className="text-gray-500">Part #:</span>
                                      <span className="font-mono ml-1">{item.partNumber}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Hash className="h-3 w-3 text-blue-600" />
                                      <span className="text-gray-500">Bin:</span>
                                      <span className="font-mono font-semibold text-blue-600">{item.binCode}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-500">Qty:</span>
                                      <span className="font-semibold ml-1">{item.quantity}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-500">Unit:</span>
                                      <span className="font-semibold ml-1">{formatCurrency(item.unitCost)}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-lg font-bold text-green-600">
                                    {formatCurrency(item.totalCost)}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {item.quantity} × {formatCurrency(item.unitCost)}
                                  </div>
                                </div>
                              </div>

                              {/* Bin Location Visual */}
                              <div className="flex items-center gap-2 mt-2 p-2 bg-blue-50 rounded border-l-4 border-blue-500">
                                <MapPin className="h-4 w-4 text-blue-600" />
                                <div className="flex-1">
                                  <div className="text-xs font-semibold text-blue-800">
                                    Bin Location: {item.binCode || "Not assigned"}
                                  </div>
                                  <div className="text-xs text-blue-600">
                                    {(() => {
                                      const { aisle, bay, shelf } = parseBinCode(item.binCode)
                                      return `Aisle ${aisle} → Bay ${bay} → Shelf ${shelf}`
                                    })()}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Order Total Summary */}
                        <Separator className="my-3" />
                        <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                          <div>
                            <div className="font-semibold text-sm">Order Total</div>
                            <div className="text-xs text-gray-600">
                              {totalItems} items across {orderItems.length} part types
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold text-green-600">{formatCurrency(totalOrderValue)}</div>
                            <div className="text-xs text-gray-500">Including all items</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Quick Actions */}
                    <Card>
                      <CardHeader className="px-4 pb-1 pt-3">
                        <CardTitle className="text-sm">Quick Actions</CardTitle>
                      </CardHeader>
                      <CardContent className="px-4 pb-2 pt-1">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          <Button variant="outline" className="h-16 flex flex-col gap-1 bg-transparent text-xs">
                            <User className="h-4 w-4" />
                            <span>Contact Technician</span>
                          </Button>
                          <Button variant="outline" className="h-16 flex flex-col gap-1 bg-transparent text-xs">
                            <FileText className="h-4 w-4" />
                            <span>Download Invoice</span>
                          </Button>
                          <Button variant="outline" className="h-16 flex flex-col gap-1 bg-transparent text-xs">
                            <Package className="h-4 w-4" />
                            <span>Update Status</span>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Order Timeline */}
                    <Card>
                      <CardHeader className="px-4 pb-1 pt-3">
                        <CardTitle className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4" />
                          Order Timeline
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="px-4 pb-2 pt-1">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3 p-2 bg-green-50 rounded-lg border-l-4 border-green-500">
                            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm">Order Placed</p>
                              <p className="text-xs text-gray-600">{order.date} at 10:30 AM</p>
                              <p className="text-xs text-gray-500">Order submitted by {order.technician}</p>
                            </div>
                          </div>

                          {order.status !== "pending" && (
                            <div className="flex items-center gap-3 p-2 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                              <Package className="h-5 w-5 text-blue-600 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm">Order Confirmed</p>
                                <p className="text-xs text-gray-600">{order.date} at 11:15 AM</p>
                                <p className="text-xs text-gray-500">Order processing started</p>
                              </div>
                            </div>
                          )}

                          {(order.status === "shipped" || order.status === "completed") && (
                            <div className="flex items-center gap-3 p-2 bg-purple-50 rounded-lg border-l-4 border-purple-500">
                              <Truck className="h-5 w-5 text-purple-600 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm">Order Shipped</p>
                                <p className="text-xs text-gray-600">{order.date} at 2:45 PM</p>
                                <p className="text-xs text-gray-500">Tracking: TRK123456789</p>
                              </div>
                            </div>
                          )}

                          {order.status === "completed" && (
                            <div className="flex items-center gap-3 p-2 bg-green-50 rounded-lg border-l-4 border-green-500">
                              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm">Order Delivered</p>
                                <p className="text-xs text-gray-600">{order.date} at 4:20 PM</p>
                                <p className="text-xs text-gray-500">Delivered and confirmed by technician</p>
                              </div>
                            </div>
                          )}

                          {order.status === "cancelled" && (
                            <div className="flex items-center gap-3 p-2 bg-red-50 rounded-lg border-l-4 border-red-500">
                              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm">Order Cancelled</p>
                                <p className="text-xs text-gray-600">{order.date} at 3:00 PM</p>
                                <p className="text-xs text-gray-500">Cancelled due to unavailability</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="technician" className="space-y-3 mt-0">
                    {/* Technician Information */}
                    <Card>
                      <CardHeader className="px-4 pb-1 pt-3">
                        <CardTitle className="flex items-center gap-2 text-sm">
                          <User className="h-4 w-4" />
                          Technician Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="px-4 pb-2 pt-1">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-[#10294B] rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {mockTechnicianDetails.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-base">{mockTechnicianDetails.name}</h3>
                            <p className="text-gray-600 text-sm">{mockTechnicianDetails.specialization} Specialist</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                <Mail className="h-3 w-3" />
                                <span className="truncate">{mockTechnicianDetails.email}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                <Phone className="h-3 w-3" />
                                {mockTechnicianDetails.phone}
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                <MapPin className="h-3 w-3" />
                                {mockTechnicianDetails.location}
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                <Truck className="h-3 w-3" />
                                {order.truckName || "Truck #001"}
                              </div>
                            </div>
                          </div>
                          <Button className="bg-[#10294B] hover:bg-[#10294B]/90 text-xs h-8">Contact Technician</Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Truck Information */}
                    <Card>
                      <CardHeader className="px-4 pb-1 pt-3">
                        <CardTitle className="flex items-center gap-2 text-sm">
                          <Truck className="h-4 w-4" />
                          Assigned Truck Details
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="px-4 pb-2 pt-1">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Truck ID</div>
                            <div className="font-semibold">{order.truckId || "TRK-001"}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Truck Name</div>
                            <div className="font-semibold">{order.truckName || "Ford Transit 350"}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Current Location</div>
                            <div className="font-semibold">Downtown Route</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Status</div>
                            <Badge className="bg-green-100 text-green-800 text-xs">Active</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="financial" className="space-y-3 mt-0">
                    <Card>
                      <CardHeader className="px-4 pb-1 pt-3">
                        <CardTitle className="flex items-center gap-2 text-sm">
                          <DollarSign className="h-4 w-4" />
                          Financial Breakdown
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="px-4 pb-2 pt-1">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-base">
                            <span>Order Total</span>
                            <span className="font-semibold">{formatCurrency(totalOrderValue)}</span>
                          </div>
                          <Separator />
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center text-blue-600 text-sm">
                              <span>Platform Commission (3%)</span>
                              <span className="font-semibold">{formatCurrency(order.commission)}</span>
                            </div>
                            <div className="flex justify-between items-center text-green-600 text-sm">
                              <span>Credit to Technician</span>
                              <span className="font-semibold">{formatCurrency(order.credit)}</span>
                            </div>
                            <div className="flex justify-between items-center text-purple-600 text-sm">
                              <span>Platform Revenue</span>
                              <span className="font-semibold">
                                {formatCurrency((order.commission || 0) - (order.credit || 0))}
                              </span>
                            </div>
                          </div>
                          <Separator />
                          <div className="flex justify-between items-center font-semibold text-base">
                            <span>Net Platform Revenue</span>
                            <span className="text-green-600">
                              {formatCurrency((order.commission || 0) - (order.credit || 0))}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="px-4 pb-1 pt-3">
                        <CardTitle className="text-sm">Payment Information</CardTitle>
                      </CardHeader>
                      <CardContent className="px-4 pb-2 pt-1">
                        <div>
                          <h4 className="font-semibold mb-1.5 text-sm">Technician Payment</h4>
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between">
                              <span>Credit Earned:</span>
                              <span className="font-semibold">{formatCurrency(order.credit)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Status:</span>
                              <Badge className="bg-green-100 text-green-800 text-xs">Credited</Badge>
                            </div>
                            <div className="flex justify-between">
                              <span>Date:</span>
                              <span>{order.date}</span>
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

        <div className="flex justify-between pt-2 border-t flex-shrink-0 px-4 py-3">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="text-xs h-8 bg-transparent">
              <FileText className="h-3 w-3 mr-1" />
              Download Invoice
            </Button>
            <Button variant="outline" size="sm" className="text-xs h-8 bg-transparent">
              <Package className="h-3 w-3 mr-1" />
              Print Details
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="text-xs h-8 bg-transparent">
              Close
            </Button>
            <Button className="bg-[#E3253D] hover:bg-[#E3253D]/90 text-xs h-8">Update Status</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
