"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, Pencil, Info } from "lucide-react";
import { useAuth } from "./auth-provider";
import { fetchClient } from "@/lib/fetchClient";

interface EditInventoryItemModalProps {
  item: any; // minimal item info (contains internalId)
  onItemUpdated?: (updatedItem: any) => void;
}

// Categories and units data
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
];

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
];

export function EditInventoryItemModal({
  item,
  onItemUpdated,
}: EditInventoryItemModalProps) {
  const { token } = useAuth();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    unit: "pieces",
    notes: "",
    partNumber: "",
    brand: "",
    cost_price: "",
    lowStockThreshold: "",
    standardLevel: "",
  });
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle mobile input focus
  const handleMobileInputFocus = (inputId: string) => {
    if (isMobile) {
      setTimeout(() => {
        const input = document.getElementById(inputId);
        if (input) {
          input.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'nearest'
          });
        }
      }, 300); // Delay to allow keyboard to open
    }
  };

  // Fetch full item details when modal opens
  useEffect(() => {
    if (open && item?.internalId) {
      const fetchDetails = async () => {
        setLoading(true);
        try {
          const response = await fetchClient(
            `/api/inventory?item=${item.internalId}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          if (response.ok) {
            const data = await response.json();
            setFormData({
              name: data.name || "",
              category: data.category || "",
              unit: data.unit || "pieces",
              notes: data.notes || "",
              partNumber: data.partNumber || "",
              brand: data.brand || "",
              cost_price: data.costPrice || "",
              lowStockThreshold: data.lowStockThreshold || "",
              standardLevel: data.standardLevel || "",
            });
          } else {
            console.error("Failed to fetch item details");
          }
        } catch (error) {
          console.error("Error fetching item details:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchDetails();
    }
  }, [open, item?.internalId, token]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedItem = {
      ...item,
      lowStockThreshold: Number(formData.lowStockThreshold) || 0,
      standardLevel: Number(formData.standardLevel) || 0,
      cost_price: formData.cost_price ? Number(formData.cost_price) : 0,
      name: formData.name,
      category: formData.category,
      unit: formData.unit,
      partNumber: formData.partNumber,
      brand: formData.brand,
      notes: formData.notes,
    };

    onItemUpdated?.(updatedItem);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil className="h-4 w-4 mr-1" /> Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] sm:w-[90vw] md:max-w-[600px] h-[90vh] sm:h-[85vh] md:max-h-[90vh] overflow-y-auto p-0 sm:p-6">
        <DialogHeader className="px-3 sm:px-0 pt-3 sm:pt-0 flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Package className="h-4 w-4 sm:h-5 sm:w-5" />
            Edit Inventory Item
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <p className="p-4 text-center">Loading item details...</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 px-3 sm:px-0 flex-1 overflow-y-auto">
            {/* Basic Information */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-900 border-b pb-2">
                Basic Information
              </h4>

              <div className="space-y-2">
                <Label htmlFor="name">Item Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category: value })
                    }
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
                  <Select
                    value={formData.unit}
                    onValueChange={(value) =>
                      setFormData({ ...formData, unit: value })
                    }
                  >
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="partNumber">Part Number</Label>
                  <Input
                    id="partNumber"
                    value={formData.partNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, partNumber: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="brand">Brand</Label>
                  <Input
                    id="brand"
                    value={formData.brand}
                    onChange={(e) =>
                      setFormData({ ...formData, brand: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cost_price">Cost Price</Label>
                  <Input
                    id="cost_price"
                    value={formData.cost_price}
                    onChange={(e) =>
                      setFormData({ ...formData, cost_price: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  rows={3}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Inventory Levels */}
            <div className={`space-y-4 ${isMobile ? 'bg-gray-50 p-4 rounded-lg' : ''}`}>
              <h4 className="text-sm font-semibold text-gray-900 border-b pb-2">
                Inventory Levels
              </h4>

              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">
                      Standard Level vs Low Stock Threshold
                    </p>
                    <p>
                      <strong>Standard Level:</strong> The ideal quantity to
                      maintain for operations
                    </p>
                    <p>
                      <strong>Low Stock Threshold:</strong> The minimum quantity
                      before urgent restocking
                    </p>
                  </div>
                </div>
              </div>

              {/* Mobile Layout */}
              <div className="block md:hidden space-y-4">
                <div className="bg-white border rounded-lg p-4 shadow-sm">
                  <div className="space-y-2">
                    <Label htmlFor="standardLevel" className="text-sm font-medium text-gray-700">
                      Standard Level *
                    </Label>
                    <Input
                      id="standardLevel"
                      type="number"
                      placeholder="20"
                      value={formData.standardLevel}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          standardLevel: e.target.value,
                        })
                      }
                      onFocus={() => handleMobileInputFocus('standardLevel')}
                      required
                      className="text-base"
                    />
                    <p className="text-xs text-gray-500">Ideal quantity to maintain</p>
                  </div>
                </div>
                
                <div className="bg-white border rounded-lg p-4 shadow-sm">
                  <div className="space-y-2">
                    <Label htmlFor="lowStockThreshold" className="text-sm font-medium text-gray-700">
                      Low Stock Alert Level *
                    </Label>
                    <Input
                      id="lowStockThreshold"
                      type="number"
                      placeholder="5"
                      value={formData.lowStockThreshold}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          lowStockThreshold: e.target.value,
                        })
                      }
                      onFocus={() => handleMobileInputFocus('lowStockThreshold')}
                      required
                      className="text-base"
                    />
                    <p className="text-xs text-gray-500">Minimum before urgent restock</p>
                  </div>
                </div>
              </div>

              {/* Desktop Layout */}
              <div className="hidden md:block">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="standardLevel">Standard Level *</Label>
                    <Input
                      id="standardLevel"
                      type="number"
                      value={formData.standardLevel}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          standardLevel: e.target.value,
                        })
                      }
                      onFocus={() => handleMobileInputFocus('standardLevel')}
                      required
                      className="text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lowStockThreshold">
                      LowStock Alert Level*
                    </Label>
                    <Input
                      id="lowStockThreshold"
                      type="number"
                      value={formData.lowStockThreshold}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          lowStockThreshold: e.target.value,
                        })
                      }
                      onFocus={() => handleMobileInputFocus('lowStockThreshold')}
                      required
                      className="text-base"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-end gap-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="w-full sm:w-auto order-2 sm:order-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#10294B] hover:bg-[#10294B]/90 w-full sm:w-auto order-1 sm:order-2"
              >
                Save Changes
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
