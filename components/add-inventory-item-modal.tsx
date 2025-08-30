"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Package, Info } from "lucide-react"

interface AddInventoryItemModalProps {
  onItemAdded?: (item: any) => void
}

export function AddInventoryItemModal({ onItemAdded }: AddInventoryItemModalProps) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    unit: "pieces",
    notes: "",
    partNumber: "",
    brand: "",
    lowStockThreshold: "",
    standardLevel: "",
  })

  const categories = [
    "Pipes",
    "Fittings",
    "Valves",
    "Tools",
    "Hardware",
    "Electrical",
    "Gaskets & Seals",
    "Adhesives",
    "Fasteners",
    "Safety Equipment",
    "Measuring Tools",
    "Cleaning Supplies",
    "HVAC",
    "Plumbing",
    "Other",
  ]

  const units = ["pieces", "feet", "inches", "meters", "boxes", "rolls", "bottles", "tubes", "sets", "pairs"]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Create new item object
    const newItem = {
      name: formData.name,
      category: formData.category,
      unit: formData.unit,
      notes: formData.notes,
      partNumber: formData.partNumber,
      brand: formData.brand,
      lowStockThreshold: Number.parseInt(formData.lowStockThreshold) || 5,
      standardLevel: Number.parseInt(formData.standardLevel) || 10,
      createdAt: new Date().toISOString(),
    }

    // Call the callback function
    onItemAdded?.(newItem)

    // Reset form and close modal
    setFormData({
      name: "",
      category: "",
      unit: "pieces",
      notes: "",
      partNumber: "",
      brand: "",
      lowStockThreshold: "",
      standardLevel: "",
    })
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#E3253D] hover:bg-[#E3253D]/90">
          <Plus className="h-4 w-4 mr-2" />
          Add New Item
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Add New Inventory Item
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-900 border-b pb-2">Basic Information</h4>

            <div className="space-y-2">
              <Label htmlFor="name">Item Name *</Label>
              <Input
                id="name"
                placeholder="e.g., 1/2 inch PVC Pipe, PVC Elbow Joint"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unit *</Label>
                <Select value={formData.unit} onValueChange={(value) => setFormData({ ...formData, unit: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit" />
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="partNumber">Part Number</Label>
                <Input
                  id="partNumber"
                  placeholder="e.g., PVC-001, FIT-205"
                  value={formData.partNumber}
                  onChange={(e) => setFormData({ ...formData, partNumber: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="brand">Brand</Label>
                <Input
                  id="brand"
                  placeholder="e.g., Charlotte, Fernco"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Brief description of the item..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          {/* Inventory Levels */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-900 border-b pb-2">Inventory Levels</h4>

            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Standard Level vs Low Stock Threshold</p>
                  <p>
                    <strong>Standard Level:</strong> The ideal quantity to maintain for optimal operations
                  </p>
                  <p>
                    <strong>Low Stock Threshold:</strong> The minimum quantity before urgent restocking is needed
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="standardLevel">Standard Level *</Label>
                <Input
                  id="standardLevel"
                  type="number"
                  placeholder="20"
                  value={formData.standardLevel}
                  onChange={(e) => setFormData({ ...formData, standardLevel: e.target.value })}
                  required
                />
                <p className="text-xs text-gray-500">Ideal quantity to maintain</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lowStockThreshold">Low Stock Alert Level *</Label>
                <Input
                  id="lowStockThreshold"
                  type="number"
                  placeholder="5"
                  value={formData.lowStockThreshold}
                  onChange={(e) => setFormData({ ...formData, lowStockThreshold: e.target.value })}
                  required
                />
                <p className="text-xs text-gray-500">Minimum before urgent restock</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-[#E3253D] hover:bg-[#E3253D]/90">
              Add Item
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
