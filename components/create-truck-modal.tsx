"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Truck } from "lucide-react"

interface CreateTruckModalProps {
  isOpen: boolean
  onClose: () => void
  onTruckCreated: (truck: any) => void
}

export function CreateTruckModal({ isOpen, onClose, onTruckCreated }: CreateTruckModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    model: "",
    year: "",
    licensePlate: "",
    location: "",
    status: "Available",
    mileage: "",
    description: "",
  })

  const truckModels = [
    "Ford Transit 150",
    "Ford Transit 250",
    "Ford Transit 350",
    "Chevrolet Express 2500",
    "Chevrolet Express 3500",
    "Ram ProMaster 1500",
    "Ram ProMaster 2500",
    "Ram ProMaster 3500",
    "Mercedes Sprinter 2500",
    "Mercedes Sprinter 3500",
  ]

  const locations = [
    "Downtown Route",
    "Suburban Route",
    "Industrial Route",
    "North Route",
    "South Route",
    "East Route",
    "West Route",
    "Unassigned",
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const newTruck = {
      ...formData,
      id: `truck-${Date.now()}`,
      year: Number.parseInt(formData.year),
      mileage: Number.parseInt(formData.mileage) || 0,
      totalItems: 0,
      lowStockItems: 0,
      bins: 0,
      assignedTechnician: null,
      technicianId: null,
      nextMaintenance: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 90 days from now
      createdDate: new Date().toISOString().split("T")[0],
      lastUpdated: "Never",
    }

    onTruckCreated(newTruck)

    // Reset form
    setFormData({
      name: "",
      model: "",
      year: "",
      licensePlate: "",
      location: "",
      status: "Available",
      mileage: "",
      description: "",
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Add New Truck
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Truck Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Truck #006"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="licensePlate">License Plate *</Label>
              <Input
                id="licensePlate"
                placeholder="e.g., TX-TRK-006"
                value={formData.licensePlate}
                onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="model">Model *</Label>
              <Select value={formData.model} onValueChange={(value) => setFormData({ ...formData, model: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  {truckModels.map((model) => (
                    <SelectItem key={model} value={model}>
                      {model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="year">Year *</Label>
              <Input
                id="year"
                type="number"
                placeholder="2024"
                min="2015"
                max="2025"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">Initial Location</Label>
              <Select
                value={formData.location}
                onValueChange={(value) => setFormData({ ...formData, location: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Initial Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Available">Available</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Maintenance">Maintenance</SelectItem>
                  <SelectItem value="Out of Service">Out of Service</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mileage">Current Mileage</Label>
            <Input
              id="mileage"
              type="number"
              placeholder="0"
              value={formData.mileage}
              onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Additional notes about this truck..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-[#E3253D] hover:bg-[#E3253D]/90">
              Create Truck
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
