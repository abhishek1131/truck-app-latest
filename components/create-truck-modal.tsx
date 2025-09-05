"use client";

import type React from "react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Truck } from "lucide-react";

interface CreateTruckDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onTruckCreated: (truck: any) => void;
}

export function CreateTruckDialog({
  isOpen,
  onClose,
  onTruckCreated,
}: CreateTruckDialogProps) {
  const [formData, setFormData] = useState({
    truck_number: "",
    make: "",
    model: "",
    year: "",
    license_plate: "",
    vin: "",
    location: "",
    status: "Available",
    mileage: "",
    description: "",
  });

  const truckMakes = ["Ford", "Chevrolet", "Ram", "Mercedes"];
  const truckModels = {
    Ford: ["Transit 150", "Transit 250", "Transit 350"],
    Chevrolet: ["Express 2500", "Express 3500"],
    Ram: ["ProMaster 1500", "ProMaster 2500", "ProMaster 3500"],
    Mercedes: ["Sprinter 2500", "Sprinter 3500"],
  };

  const locations = [
    "Downtown Route",
    "Suburban Route",
    "Industrial Route",
    "North Route",
    "South Route",
    "East Route",
    "West Route",
    "Unassigned",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      truck_number: formData.truck_number,
      make: formData.make,
      model: formData.model,
      year: Number.parseInt(formData.year),
      license_plate: formData.license_plate,
      vin: formData.vin,
      location: formData.location || null,
      status: formData.status.toLowerCase(),
      mileage: Number.parseInt(formData.mileage) || 0,
      next_maintenance: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0], // 90 days from now
    };

    try {
      const response = await fetch("/api/admin/trucks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`, // Adjust based on your auth setup
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create truck");
      }

      const newTruck = await response.json();
      onTruckCreated({
        ...newTruck.data,
        totalItems: 0,
        lowStockItems: 0,
        bins: 0,
        assigned_technician: null,
        lastUpdated: "Never",
      });

      // Reset form
      setFormData({
        truck_number: "",
        make: "",
        model: "",
        year: "",
        license_plate: "",
        vin: "",
        location: "",
        status: "Available",
        mileage: "",
        description: "",
      });
      onClose();
    } catch (error) {
      console.error("Error creating truck:", error);
      console.log(error.message || "Failed to create truck");
    }
  };

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
              <Label htmlFor="truck_number">Truck Number *</Label>
              <Input
                id="truck_number"
                placeholder="e.g., TRK-006"
                value={formData.truck_number}
                onChange={(e) =>
                  setFormData({ ...formData, truck_number: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="license_plate">License Plate *</Label>
              <Input
                id="license_plate"
                placeholder="e.g., TX-TRK-006"
                value={formData.license_plate}
                onChange={(e) =>
                  setFormData({ ...formData, license_plate: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="make">Make *</Label>
              <Select
                value={formData.make}
                onValueChange={(value) =>
                  setFormData({ ...formData, make: value, model: "" })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select make" />
                </SelectTrigger>
                <SelectContent>
                  {truckMakes.map((make) => (
                    <SelectItem key={make} value={make}>
                      {make}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">Model *</Label>
              <Select
                value={formData.model}
                onValueChange={(value) =>
                  setFormData({ ...formData, model: value })
                }
                disabled={!formData.make}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  {formData.make &&
                    truckModels[formData.make]?.map((model) => (
                      <SelectItem key={model} value={model}>
                        {model}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="year">Year *</Label>
              <Input
                id="year"
                type="number"
                placeholder="2024"
                min="2015"
                max="2025"
                value={formData.year}
                onChange={(e) =>
                  setFormData({ ...formData, year: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vin">VIN *</Label>
              <Input
                id="vin"
                placeholder="e.g., 1FTYE1YM0GKB12345"
                value={formData.vin}
                onChange={(e) =>
                  setFormData({ ...formData, vin: e.target.value })
                }
                maxLength={17}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">Initial Location</Label>
              <Select
                value={formData.location}
                onValueChange={(value) =>
                  setFormData({ ...formData, location: value })
                }
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
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value })
                }
              >
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
              onChange={(e) =>
                setFormData({ ...formData, mileage: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Additional notes about this truck..."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#E3253D] hover:bg-[#E3253D]/90"
            >
              Create Truck
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
