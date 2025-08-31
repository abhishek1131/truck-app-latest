"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useState } from "react";

interface CreateTruckModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTruckCreated: (truckData: any) => void;
}

export function CreateTruckModal({
  isOpen,
  onClose,
  onTruckCreated,
}: CreateTruckModalProps) {
  const [formData, setFormData] = useState({
    truck_number: "",
    make: "",
    model: "",
    year: "",
    license_plate: "",
    vin: "",
    location: "",
    mileage: "",
    next_maintenance: "",
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    const requiredFields = [
      "truck_number",
      "make",
      "model",
      "year",
      "license_plate",
      "vin",
    ];
    requiredFields.forEach((field) => {
      if (!formData[field as keyof typeof formData]) {
        newErrors[field] = `${field.replace("_", " ")} is required`;
      }
    });
    if (formData.year && !/^\d{4}$/.test(formData.year)) {
      newErrors.year = "Year must be a valid 4-digit number";
    }
    if (formData.mileage && !/^\d+$/.test(formData.mileage)) {
      newErrors.mileage = "Mileage must be a positive number";
    }
    if (
      formData.next_maintenance &&
      !/^\d{4}-\d{2}-\d{2}$/.test(formData.next_maintenance)
    ) {
      newErrors.next_maintenance =
        "Next maintenance must be a valid date (YYYY-MM-DD)";
    }
    if (formData.vin && formData.vin.length !== 17) {
      newErrors.vin = "VIN must be 17 characters";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    onTruckCreated({
      truck_number: formData.truck_number,
      make: formData.make,
      model: formData.model,
      year: parseInt(formData.year),
      license_plate: formData.license_plate,
      vin: formData.vin,
      location: formData.location || null,
      mileage: parseInt(formData.mileage) || 0,
      next_maintenance: formData.next_maintenance || null,
    });
    setFormData({
      truck_number: "",
      make: "",
      model: "",
      year: "",
      license_plate: "",
      vin: "",
      location: "",
      mileage: "",
      next_maintenance: "",
    });
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Truck</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="truck_number" className="text-right">
              Truck Number
            </Label>
            <div className="col-span-3">
              <Input
                id="truck_number"
                name="truck_number"
                value={formData.truck_number}
                onChange={handleChange}
                className={errors.truck_number ? "border-red-500" : ""}
              />
              {errors.truck_number && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.truck_number}
                </p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="make" className="text-right">
              Make
            </Label>
            <div className="col-span-3">
              <Input
                id="make"
                name="make"
                value={formData.make}
                onChange={handleChange}
                className={errors.make ? "border-red-500" : ""}
              />
              {errors.make && (
                <p className="text-red-500 text-xs mt-1">{errors.make}</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="model" className="text-right">
              Model
            </Label>
            <div className="col-span-3">
              <Input
                id="model"
                name="model"
                value={formData.model}
                onChange={handleChange}
                className={errors.model ? "border-red-500" : ""}
              />
              {errors.model && (
                <p className="text-red-500 text-xs mt-1">{errors.model}</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="year" className="text-right">
              Year
            </Label>
            <div className="col-span-3">
              <Input
                id="year"
                name="year"
                type="number"
                value={formData.year}
                onChange={handleChange}
                className={errors.year ? "border-red-500" : ""}
              />
              {errors.year && (
                <p className="text-red-500 text-xs mt-1">{errors.year}</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="license_plate" className="text-right">
              License Plate
            </Label>
            <div className="col-span-3">
              <Input
                id="license_plate"
                name="license_plate"
                value={formData.license_plate}
                onChange={handleChange}
                className={errors.license_plate ? "border-red-500" : ""}
              />
              {errors.license_plate && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.license_plate}
                </p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="vin" className="text-right">
              VIN
            </Label>
            <div className="col-span-3">
              <Input
                id="vin"
                name="vin"
                value={formData.vin}
                onChange={handleChange}
                className={errors.vin ? "border-red-500" : ""}
              />
              {errors.vin && (
                <p className="text-red-500 text-xs mt-1">{errors.vin}</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="location" className="text-right">
              Location
            </Label>
            <Input
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="mileage" className="text-right">
              Mileage
            </Label>
            <div className="col-span-3">
              <Input
                id="mileage"
                name="mileage"
                type="number"
                value={formData.mileage}
                onChange={handleChange}
                className={errors.mileage ? "border-red-500" : ""}
              />
              {errors.mileage && (
                <p className="text-red-500 text-xs mt-1">{errors.mileage}</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="next_maintenance" className="text-right">
              Next Maintenance
            </Label>
            <div className="col-span-3">
              <Input
                id="next_maintenance"
                name="next_maintenance"
                type="date"
                value={formData.next_maintenance}
                onChange={handleChange}
                className={errors.next_maintenance ? "border-red-500" : ""}
              />
              {errors.next_maintenance && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.next_maintenance}
                </p>
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-[#E3253D] hover:bg-[#E3253D]/90"
          >
            Create Truck
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
