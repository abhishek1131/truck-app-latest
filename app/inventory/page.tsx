"use client"

import { useAuth } from "@/components/auth-provider"
import { Navigation } from "@/components/layout/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Package, Search, Calendar, Truck, Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { InventoryItemDetailsModal } from "@/components/inventory-item-details-modal"
import { AddInventoryItemModal } from "@/components/add-inventory-item-modal"

const mockInventoryItems = [
  {
    id: "ITEM-001",
    name: "HVAC Filter Set",
    category: "HVAC",
    totalQuantity: 45,
    lowStockThreshold: 10,
    standardLevel: 20,
    lastOrdered: "2024-01-15",
    trucks: ["TRUCK-001", "TRUCK-002"],
    notes: "Standard 16x20 filters",
    unit: "pieces",
    partNumber: "HF-1620",
    brand: "FilterPro",
  },
  {
    id: "ITEM-002",
    name: "Copper Pipe Fittings",
    category: "Plumbing",
    totalQuantity: 8,
    lowStockThreshold: 15,
    standardLevel: 25,
    lastOrdered: "2024-01-14",
    trucks: ["TRUCK-001", "TRUCK-003"],
    notes: 'Various sizes 1/2" to 2"',
    unit: "pieces",
    partNumber: "CPF-ASSORT",
    brand: "CopperMax",
  },
  {
    id: "ITEM-003",
    name: "Electrical Conduit",
    category: "Electrical",
    totalQuantity: 25,
    lowStockThreshold: 12,
    standardLevel: 30,
    lastOrdered: "2024-01-13",
    trucks: ["TRUCK-002", "TRUCK-003"],
    notes: '1/2" EMT conduit',
    unit: "feet",
    partNumber: "EC-12EMT",
    brand: "ElectroTube",
  },
  {
    id: "ITEM-004",
    name: "Wire Nuts Assorted",
    category: "Electrical",
    totalQuantity: 150,
    lowStockThreshold: 50,
    standardLevel: 100,
    lastOrdered: "2024-01-12",
    trucks: ["TRUCK-001", "TRUCK-002", "TRUCK-003"],
    notes: "Mixed sizes and colors",
    unit: "pieces",
    partNumber: "WN-ASSORT",
    brand: "WireConnect",
  },
]

export default function InventoryPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [inventoryItems, setInventoryItems] = useState(mockInventoryItems)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  const handleItemAdded = (newItem: any) => {
    const item = {
      ...newItem,
      id: `ITEM-${String(inventoryItems.length + 1).padStart(3, "0")}`,
      totalQuantity: 0,
      trucks: [],
      lastOrdered: "Never",
    }
    setInventoryItems([...inventoryItems, item])
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!user) {
    return null
  }

  const filteredItems = inventoryItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const totalItems = inventoryItems.reduce((sum, item) => sum + item.totalQuantity, 0)
  const lowStockItems = inventoryItems.filter((item) => item.totalQuantity <= item.lowStockThreshold).length
  const categories = [...new Set(inventoryItems.map((item) => item.category))].length
  const needsRestockItems = inventoryItems.filter((item) => item.totalQuantity < item.standardLevel).length

  return (
    <Navigation title="Inventory" subtitle="Manage your inventory across all trucks">
      <div className="p-4 md:p-6">
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-[#10294B] to-[#006AA1] text-white border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90">Total Items</p>
                    <p className="text-2xl font-bold">{totalItems}</p>
                  </div>
                  <Package className="h-8 w-8 opacity-80" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90">Item Types</p>
                    <p className="text-2xl font-bold">{inventoryItems.length}</p>
                  </div>
                  <Package className="h-8 w-8 opacity-80" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-[#E3253D] to-red-600 text-white border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90">Low Stock</p>
                    <p className="text-2xl font-bold">{lowStockItems}</p>
                  </div>
                  <Package className="h-8 w-8 opacity-80" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90">Needs Restock</p>
                    <p className="text-2xl font-bold">{needsRestockItems}</p>
                  </div>
                  <Package className="h-8 w-8 opacity-80" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Add New Item Section */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Plus className="h-5 w-5 text-[#10294B]" />
                    <h3 className="text-lg font-semibold text-gray-900">Add New Inventory Item</h3>
                  </div>
                  <p className="text-gray-600 text-sm">
                    Add new items to your inventory catalog with standard levels and stock thresholds.
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <AddInventoryItemModal onItemAdded={handleItemAdded} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search inventory items..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="HVAC">HVAC</SelectItem>
                    <SelectItem value="Plumbing">Plumbing</SelectItem>
                    <SelectItem value="Electrical">Electrical</SelectItem>
                    <SelectItem value="Pipes">Pipes</SelectItem>
                    <SelectItem value="Fittings">Fittings</SelectItem>
                    <SelectItem value="Tools">Tools</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Inventory List */}
          <div className="space-y-4">
            {filteredItems.map((item) => (
              <Card key={item.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-[#10294B] rounded-lg flex items-center justify-center text-white font-bold">
                        <Package className="h-8 w-8" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-[#10294B]">{item.name}</h3>
                        <p className="text-gray-600">ID: {item.id}</p>
                        <p className="text-sm text-gray-500">{item.notes}</p>
                        <div className="flex items-center gap-6 mt-2 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Package className="h-4 w-4" />
                            Current: {item.totalQuantity} {item.unit}
                          </span>
                          <span className="flex items-center gap-1">
                            <Package className="h-4 w-4" />
                            Standard: {item.standardLevel} {item.unit}
                          </span>
                          <span className="flex items-center gap-1">
                            <Truck className="h-4 w-4" />
                            {item.trucks.length} trucks
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Last ordered: {item.lastOrdered}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">
                        {item.category}
                      </Badge>
                      {item.totalQuantity <= item.lowStockThreshold && (
                        <Badge variant="destructive" className="bg-red-100 text-red-800">
                          Low Stock
                        </Badge>
                      )}
                      {item.totalQuantity < item.standardLevel && (
                        <Badge className="bg-orange-100 text-orange-800">Needs Restock</Badge>
                      )}
                      <InventoryItemDetailsModal item={item}>
                        <Button variant="outline">View Details</Button>
                      </InventoryItemDetailsModal>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredItems.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No items found</h3>
                <p className="text-gray-500">Try adjusting your search or filter criteria</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Navigation>
  )
}
