"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Grid3X3 } from 'lucide-react'

interface AddBinModalProps {
  truckId: string
  onBinAdded?: (bin: any) => void
}

export function AddBinModal({ truckId, onBinAdded }: AddBinModalProps) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    binCode: "",
    name: "",
    location: "",
    section: "",
    description: "",
    maxCapacity: "",
    binType: "",
  })

  const binTypes = [
    "Shelf Compartment",
    "Drawer Unit",
    "Overhead Storage",
    "Side Panel",
    "Under-bed Storage",
    "Tool Cabinet",
    "Parts Bin",
    "Supply Container"
  ]

  const locationOptions = [
    "Driver Side",
    "Passenger Side", 
    "Front Center",
    "Rear Center",
    "Left Side",
    "Right Side",
    "Top/Overhead",
    "Bottom/Under-bed",
    "Back Door Area"
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Create new bin object
    const newBin = {
      id: `bin-${Date.now()}`,
      binCode: formData.binCode,
      name: formData.name,
      location: formData.location,
      section: formData.section,
      description: formData.description,
      maxCapacity: parseInt(formData.maxCapacity) || 50,
      binType: formData.binType,
      totalItems: 0,
      lowStockItems: 0,
      categories: [],
      lastUpdated: "Just now",
      createdAt: new Date().toISOString(),
    }

    // Call the callback function
    onBinAdded?.(newBin)
    
    // Reset form and close modal
    setFormData({
      binCode: "",
      name: "",
      location: "",
      section: "",
      description: "",
      maxCapacity: "",
      binType: "",
    })
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-16 flex flex-col space-y-2 bg-[#E3253D] hover:bg-[#E3253D]/90">
          <Plus className="h-5 w-5" />
          <span className="text-xs">Add Bin</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Grid3X3 className="h-5 w-5" />
            Add New Storage Bin
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="binCode">Bin Code *</Label>
              <Input
                id="binCode"
                placeholder="e.g., C11, C21A, C31B"
                value={formData.binCode}
                onChange={(e) => setFormData({ ...formData, binCode: e.target.value })}
                required
              />
              <p className="text-xs text-gray-500">Alphanumeric code for identification</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="section">Section (Optional)</Label>
              <Input
                id="section"
                placeholder="e.g., A, B, Left, Right"
                value={formData.section}
                onChange={(e) => setFormData({ ...formData, section: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Bin Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Front Left Compartment, Pipe Storage"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <Select value={formData.location} onValueChange={(value) => setFormData({ ...formData, location: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {locationOptions.map((location) => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="binType">Bin Type *</Label>
              <Select value={formData.binType} onValueChange={(value) => setFormData({ ...formData, binType: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {binTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxCapacity">Max Capacity (Items)</Label>
            <Input
              id="maxCapacity"
              type="number"
              placeholder="50"
              value={formData.maxCapacity}
              onChange={(e) => setFormData({ ...formData, maxCapacity: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Brief description of what this bin will store..."
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
              Add Bin
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
