"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Package, Truck, Calendar, AlertTriangle, MapPin, Clock, Grid3X3 } from "lucide-react"

interface InventoryItem {
  id: string
  name: string
  category: string
  totalQuantity: number
  lowStockThreshold: number
  lastOrdered: string
  trucks: string[]
  notes: string
  unit?: string
  partNumber?: string
  brand?: string
}

interface InventoryItemDetailsModalProps {
  item: InventoryItem
  children: React.ReactNode
}

export function InventoryItemDetailsModal({ item, children }: InventoryItemDetailsModalProps) {
  const [open, setOpen] = useState(false)

  // Mock detailed data showing truck/bin distribution
  const itemDetails = {
    ...item,
    partNumber: item.partNumber || `PN-${item.id}`,
    brand: item.brand || "TruXtoK Supply",
    unit: item.unit || "pieces",
    unitCost: 24.99,
    supplier: "Industrial Parts Co.",
    lastRestocked: "2024-01-10",
    averageUsage: "5 per week",
    truckBinDistribution: [
      {
        truckId: "TRUCK-001",
        truckName: "Service Van #1",
        location: "Downtown",
        bins: [
          { binId: "bin-1", binName: "Front Left Compartment", quantity: 8 },
          { binId: "bin-3", binName: "Rear Storage Bay", quantity: 7 },
        ],
      },
      {
        truckId: "TRUCK-002",
        truckName: "Service Van #2",
        location: "Uptown",
        bins: [
          { binId: "bin-2", binName: "Front Right Compartment", quantity: 12 },
          { binId: "bin-4", binName: "Side Panel Storage", quantity: 6 },
        ],
      },
      {
        truckId: "TRUCK-003",
        truckName: "Service Van #3",
        location: "Westside",
        bins: [{ binId: "bin-1", binName: "Front Left Compartment", quantity: 10 }],
      },
    ],
    recentActivity: [
      { date: "2024-01-15", action: "Used", quantity: 3, truck: "Service Van #1", bin: "Front Left Compartment" },
      {
        date: "2024-01-14",
        action: "Restocked",
        quantity: 10,
        truck: "Service Van #2",
        bin: "Front Right Compartment",
      },
      { date: "2024-01-13", action: "Used", quantity: 2, truck: "Service Van #3", bin: "Front Left Compartment" },
      { date: "2024-01-12", action: "Used", quantity: 1, truck: "Service Van #1", bin: "Rear Storage Bay" },
    ],
  }

  const isLowStock = item.totalQuantity <= item.lowStockThreshold
  const totalQuantityCalculated = itemDetails.truckBinDistribution.reduce(
    (total, truck) => total + truck.bins.reduce((binTotal, bin) => binTotal + bin.quantity, 0),
    0,
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {item.name}
            {isLowStock && (
              <Badge variant="destructive" className="bg-red-100 text-red-800">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Low Stock
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Item Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Item ID</p>
                  <p className="text-base">{item.id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Part Number</p>
                  <p className="text-base">{itemDetails.partNumber}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Category</p>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700">
                    {item.category}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Brand</p>
                  <p className="text-base">{itemDetails.brand}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Unit Cost</p>
                  <p className="text-base">${itemDetails.unitCost}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Unit</p>
                  <p className="text-base">{itemDetails.unit}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Notes</p>
                <p className="text-base">{item.notes}</p>
              </div>
            </CardContent>
          </Card>

          {/* Stock Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Stock Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{totalQuantityCalculated}</p>
                  <p className="text-sm text-blue-600">Total Across All Trucks</p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <p className="text-2xl font-bold text-orange-600">{item.lowStockThreshold}</p>
                  <p className="text-sm text-orange-600">Low Stock Alert</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{itemDetails.averageUsage}</p>
                  <p className="text-sm text-green-600">Average Usage</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">Last Ordered: {item.lastOrdered}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">Last Restocked: {itemDetails.lastRestocked}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Truck & Bin Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Truck & Bin Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {itemDetails.truckBinDistribution.map((truck) => (
                  <div key={truck.truckId} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#10294B] rounded-lg flex items-center justify-center">
                          <Truck className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium">{truck.truckName}</p>
                          <p className="text-sm text-gray-500 flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {truck.location}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-[#10294B]">
                          {truck.bins.reduce((total, bin) => total + bin.quantity, 0)} {itemDetails.unit}
                        </p>
                        <p className="text-xs text-gray-500">Total in truck</p>
                      </div>
                    </div>

                    {/* Bins in this truck */}
                    <div className="ml-13 space-y-2">
                      {truck.bins.map((bin) => (
                        <div key={bin.binId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center gap-2">
                            <Grid3X3 className="h-4 w-4 text-gray-400" />
                            <span className="text-sm font-medium">{bin.binName}</span>
                          </div>
                          <span className="text-sm font-semibold text-gray-700">
                            {bin.quantity} {itemDetails.unit}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {itemDetails.recentActivity.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border-l-4 border-l-blue-200 bg-blue-50/30"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          activity.action === "Used" ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"
                        }`}
                      >
                        {activity.action === "Used" ? "-" : "+"}
                      </div>
                      <div>
                        <p className="font-medium">
                          {activity.action} {activity.quantity} {itemDetails.unit}
                        </p>
                        <p className="text-sm text-gray-500">
                          {activity.truck} • {activity.bin}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">{activity.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Close
            </Button>
            <Button className="bg-[#E3253D] hover:bg-[#E3253D]/90">Order More</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
