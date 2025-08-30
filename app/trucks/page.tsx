"use client"

import { useState } from "react"
import { Navigation } from "@/components/layout/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Truck, Search, MapPin, Package, AlertTriangle, Plus } from 'lucide-react'
import Link from "next/link"

export default function TrucksPage() {
  const [searchTerm, setSearchTerm] = useState("")

  const trucks = [
    {
      id: "1",
      name: "Truck #001",
      location: "Downtown Route",
      status: "Active",
      totalItems: 127,
      lowStockItems: 8,
      bins: 12,
      lastUpdated: "2 hours ago",
    },
    {
      id: "2",
      name: "Truck #002",
      location: "Suburban Route",
      status: "Active",
      totalItems: 143,
      lowStockItems: 3,
      bins: 15,
      lastUpdated: "4 hours ago",
    },
    {
      id: "3",
      name: "Truck #003",
      location: "Industrial Route",
      status: "Maintenance",
      totalItems: 117,
      lowStockItems: 12,
      bins: 10,
      lastUpdated: "1 day ago",
    },
  ]

  const filteredTrucks = trucks.filter(
    (truck) =>
      truck.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      truck.location.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const totalTrucks = trucks.length
  const activeTrucks = trucks.filter((t) => t.status === "Active").length
  const totalItems = trucks.reduce((sum, truck) => sum + truck.totalItems, 0)
  const totalLowStock = trucks.reduce((sum, truck) => sum + truck.lowStockItems, 0)

  return (
    <Navigation title="Trucks" subtitle="Manage your truck inventory">
      <div className="p-4 md:p-6 space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Trucks</p>
                  <p className="text-2xl md:text-3xl font-bold text-gray-900">{totalTrucks}</p>
                  <p className="text-xs md:text-sm text-gray-500">{activeTrucks} active</p>
                </div>
                <div className="p-2 md:p-3 rounded-lg bg-blue-500">
                  <Truck className="h-5 w-5 md:h-6 md:w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Items</p>
                  <p className="text-2xl md:text-3xl font-bold text-gray-900">{totalItems}</p>
                  <p className="text-xs md:text-sm text-gray-500">Across all trucks</p>
                </div>
                <div className="p-2 md:p-3 rounded-lg bg-green-500">
                  <Package className="h-5 w-5 md:h-6 md:w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Low Stock</p>
                  <p className="text-2xl md:text-3xl font-bold text-gray-900">{totalLowStock}</p>
                  <p className="text-xs md:text-sm text-gray-500">Items need restock</p>
                </div>
                <div className="p-2 md:p-3 rounded-lg bg-red-500">
                  <AlertTriangle className="h-5 w-5 md:h-6 md:w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Routes</p>
                  <p className="text-2xl md:text-3xl font-bold text-gray-900">{activeTrucks}</p>
                  <p className="text-xs md:text-sm text-gray-500">Currently running</p>
                </div>
                <div className="p-2 md:p-3 rounded-lg bg-purple-500">
                  <MapPin className="h-5 w-5 md:h-6 md:w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search trucks by name or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Trucks List */}
        <div className="grid gap-4 md:gap-6">
          {filteredTrucks.map((truck) => (
            <Card key={truck.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4 md:p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-[#10294B] rounded-lg flex items-center justify-center">
                      <Truck className="h-6 w-6 md:h-8 md:w-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg md:text-xl font-semibold text-gray-900">{truck.name}</h3>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <MapPin className="h-4 w-4" />
                        <span>{truck.location}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">Updated {truck.lastUpdated}</p>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row items-start md:items-center space-y-3 md:space-y-0 md:space-x-6">
                    <div className="flex space-x-4 md:space-x-6">
                      <div className="text-center">
                        <p className="text-lg md:text-xl font-bold text-gray-900">{truck.totalItems}</p>
                        <p className="text-xs text-gray-500">Total Items</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg md:text-xl font-bold text-gray-900">{truck.bins}</p>
                        <p className="text-xs text-gray-500">Bins</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg md:text-xl font-bold text-red-600">{truck.lowStockItems}</p>
                        <p className="text-xs text-gray-500">Low Stock</p>
                      </div>
                    </div>

                    <div className="flex flex-col space-y-2">
                      <Badge
                        variant={truck.status === "Active" ? "default" : "secondary"}
                        className={
                          truck.status === "Active" ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"
                        }
                      >
                        {truck.status}
                      </Badge>
                      <Link href={`/trucks/${truck.id}`}>
                        <Button size="sm" className="w-full bg-[#E3253D] hover:bg-[#E3253D]/90">
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredTrucks.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No trucks found</h3>
              <p className="text-gray-500">Try adjusting your search terms or add a new truck.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </Navigation>
  )
}
