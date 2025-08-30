"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Settings, Plus, Trash2, Package, Grid3X3 } from "lucide-react"

interface StandardInventoryModalProps {
  truckId?: string
  onStandardLevelsSet?: (levels: any) => void
}

interface StandardItem {
  id: string
  name: string
  binId: string
  binName: string
  standardQuantity: number
  unit: string
}

export function StandardInventoryModal({ truckId, onStandardLevelsSet }: StandardInventoryModalProps) {
  const [open, setOpen] = useState(false)
  const [selectedBin, setSelectedBin] = useState("")
  const [newItemName, setNewItemName] = useState("")
  const [newItemQuantity, setNewItemQuantity] = useState("")
  const [newItemUnit, setNewItemUnit] = useState("pieces")

  // Mock bins data - in real app this would come from props or API
  const availableBins = [
    { id: "bin-1", name: "Front Left Compartment", location: "Driver Side" },
    { id: "bin-2", name: "Front Right Compartment", location: "Passenger Side" },
    { id: "bin-3", name: "Rear Storage Bay", location: "Back Center" },
    { id: "bin-4", name: "Side Panel Storage", location: "Left Side" },
    { id: "bin-5", name: "Overhead Compartment", location: "Top Center" },
    { id: "bin-6", name: "Under-bed Storage", location: "Bottom Center" },
  ]

  const [standardItems, setStandardItems] = useState<StandardItem[]>([
    {
      id: "std-1",
      name: "PVC Pipe 1/2 inch",
      binId: "bin-1",
      binName: "Front Left Compartment",
      standardQuantity: 15,
      unit: "pieces",
    },
    {
      id: "std-2",
      name: "PVC Elbow Joints",
      binId: "bin-1",
      binName: "Front Left Compartment",
      standardQuantity: 20,
      unit: "pieces",
    },
    {
      id: "std-3",
      name: "Pipe Wrench",
      binId: "bin-2",
      binName: "Front Right Compartment",
      standardQuantity: 2,
      unit: "pieces",
    },
  ])

  const units = ["pieces", "feet", "inches", "meters", "boxes", "rolls", "bottles", "tubes", "sets", "pairs"]

  const handleAddItem = () => {
    if (!newItemName.trim() || !selectedBin || !newItemQuantity) return

    const selectedBinData = availableBins.find((bin) => bin.id === selectedBin)
    if (!selectedBinData) return

    const newItem: StandardItem = {
      id: `std-${Date.now()}`,
      name: newItemName.trim(),
      binId: selectedBin,
      binName: selectedBinData.name,
      standardQuantity: Number.parseInt(newItemQuantity),
      unit: newItemUnit,
    }

    setStandardItems([...standardItems, newItem])
    setNewItemName("")
    setNewItemQuantity("")
    setSelectedBin("")
    setNewItemUnit("pieces")
  }

  const handleRemoveItem = (itemId: string) => {
    setStandardItems(standardItems.filter((item) => item.id !== itemId))
  }

  const handleUpdateQuantity = (itemId: string, quantity: string) => {
    const numQuantity = Number.parseInt(quantity) || 0
    setStandardItems(
      standardItems.map((item) => (item.id === itemId ? { ...item, standardQuantity: numQuantity } : item)),
    )
  }

  const handleSave = () => {
    onStandardLevelsSet?.(standardItems)
    setOpen(false)
  }

  const groupedItems = standardItems.reduce(
    (acc, item) => {
      if (!acc[item.binId]) {
        acc[item.binId] = {
          binName: item.binName,
          items: [],
        }
      }
      acc[item.binId].items.push(item)
      return acc
    },
    {} as Record<string, { binName: string; items: StandardItem[] }>,
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="h-16 flex flex-col space-y-2 w-full bg-transparent">
          <Settings className="h-5 w-5" />
          <span className="text-xs">Setup Standard Levels</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Setup Standard Inventory Levels
            {truckId && <span className="text-sm font-normal text-gray-500">- Truck #{truckId.padStart(3, "0")}</span>}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add New Item Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Standard Item
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="itemName">Item Name</Label>
                  <Input
                    id="itemName"
                    placeholder="e.g., PVC Pipe 1/2 inch"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bin">Assign to Bin</Label>
                  <Select value={selectedBin} onValueChange={setSelectedBin}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select bin" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableBins.map((bin) => (
                        <SelectItem key={bin.id} value={bin.id}>
                          {bin.name} - {bin.location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Standard Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    placeholder="15"
                    value={newItemQuantity}
                    onChange={(e) => setNewItemQuantity(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Unit</Label>
                  <Select value={newItemUnit} onValueChange={setNewItemUnit}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map((unit) => (
                        <SelectItem key={unit} value={unit}>
                          {unit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleAddItem} className="w-full bg-[#E3253D] hover:bg-[#E3253D]/90">
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </CardContent>
          </Card>

          {/* Current Standard Items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="h-4 w-4" />
                Standard Inventory Items ({standardItems.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(groupedItems).length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No standard items defined yet</p>
                  <p className="text-sm">Add items above to get started</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(groupedItems).map(([binId, binData]) => (
                    <div key={binId} className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-4">
                        <Grid3X3 className="h-4 w-4 text-[#10294B]" />
                        <h4 className="font-semibold text-[#10294B]">{binData.binName}</h4>
                        <Badge variant="secondary" className="text-xs">
                          {binData.items.length} items
                        </Badge>
                      </div>
                      <div className="space-y-3">
                        {binData.items.map((item) => (
                          <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{item.name}</p>
                              <p className="text-sm text-gray-500">{item.unit}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2">
                                <Label htmlFor={`qty-${item.id}`} className="text-sm">
                                  Qty:
                                </Label>
                                <Input
                                  id={`qty-${item.id}`}
                                  type="number"
                                  value={item.standardQuantity}
                                  onChange={(e) => handleUpdateQuantity(item.id, e.target.value)}
                                  className="w-20"
                                />
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRemoveItem(item.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-[#E3253D] hover:bg-[#E3253D]/90">
              Save Standard Levels
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
