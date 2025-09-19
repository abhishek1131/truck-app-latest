"use client";

import { useAuth } from "@/components/auth-provider";
import { Navigation } from "@/components/layout/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Package, Search, Calendar, Truck, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { InventoryItemDetailsModal } from "@/components/inventory-item-details-modal";
import { AddInventoryItemModal } from "@/components/add-inventory-item-modal";
import { EditInventoryItemModal } from "@/components/EditInventoryModal";
import { fetchClient } from "@/lib/fetchClient";

export default function InventoryPage() {
  const { user, loading, token } = useAuth();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [errorMessage, setErrorMessage] = useState("");
  const [totalItemType, settotalItemType] = useState(0);
  const [inventoryData, setInventoryData] = useState({
    inventoryItems: [],
    stats: {
      totalItems: 0,
      assignedItem: 0,
      lowStockItems: 0,
      needsRestockItems: 0,
    },
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const defaultCategories = [
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
  // Categories state
  const [categories, setCategories] = useState<string[]>(defaultCategories);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const fetchInventory = async (page: number = 1, searchText: string = "", category: string = "") => {
    if (!user || !token) return;

    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(searchText && { searchText }),
        ...(category && category !== "all" && { category }),
      });

      const response = await fetchClient(`/api/inventory?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setInventoryData(data);
        settotalItemType(data?.inventoryItems?.length);

        // Update pagination state
        if (data.pagination) {
          setCurrentPage(data.pagination.currentPage);
          setTotalPages(data.pagination.totalPages);
          setTotalItems(data.pagination.totalItems);
          setHasNextPage(data.pagination.hasNextPage);
          setHasPreviousPage(data.pagination.hasPreviousPage);
        }
      } else {
        console.error("Failed to fetch inventory:", data.error);
      }
    } catch (error) {
      console.error("Error fetching inventory:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [user, token]);

  // Debounced search effect
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchTerm || categoryFilter !== "all") {
        setCurrentPage(1); // Reset to first page when searching
        fetchInventory(1, searchTerm, categoryFilter);
      } else {
        fetchInventory(1);
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm, categoryFilter]);

  const handleItemAdded = async (newItem: any) => {
    try {
      setErrorMessage("");
      const response = await fetchClient("/api/inventory/add", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newItem),
      });
      const data = await response.json();
      if (response.ok) {
        fetchInventory(currentPage, searchTerm, categoryFilter);
      } else {
        setErrorMessage(data.error || "Failed to add item");
        console.error("Failed to add item:", data.error);
      }
    } catch (error) {
      setErrorMessage("Something went wrong while adding item");
      console.error("Error adding item:", error);
    }
  };

  // Pagination handlers
  const handlePreviousPage = () => {
    if (hasPreviousPage && currentPage > 1) {
      fetchInventory(currentPage - 1, searchTerm, categoryFilter);
    }
  };

  const handleNextPage = () => {
    if (hasNextPage && currentPage < totalPages) {
      fetchInventory(currentPage + 1, searchTerm, categoryFilter);
    }
  };

  const handlePageClick = (page: number) => {
    if (page !== currentPage && page >= 1 && page <= totalPages) {
      fetchInventory(page, searchTerm, categoryFilter);
    }
  };

  const handleItemUpdated = async (updatedItem: any) => {
    try {
      const response = await fetchClient(`/api/inventory/update-item`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: updatedItem.internalId,
          name: updatedItem.name,
          category: updatedItem.category,
          unit: updatedItem.unit,
          partNumber: updatedItem.partNumber,
          brand: updatedItem.brand,
          cost_price: updatedItem.cost_price,
          notes: updatedItem.notes,
          standardLevel: updatedItem.standardLevel,
          lowStockThreshold: updatedItem.lowStockThreshold,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        fetchInventory(currentPage, searchTerm, categoryFilter);
      } else {
        setErrorMessage(data.error || "Failed to add item");
        console.error("Failed to add item:", data.error);
      }
    } catch (error) {
      console.error("Error updating item:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const { inventoryItems, stats } = inventoryData;
  // No need for client-side filtering since API handles it
  const filteredItems = inventoryItems;

  return (
    <Navigation
      title="Inventory"
      subtitle="Manage your inventory across all trucks"
    >
      <div className="p-4 md:p-6">
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-[#10294B] to-[#006AA1] text-white border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90">Total Items</p>
                    <p className="text-2xl font-bold">{stats.totalItems}</p>
                  </div>
                  <Package className="h-8 w-8 opacity-80" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90">Total Item Types</p>
                    <p className="text-2xl font-bold">{totalItems}</p>
                    <p className="text-xs opacity-75">{stats.assignedItem} Assigned Items</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-[#E3253D] to-red-600 text-white border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90">Low Stock</p>
                    <p className="text-2xl font-bold">{stats.lowStockItems}</p>
                  </div>
                  <Package className="h-8 w-8 opacity-80" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90">Needs Restock</p>
                    <p className="text-2xl font-bold">
                      {stats.needsRestockItems}
                    </p>
                  </div>
                  <Package className="h-8 w-8 opacity-80" />
                </div>
              </CardContent>
            </Card>
          </div>

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
          {/* Add New Item Section */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Plus className="h-5 w-5 text-[#10294B]" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      Add New Inventory Item
                    </h3>
                  </div>
                  <p className="text-gray-600 text-sm">
                    Add new items to your inventory catalog with standard levels
                    and stock thresholds.
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <AddInventoryItemModal onItemAdded={handleItemAdded} categories={categories} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search inventory items..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select
                  value={categoryFilter}
                  onValueChange={setCategoryFilter}
                >
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category: string) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Inventory List */}
          <div className="space-y-4">
            {isLoading ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#10294B]"></div>
                    <span className="ml-2 text-gray-600">Loading inventory...</span>
                  </div>
                </CardContent>
              </Card>
            ) : (
              filteredItems.map((item: any) => (
                <Card
                  key={item.id}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-4">
                      {/* Left section */}
                      <div className="flex items-start md:items-center gap-4 md:gap-6">
                        <div className="w-16 h-16 md:w-20 md:h-20 bg-[#10294B] rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0">
                          <Package className="h-8 w-8 md:h-10 md:w-10" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg sm:text-xl font-semibold text-[#10294B] truncate">
                            {item.name}
                          </h3>
                          <p className="text-gray-600 text-sm sm:text-base truncate">
                            ID: {item.id}
                          </p>
                          <p className="text-gray-500 text-sm sm:text-base truncate">
                            {item.notes}
                          </p>
                          <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Package className="h-4 w-4" />
                              Current: {item.totalQuantity} {item.unit}
                            </span>
                            <span className="flex items-center gap-1">
                              <Package className="h-4 w-4" />
                              Low Stock Threshold: {item.lowStockThreshold} {item.unit}
                            </span>
                            <span className="flex items-center gap-1">
                              <Package className="h-4 w-4" />
                              Standard: {item.standardLevel} {item.unit}
                            </span>
                            <span className="flex items-center gap-1">
                              <Truck className="h-4 w-4" />
                              {item.trucks.length} trucks
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              Last ordered: {item.lastOrdered}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right section */}
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2 md:mt-0 w-full md:w-auto">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                          {item.category}
                        </Badge>
                        {item.assigned && Number(item.totalQuantity) < item.lowStockThreshold && (
                          <Badge className="bg-red-100 text-red-800">Low Stock</Badge>
                        )}
                        {item.assigned && Number(item.totalQuantity) < item.standardLevel && (
                          <Badge className="bg-orange-100 text-orange-800">Needs Restock</Badge>
                        )}

                        {/* View Details chip aligned right */}
                        <div className="ml-auto flex gap-2">
                          <InventoryItemDetailsModal item={item}>
                            <Button
                              variant="outline"
                              size="sm"
                            >
                              View Details
                            </Button>
                          </InventoryItemDetailsModal>
                          <EditInventoryItemModal
                            item={item}
                            onItemUpdated={(updatedItem) =>
                              handleItemUpdated(updatedItem) // You’ll implement this
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && !isLoading && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePreviousPage}
                        disabled={!hasPreviousPage || isLoading}
                      >
                        Previous
                      </Button>
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }

                          return (
                            <Button
                              key={pageNum}
                              variant={currentPage === pageNum ? "default" : "outline"}
                              size="sm"
                              onClick={() => handlePageClick(pageNum)}
                              disabled={isLoading}
                              className="w-8 h-8 p-0"
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleNextPage}
                        disabled={!hasNextPage || isLoading}
                      >
                        Next
                      </Button>
                    </div>
                    <div className="text-sm text-gray-500">
                      Page {currentPage} of {totalPages} • {totalItems} total items
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          {filteredItems.length === 0 && !isLoading && (
            <Card>
              <CardContent className="text-center py-12">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                  No items found
                </h3>
                <p className="text-gray-500">
                  Try adjusting your search or filter criteria
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Navigation>
  );
}
