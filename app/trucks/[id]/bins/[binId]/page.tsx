"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Navigation } from "@/components/layout/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  Search,
  AlertTriangle,
  ArrowLeft,
  Edit,
  Trash2,
  ShoppingCart,
  RotateCcw,
  Grid3X3,
  Check,
  X,
} from "lucide-react";
import Link from "next/link";
import { SelectInventoryItemModal } from "@/components/select-inventory-item-modal";
import { EditBinModal } from "@/components/edit-bin-modal";
import { useAuth } from "@/components/auth-provider";

export default function BinDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading, token } = useAuth();
  const truckId = params.id as string;
  const binId = params.binId as string;
  const [searchTerm, setSearchTerm] = useState("");
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editQuantity, setEditQuantity] = useState<number>(0);
  const [bin, setBin] = useState<any>(null);
  const [binItems, setBinItems] = useState<any[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const fetchBin = useCallback(async () => {
    if (!user || !token) return;

    try {
      const response = await fetch(
        `/api/technician/trucks/${truckId}/bins/${binId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();
      if (response.ok) {
        const mappedItems = data.inventory.map((item: any) => ({
          id: item.id,
          inventoryItemId: item.inventory_item_id,
          name: item.name,
          category: item.category,
          currentStock: item.current_stock,
          standardLevel: item.standard_level,
          unit: item.unit,
          lastRestocked: item.last_restocked,
          isLowStock: item.is_low_stock,
        }));
        setBin({ ...data, inventory: mappedItems });
        setBinItems(mappedItems);
        console.log("Response:", data);
        console.log("Mapped Items:", mappedItems);
      } else {
        console.error("Failed to fetch bin:", data.error);
        router.push(`/trucks/${truckId}`);
      }
    } catch (error) {
      console.error("Error fetching bin:", error);
      router.push(`/trucks/${truckId}`);
    }
  }, [user, token, truckId, binId, router]);

  useEffect(() => {
    fetchBin();
  }, [fetchBin]);

  const handleItemSelected = async (inventoryItem: any, quantity: number) => {
    try {
      setErrorMessage("");
      const response = await fetch(
        `/api/technician/trucks/${truckId}/bins/${binId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inventory_item_id: inventoryItem.id,
            quantity,
          }),
        }
      );
      const data = await response.json();
      console.log("POST Response:", data);
      if (response.ok) {
        await fetchBin();
      } else {
        setErrorMessage(data.error || "Failed to add item");
        console.error("Failed to add item:", data.error);
      }
    } catch (error) {
      setErrorMessage("Something went wrong while adding item");
      console.error("Error adding item:", error);
    }
  };

  const handleEditClick = (item: any) => {
    setEditingItem(item.id);
    setEditQuantity(item.currentStock);
  };

  const handleSaveEdit = async (itemId: string) => {
    try {
      setErrorMessage("");
      const response = await fetch(
        `/api/technician/trucks/${truckId}/bins/${binId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inventory_item_id: itemId,
            quantity: editQuantity,
          }),
        }
      );
      const data = await response.json();
      console.log("Edit POST Response:", data);
      if (response.ok) {
        await fetchBin();
        setEditingItem(null);
        setEditQuantity(0);
      } else {
        setErrorMessage(data.error || "Failed to update item");
        console.error("Failed to update item:", data.error);
      }
    } catch (error) {
      setErrorMessage("Something went wrong while updating item");
      console.error("Error updating item:", error);
    }
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setEditQuantity(0);
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      setErrorMessage("");
      const response = await fetch(
        `/api/technician/trucks/${truckId}/bins/${binId}?itemId=${itemId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();
      console.log("DELETE Response:", data);
      if (response.ok) {
        await fetchBin();
      } else {
        setErrorMessage(data.error || "Failed to delete item");
        console.error("Failed to delete item:", data.error);
      }
    } catch (error) {
      setErrorMessage("Something went wrong while deleting item");
      console.error("Error deleting item:", error);
    }
  };

  const handleBinUpdated = async () => {
    await fetchBin();
  };

  if (loading || !bin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  const filteredItems = binItems.filter(
    (item: any) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockItems = binItems.filter((item: any) => item.isLowStock);
  const totalItems = binItems.length;
  const maxCapacity = bin.maxCapacity ?? 10;
  const isAddDisabled = totalItems >= maxCapacity;
  const categories = [...new Set(binItems.map((item: any) => item.category))];
  const lowStockCount = lowStockItems.length;
  const lastUpdated = binItems.length > 0 ? binItems[0].lastRestocked : "Never";

  return (
    <Navigation
      title={`${bin.name} (${bin.code})`}
      subtitle={`${bin.location} • Truck #${bin.truckNumber}`}
    >
      <div className="p-4 md:p-6 space-y-6">
        {/* Error Message */}
        {errorMessage && (
          <div className="relative p-3 rounded-md bg-red-100 text-red-800 border border-red-300">
            <span>{errorMessage}</span>
            <button
              onClick={() => setErrorMessage("")}
              className="absolute right-2 top-2 text-red-600 hover:text-red-800"
            >
              ✕
            </button>
          </div>
        )}

        {/* Back Button */}
        <div className="flex items-center space-x-4">
          <Link href={`/trucks/${truckId}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Truck
            </Button>
          </Link>
        </div>

        {/* Bin Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Items
                  </p>
                  <p className="text-2xl md:text-3xl font-bold text-gray-900">
                    {totalItems} / {maxCapacity}
                  </p>
                  <p className="text-xs md:text-sm text-gray-500">
                    In this bin
                  </p>
                </div>
                <div className="p-2 md:p-3 rounded-lg bg-green-500">
                  <Package className="h-5 w-5 md:h-6 md:w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Categories
                  </p>
                  <p className="text-2xl md:text-3xl font-bold text-gray-900">
                    {categories.length}
                  </p>
                  <p className="text-xs md:text-sm text-gray-500">Item types</p>
                </div>
                <div className="p-2 md:p-3 rounded-lg bg-blue-500">
                  <Grid3X3 className="h-5 w-5 md:h-6 md:w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Low Stock</p>
                  <p className="text-2xl md:text-3xl font-bold text-gray-900">
                    {lowStockCount}
                  </p>
                  <p className="text-xs md:text-sm text-gray-500">
                    Need restock
                  </p>
                </div>
                <div className="p-2 md:p-3 rounded-lg bg-red-500">
                  <AlertTriangle className="h-5 w-5 md:h-6 md:w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Last Updated
                  </p>
                  <p className="text-lg md:text-xl font-bold text-gray-900">
                    {lastUpdated}
                  </p>
                  <p className="text-xs md:text-sm text-gray-500">Activity</p>
                </div>
                <div className="p-2 md:p-3 rounded-lg bg-purple-500">
                  <Package className="h-5 w-5 md:h-6 md:w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <SelectInventoryItemModal
                truckId={truckId}
                binId={binId}
                onItemSelected={handleItemSelected}
                isDisabled={isAddDisabled}
                maxCapacity={maxCapacity}
                currentItems={totalItems}
              />
              <Link href={`/order?truckId=${truckId}`}>
                <Button
                  variant="outline"
                  className="h-16 flex flex-col space-y-2 w-full bg-transparent"
                >
                  <ShoppingCart className="h-5 w-5" />
                  <span className="text-xs">Order Items</span>
                </Button>
              </Link>
              <Link href="/restock">
                <Button
                  variant="outline"
                  className="h-16 flex flex-col space-y-2 w-full bg-transparent"
                >
                  <RotateCcw className="h-5 w-5" />
                  <span className="text-xs">Restock</span>
                </Button>
              </Link>
              <EditBinModal
                truckId={truckId}
                bin={bin}
                onBinUpdated={handleBinUpdated}
              />
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Alert */}
        {lowStockItems.length > 0 && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-800 flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Low Stock Alert
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-700 text-sm mb-3">
                {lowStockItems.length} item{lowStockItems.length > 1 ? "s" : ""}{" "}
                below standard level:
              </p>
              <div className="flex flex-wrap gap-2">
                {lowStockItems.map((item: any) => (
                  <Badge
                    key={item.id}
                    variant="destructive"
                    className="text-xs"
                  >
                    {item.name} ({item.currentStock}/{item.standardLevel})
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Items List */}
        <div className="grid gap-4">
          {filteredItems.map((item: any) => (
            <Card
              key={item.id}
              className={`hover:shadow-lg transition-shadow ${
                item.isLowStock ? "border-red-200" : ""
              }`}
            >
              <CardContent className="p-4 md:p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
                  <div className="flex items-center space-x-4">
                    <div
                      className={`w-12 h-12 md:w-16 md:h-16 rounded-lg flex items-center justify-center ${
                        item.isLowStock ? "bg-red-100" : "bg-[#10294B]"
                      }`}
                    >
                      <Package
                        className={`h-6 w-6 md:h-8 md:w-8 ${
                          item.isLowStock ? "text-red-600" : "text-white"
                        }`}
                      />
                    </div>
                    <div>
                      <h3 className="text-lg md:text-xl font-semibold text-gray-900">
                        {item.name}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary" className="text-xs">
                          {item.category}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          ID: {item.inventoryItemId}
                        </Badge>
                        {item.isLowStock && (
                          <Badge variant="destructive" className="text-xs">
                            Below Standard
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Last restocked{" "}
                        {new Date(item.lastRestocked).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row items-start md:items-center space-y-3 md:space-y-0 md:space-x-6">
                    <div className="flex space-x-4 md:space-x-6">
                      <div className="text-center">
                        {editingItem === item.id ? (
                          <div className="flex items-center space-x-2">
                            <Input
                              type="number"
                              value={editQuantity}
                              onChange={(e) =>
                                setEditQuantity(
                                  Number.parseInt(e.target.value) || 0
                                )
                              }
                              className="w-16 h-8 text-center"
                              min="0"
                            />
                            <Button
                              size="sm"
                              onClick={() => handleSaveEdit(item.id)}
                              className="h-8 w-8 p-0 bg-green-600 hover:bg-green-700"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleCancelEdit}
                              className="h-8 w-8 p-0 bg-transparent"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <p
                              className={`text-lg md:text-xl font-bold ${
                                item.isLowStock
                                  ? "text-red-600"
                                  : "text-gray-900"
                              }`}
                            >
                              {item.currentStock}
                            </p>
                            <p className="text-xs text-gray-500">Current</p>
                          </>
                        )}
                      </div>
                      <div className="text-center">
                        <p className="text-lg md:text-xl font-bold text-blue-600">
                          {item.standardLevel}
                        </p>
                        <p className="text-xs text-gray-500">Standard</p>
                      </div>
                    </div>

                    {editingItem !== item.id && (
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditClick(item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteItem(item.id)}
                          className="text-red-600 hover:text-red-700 bg-transparent"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Stock Level Progress Bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Stock Level vs Standard</span>
                    <span>
                      {item.currentStock} / {item.standardLevel} {item.unit}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        item.isLowStock ? "bg-red-500" : "bg-green-500"
                      }`}
                      style={{
                        width: `${Math.min(
                          (item.currentStock / item.standardLevel) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No items found
              </h3>
              <p className="text-gray-500">
                Try adjusting your search terms or add items from inventory.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </Navigation>
  );
}
