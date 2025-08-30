"use client"

import { useAuth } from "@/components/auth-provider"
import { Navigation } from "@/components/layout/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RefreshCw, FileText, Package, AlertTriangle, CheckCircle, Edit, RotateCcw } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

interface RestockItem {
  id: string
  name: string
  currentStock: number
  standardLevel: number
  suggestedQuantity: number
  truck: string
  category: string
  priority: "high" | "medium" | "low"
}

const mockRestockItems: RestockItem[] = [
  {
    id: "ITEM-001",
    name: "HVAC Filter Set",
    currentStock: 5,
    standardLevel: 20,
    suggestedQuantity: 15,
    truck: "TRUCK-001",
    category: "HVAC",
    priority: "high",
  },
  {
    id: "ITEM-002",
    name: "Copper Pipe Fittings",
    currentStock: 8,
    standardLevel: 15,
    suggestedQuantity: 7,
    truck: "TRUCK-002",
    category: "Plumbing",
    priority: "medium",
  },
  {
    id: "ITEM-003",
    name: "Wire Nuts Assorted",
    currentStock: 25,
    standardLevel: 50,
    suggestedQuantity: 25,
    truck: "TRUCK-003",
    category: "Electrical",
    priority: "medium",
  },
  {
    id: "ITEM-004",
    name: "Electrical Conduit",
    currentStock: 3,
    standardLevel: 12,
    suggestedQuantity: 9,
    truck: "TRUCK-001",
    category: "Electrical",
    priority: "high",
  },
]

export default function RestockPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [restockItems, setRestockItems] = useState(mockRestockItems)
  const [editingItem, setEditingItem] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!user) {
    return null
  }

  const updateQuantity = (id: string, quantity: number) => {
    setRestockItems((items) =>
      items.map((item) => (item.id === id ? { ...item, suggestedQuantity: Math.max(0, quantity) } : item)),
    )
  }

  const handleSubmitRestock = () => {
    const itemsToRestock = restockItems.filter((item) => item.suggestedQuantity > 0)
    console.log("Submitting restock order:", itemsToRestock)
    alert(`Restock order submitted! ${itemsToRestock.length} items will be restocked. PDF generated and email opened.`)
  }

  const totalItems = restockItems.filter((item) => item.suggestedQuantity > 0).length
  const totalQuantity = restockItems.reduce((sum, item) => sum + item.suggestedQuantity, 0)
  const highPriorityItems = restockItems.filter((item) => item.priority === "high").length

  return (
    <Navigation title="Restock" subtitle="Manage restocking operations">
      <div className="p-4 md:p-6 space-y-6">
        {totalItems > 0 ? (
          <>
            {/* Dashboard Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-gradient-to-br from-[#10294B] to-[#006AA1] text-white border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm opacity-90">Items to Restock</p>
                      <p className="text-2xl font-bold">{totalItems}</p>
                    </div>
                    <Package className="h-8 w-8 opacity-80" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-[#E3253D] to-red-600 text-white border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm opacity-90">High Priority</p>
                      <p className="text-2xl font-bold">{highPriorityItems}</p>
                    </div>
                    <AlertTriangle className="h-8 w-8 opacity-80" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm opacity-90">Total Quantity</p>
                      <p className="text-2xl font-bold">{totalQuantity}</p>
                    </div>
                    <RefreshCw className="h-8 w-8 opacity-80" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Suggested Restock Items */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <RefreshCw className="h-5 w-5" />
                      Suggested Restock Items
                    </CardTitle>
                    <CardDescription>Review and adjust quantities before submitting</CardDescription>
                  </div>
                  <Button
                    onClick={handleSubmitRestock}
                    className="bg-[#E3253D] hover:bg-red-600"
                    disabled={totalItems === 0}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Submit Restock Order
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {restockItems.map((item) => (
                    <Card key={item.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-[#10294B] rounded-lg flex items-center justify-center text-white">
                            <Package className="h-6 w-6" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-[#10294B]">{item.name}</h4>
                            <p className="text-sm text-gray-600">
                              {item.truck} • {item.category}
                            </p>
                            <div className="flex items-center gap-4 mt-1 text-sm">
                              <span className="text-gray-500">Current: {item.currentStock}</span>
                              <span className="text-gray-500">Standard: {item.standardLevel}</span>
                              <span className="text-blue-600 font-medium">
                                Need: {item.standardLevel - item.currentStock}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge
                            className={
                              item.priority === "high"
                                ? "bg-red-100 text-red-800"
                                : item.priority === "medium"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-green-100 text-green-800"
                            }
                          >
                            {item.priority} priority
                          </Badge>
                          <div className="flex items-center gap-2">
                            <Label htmlFor={`quantity-${item.id}`} className="text-sm">
                              Quantity:
                            </Label>
                            {editingItem === item.id ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  id={`quantity-${item.id}`}
                                  type="number"
                                  min="0"
                                  value={item.suggestedQuantity}
                                  onChange={(e) => updateQuantity(item.id, Number.parseInt(e.target.value) || 0)}
                                  className="w-20"
                                />
                                <Button
                                  size="sm"
                                  onClick={() => setEditingItem(null)}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-lg min-w-[3rem] text-center">
                                  {item.suggestedQuantity}
                                </span>
                                <Button size="sm" variant="outline" onClick={() => setEditingItem(item.id)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Restock Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total Items:</span>
                      <span className="font-medium">{totalItems}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Quantity:</span>
                      <span className="font-medium">{totalQuantity}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>High Priority:</span>
                      <span className="font-medium text-red-600">{highPriorityItems}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Medium Priority:</span>
                      <span className="font-medium text-yellow-600">
                        {restockItems.filter((item) => item.priority === "medium").length}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Order Type:</span>
                      <span className="font-medium">Auto Restock</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Generated:</span>
                      <span className="font-medium">{new Date().toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <RotateCcw className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Restock Management</h3>
              <p className="text-gray-500">Restocking system coming soon.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </Navigation>
  )
}
