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
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Package, Search } from "lucide-react";
import { useAuth } from "@/components/auth-provider";

interface SelectInventoryItemModalProps {
  truckId: string;
  binId: string;
  onItemSelected?: (item: any, quantity: number) => void;
}

export function SelectInventoryItemModal({
  truckId,
  binId,
  onItemSelected,
}: SelectInventoryItemModalProps) {
  const { user, token } = useAuth();
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [quantity, setQuantity] = useState("");
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);

  useEffect(() => {
    const fetchInventoryItems = async () => {
      if (!user || !token) return;

      try {
        const response = await fetch(
          `/api/orders/inventory?truck_id=${truckId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const data = await response.json();
        if (response.ok) {
          setInventoryItems(data.inventoryItems);
        } else {
          console.error("Failed to fetch inventory items:", data.error);
        }
      } catch (error) {
        console.error("Error fetching inventory items:", error);
      }
    };

    fetchInventoryItems();
  }, [user, token, truckId]);

  const filteredItems = inventoryItems.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.partNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectItem = (item: any) => {
    setSelectedItem(item);
    setQuantity("");
  };

  const handleAddToBin = () => {
    if (!selectedItem || !quantity) return;

    const qty = Number.parseInt(quantity);
    if (qty <= 0) return;

    onItemSelected?.(selectedItem, qty);

    // Reset and close
    setSelectedItem(null);
    setQuantity("");
    setSearchTerm("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-16 flex flex-col space-y-2 bg-[#E3253D] hover:bg-[#E3253D]/90">
          <Plus className="h-5 w-5" />
          <span className="text-xs">Add Item</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Add Item to Bin
            <span className="text-sm font-normal text-gray-500">
              - Truck #{truckId.padStart(3, "0")}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {!selectedItem ? (
            <>
              {/* Search Inventory */}
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search inventory items..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Inventory Items List */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredItems.map((item) => (
                  <Card
                    key={item.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleSelectItem(item)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-[#10294B] rounded-lg flex items-center justify-center">
                            <Package className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              {item.name}
                            </h4>
                            <p className="text-sm text-gray-600">
                              ID: {item.id}
                            </p>
                            <p className="text-xs text-gray-500">
                              {item.notes}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge
                            variant="outline"
                            className="bg-blue-50 text-blue-700 mb-1"
                          >
                            {item.category}
                          </Badge>
                          <p className="text-xs text-gray-500">{item.unit}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {filteredItems.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No inventory items found</p>
                  <p className="text-sm">Try adjusting your search terms</p>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Selected Item & Quantity */}
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Selected Item:
                  </h4>
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-[#10294B] rounded-lg flex items-center justify-center">
                      <Package className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h5 className="font-medium">{selectedItem.name}</h5>
                      <p className="text-sm text-gray-600">
                        ID: {selectedItem.id}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {selectedItem.category}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {selectedItem.unit}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity for this bin *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    placeholder="Enter quantity"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    min="1"
                  />
                  <p className="text-xs text-gray-500">
                    This will be the initial stock quantity for this item in
                    this specific bin.
                  </p>
                </div>
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (selectedItem) {
                  setSelectedItem(null);
                  setQuantity("");
                } else {
                  setOpen(false);
                }
              }}
            >
              {selectedItem ? "Back" : "Cancel"}
            </Button>
            {selectedItem && (
              <Button
                onClick={handleAddToBin}
                disabled={!quantity || Number.parseInt(quantity) <= 0}
                className="bg-[#E3253D] hover:bg-[#E3253D]/90"
              >
                Add to Bin
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
