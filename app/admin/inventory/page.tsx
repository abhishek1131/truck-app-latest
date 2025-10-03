"use client";

import { useAuth } from "@/components/auth-provider";
import { Navigation } from "@/components/layout/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Package, Search, Plus, Edit, Trash2, Eye, Calendar, Truck } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchClient } from "@/lib/fetchClient";
import { InventoryItemDetailsModal } from "@/components/inventory-item-details-modal";
import { EditInventoryItemModal } from "@/components/EditInventoryModal";

interface InventoryItem {
  id: string;
  internalId: string;
  part_number: string;
  name: string;
  description: string;
  category: string;
  createdByName: string;
  unit_price: number;
  cost_price: number;
  stock_quantity: number;
  min_stock_level: number;
  created_at: string;
  updated_at: string;
}

interface InventoryStats {
  totalItems: number;
  lowStockItems: number;
  outOfStockItems: number;
  totalValue: number;
}

interface Technician {
  id: string;
  first_name: string;
  last_name: string;
  company_name?: string;
  email: string;
}

interface TechniciansResponse {
  success: boolean;
  data?: {
    users: Technician[];
  };
  error?: string;
}

export default function AdminInventoryPage() {
  const { user, loading, token } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [technicianFilter, setTechnicianFilter] = useState("all");
  const [errorMessage, setErrorMessage] = useState("");
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [stats, setStats] = useState<InventoryStats>({
    totalItems: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    totalValue: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedItemForEdit, setSelectedItemForEdit] = useState<InventoryItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

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
  ];

  useEffect(() => {
    if (!loading && (!user || (user.role !== "super_admin" && user.role !== "company_admin"))) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && (user.role === "super_admin" || user.role === "company_admin")) {
      fetchTechnicians();
      fetchInventory();
    }
  }, [user, currentPage, searchTerm, categoryFilter, technicianFilter]);

  // Handle item parameter from URL
  useEffect(() => {
    const itemId = searchParams.get('item');
    if (itemId && inventoryItems.length > 0) {
      const item = inventoryItems.find(item => item.internalId === itemId);
      if (item) {
        setSelectedItemForEdit(item);
        setIsEditModalOpen(true);
      }
    }
  }, [searchParams, inventoryItems]);

  const fetchTechnicians = async () => {
    try {
      // For super_admin: fetch company_admin users
      // For company_admin: fetch technician users
      const role = user?.role === "super_admin" ? "super_company_admin" : "technician";
      const response = await fetchClient(`/api/admin/users?role=${role}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result: TechniciansResponse = await response.json();

      if (result.success && result.data) {
        setTechnicians(result.data.users);
      } else {
        console.error("Failed to fetch users:", result.error);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  const fetchInventory = async () => {
    if (!user || !token) return;

    console.log("Fetching inventory for user:", user.role, "Token:", !!token);
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "20",
        ...(searchTerm && { searchText: searchTerm }),
        ...(categoryFilter && categoryFilter !== "all" && { category: categoryFilter }),
        ...(technicianFilter && technicianFilter !== "all" && { technician: technicianFilter }),
      });

      const url = `/api/admin/inventory?${params}`;
      console.log("API URL:", url);
      
      const response = await fetchClient(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("Response status:", response.status);
      const data = await response.json();
      console.log("API Response:", data); // Debug log
      
      if (response.ok) {
        // Map API response to UI format
        const items = data.inventoryItems || [];
        const mappedItems = items.map((item: any) => ({
          id: item.id || item.internalId,
          internalId: item.internalId,
          part_number: item.partNumber || item.id,
          name: item.name,
          description: item.notes || "",
          category: item.category,
          unit_price: item.unitPrice || 0,
          cost_price: item.costPrice || 0,
          stock_quantity: item.totalQuantity || 0,
          min_stock_level: item.lowStockThreshold || 0,
          createdByName: item.createdByName,
          created_at: item.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));
        
        setInventoryItems(mappedItems);
        setTotalItems(data.pagination?.totalItems || 0);
        setTotalPages(data.pagination?.totalPages || 1);
        
        // Use stats from API response
        setStats({
          totalItems: data.stats?.totalItems || 0,
          lowStockItems: data.stats?.lowStockItems || 0,
          outOfStockItems: data.stats?.needsRestockItems || 0,
          totalValue: mappedItems.reduce((sum: number, item: any) => sum + (item.unit_price * item.stock_quantity), 0),
        });
      } else {
        setErrorMessage(data.error || "Failed to fetch inventory");
      }
    } catch (error) {
      console.error("Inventory fetch error:", error);
      setErrorMessage("An error occurred while fetching inventory");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleCategoryFilter = (value: string) => {
    setCategoryFilter(value);
    setCurrentPage(1);
  };

  const handleTechnicianFilter = (value: string) => {
    setTechnicianFilter(value);
    setCurrentPage(1);
  };

  const getStockStatus = (item: InventoryItem) => {
    if (item.stock_quantity === 0) return { status: "out", color: "bg-red-100 text-red-800" };
    if (item.stock_quantity <= item.min_stock_level) return { status: "low", color: "bg-yellow-100 text-yellow-800" };
    return { status: "good", color: "bg-green-100 text-green-800" };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
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
        // Refresh the inventory data
        await fetchInventory();
        setErrorMessage("");
        setSelectedItemForEdit(null);
        setIsEditModalOpen(false);
      } else {
        setErrorMessage(data.error || "Failed to update item");
      }
    } catch (error) {
      console.error("Update error:", error);
      setErrorMessage("An error occurred while updating the item");
    }
  };

  const handleCloseEditModal = () => {
    setSelectedItemForEdit(null);
    setIsEditModalOpen(false);
    // Remove item parameter from URL
    const url = new URL(window.location.href);
    url.searchParams.delete('item');
    router.replace(url.pathname + url.search);
  };

  const handleModalOpenChange = (open: boolean) => {
    setIsEditModalOpen(open);
    if (!open) {
      // Modal is being closed, clean up URL and state
      setSelectedItemForEdit(null);
      const url = new URL(window.location.href);
      url.searchParams.delete('item');
      router.replace(url.pathname + url.search);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E3253D] mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading inventory...</p>
        </div>
      </div>
    );
  }

  if (!user || (user.role !== "super_admin" && user.role !== "company_admin")) {
    return null;
  }

  return (
    <Navigation
      title="Inventory Management"
      subtitle="Manage and monitor inventory across all technicians"
    >
      <div className="p-4 md:p-6 space-y-6">
        {errorMessage && (
          <div className="bg-red-100 text-red-800 p-4 rounded-lg">{errorMessage}</div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Total Item Types</p>
                  <p className="text-2xl font-bold">{totalItems}</p>
                  <p className="text-xs opacity-75">{stats.totalItems} Total Items</p>
                </div>
                <Package className="h-8 w-8 opacity-80" />
              </div>
            </CardContent>
          </Card>
          
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
                  <p className="text-2xl font-bold">{stats.outOfStockItems}</p>
                </div>
                <Package className="h-8 w-8 opacity-80" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search inventory items..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <Select
                  value={categoryFilter}
                  onValueChange={handleCategoryFilter}
                >
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {defaultCategories.map((category: string, index: number) => (
                      <SelectItem key={`${category}-${index}`} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={technicianFilter}
                  onValueChange={handleTechnicianFilter}
                  disabled={isLoading}
                >
                  <SelectTrigger className="w-full sm:w-48 text-sm">
                    <SelectValue placeholder={user?.role === "super_admin" ? "Filter by company" : "Filter by technician"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {user?.role === "super_admin" ? "All Companies" : "All Technicians"}
                    </SelectItem>
                    {technicians.map((technician) => (
                      <SelectItem key={technician.id} value={technician.id}>
                        {user?.role === "super_admin" 
                          ? `${technician.first_name} ${technician.last_name} (${technician?.role === "super_admin" ? "Super Admin" : technician.company_name || 'No Company'})`
                          : `${technician.first_name} ${technician.last_name}`
                        }
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
            inventoryItems.map((item: any, index: number) => (
              <Card
                key={`${item.id || 'item'}-${index}`}
                className="hover:shadow-lg transition-shadow"
              >
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                    {/* Left section */}
                    <div className="flex items-start lg:items-center gap-4 lg:gap-6 w-full lg:w-auto">
                      <div className="w-16 h-16 lg:w-20 lg:h-20 bg-[#10294B] rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0">
                        <Package className="h-8 w-8 lg:h-10 lg:w-10" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg lg:text-xl font-semibold text-[#10294B] truncate">
                          {item.name}
                        </h3>
                        <p className="text-gray-600 text-sm lg:text-base truncate">
                          Created By: {item.createdByName}
                        </p>
                        <p className="text-gray-500 text-sm lg:text-base truncate">
                          {item.description}
                        </p>
                        <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-2 sm:gap-4 mt-2 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Package className="h-4 w-4" />
                            Current: {item.stock_quantity} pieces
                          </span>
                          <span className="flex items-center gap-1">
                            <Package className="h-4 w-4" />
                            Low Stock: {item.min_stock_level} pieces
                          </span>
                          <span className="flex items-center gap-1">
                            <Package className="h-4 w-4" />
                            Price: {formatCurrency(item.cost_price)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right section */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full lg:w-auto">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 text-xs">
                          {item.category}
                        </Badge>
                        {item.stock_quantity === 0 && (
                          <Badge className="bg-red-100 text-red-800 text-xs">Out of Stock</Badge>
                        )}
                        {item.stock_quantity > 0 && item.stock_quantity <= item.min_stock_level && (
                          <Badge className="bg-yellow-100 text-yellow-800 text-xs">Low Stock</Badge>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2 sm:ml-auto">
                        <InventoryItemDetailsModal item={item} hideOrderButton={true}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs sm:text-sm"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            <span className="hidden sm:inline">View Details</span>
                            <span className="sm:hidden">View</span>
                          </Button>
                        </InventoryItemDetailsModal>
                        <EditInventoryItemModal
                          item={item}
                          onItemUpdated={handleItemUpdated}
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
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  {/* Pagination Controls */}
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="text-xs sm:text-sm"
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
                            onClick={() => setCurrentPage(pageNum)}
                            disabled={isLoading}
                            className="w-8 h-8 p-0 text-xs sm:text-sm"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="text-xs sm:text-sm"
                    >
                      Next
                    </Button>
                  </div>
                  
                  {/* Pagination Info */}
                  <div className="text-xs sm:text-sm text-gray-500 text-center sm:text-right">
                    <div className="block sm:hidden">
                      Page {currentPage} of {totalPages}
                    </div>
                    <div className="hidden sm:block">
                      Page {currentPage} of {totalPages} • {totalItems} total items
                    </div>
                    <div className="block sm:hidden text-xs text-gray-400 mt-1">
                      {totalItems} total items
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {inventoryItems.length === 0 && !isLoading && (
          <Card>
            <CardContent className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                No items found
              </h3>
              <p className="text-gray-500">
                {user.role === "company_admin" 
                  ? "No technicians or inventory items found for your company"
                  : "No inventory items found in the system"
                }
              </p>
            </CardContent>
          </Card>
        )}

        {/* Edit Modal for URL parameter */}
        {selectedItemForEdit && (
          <EditInventoryItemModal
            item={selectedItemForEdit}
            onItemUpdated={handleItemUpdated}
            open={isEditModalOpen}
            onOpenChange={handleModalOpenChange}
          />
        )}
      </div>
    </Navigation>
  );
}
