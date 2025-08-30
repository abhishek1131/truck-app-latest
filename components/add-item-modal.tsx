"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Package } from 'lucide-react'

interface AddItemModalProps {
  binId: string
  onItemAdded?: (item: any) => void
}

export function AddItemModal({ binId, onItemAdded }: AddItemModalProps) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    currentStock: "",
    minLevel: "",
    maxLevel: "",
    unit: "pieces",
    description: "",
    partNumber: "",
    brand: "",
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
    "Other"
  ]

  const units = [
    "pieces",
    "feet",
    "inches", 
    "meters",
    "boxes",
    "rolls",
    "bottles",
    "tubes",
    "sets",
    "pairs"
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const currentStock = parseInt(formData.currentStock) || 0
    const minLevel = parseInt(formData.minLevel) || 0
    
    // Create new item object
    const newItem = {
      id: `item-${Date.now()}`,
      name: formData.name,
      category: formData.category,
      currentStock,
      minLevel,
      maxLevel: parseInt(formData.maxLevel) || minLevel * 2,
      unit: formData.unit,
      description: formData.description,
      partNumber: formData.partNumber,
      brand: formData.brand,
      isLowStock: currentStock <= minLevel,
      lastUsed: "Never",
      createdAt: new Date().toISOString(),
    }

    // Call the callback function
    onItemAdded?.(newItem)
    
    // Reset form and close modal
    setFormData({
      name: "",
      category: "",
      currentStock: "",
      minLevel: "",
      maxLevel: "",
      unit: "pieces",
      description: "",
      partNumber: "",
      brand: "",
    })
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-16 flex flex-col space-y-2 bg-[#E3253D] hover:bg-[#E3253D]/90">
          <Plus className="h-5 w-5" />
          <span className="text-xs">Add Item</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Add New Item
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
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
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
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

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currentStock">Current Stock *</Label>
              <Input
                id="currentStock"
                type="number"
                placeholder="0"
                value={formData.currentStock}
                onChange={(e) => setFormData({ ...formData, currentStock: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minLevel">Min Level *</Label>
              <Input
                id="minLevel"
                type="number"
                placeholder="5"
                value={formData.minLevel}
                onChange={(e) => setFormData({ ...formData, minLevel: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxLevel">Max Level</Label>
              <Input
                id="maxLevel"
                type="number"
                placeholder="20"
                value={formData.maxLevel}
                onChange={(e) => setFormData({ ...formData, maxLevel: e.target.value })}
              />
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
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Brief description of the item..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
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
