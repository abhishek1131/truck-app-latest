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

import {
  Truck,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  UserPlus,
  MapPin,
  Package,
  AlertTriangle,
  Users,
  Settings,
  Trash2,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { EditTruckDialog } from "@/components/edit-truck-modal";
import { AssignTruckDialog } from "@/components/assign-truck-modal";
import { CreateTruckDialog } from "@/components/create-truck-modal";

interface Truck {
  id: string;
  truck_number: string;
  location: string | null;
  status: "active" | "maintenance" | "inactive";
  totalItems: number;
  lowStockItems: number;
  bins: number;
  lastUpdated: string;
  assigned_technician: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  model: string;
  year: number;
  license_plate: string;
  mileage: number;
  next_maintenance: string | null;
}

interface Technician {
  id: string;
  name: string;
  email: string;
  status: string;
  assignedTrucks: string[];
}

const statusConfig = {
  active: { color: "bg-green-100 text-green-800", label: "Active" },
  maintenance: { color: "bg-orange-100 text-orange-800", label: "Maintenance" },
  inactive: { color: "bg-red-100 text-red-800", label: "Inactive" },
};

export default function AdminTrucksPage() {
  const { user, token } = useAuth();
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [assignmentFilter, setAssignmentFilter] = useState("all");
  const [selectedTruck, setSelectedTruck] = useState<Truck | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [technicianError, setTechnicianError] = useState<string | null>(null);
  const [dropdownKey, setDropdownKey] = useState(0); // To force re-render of DropdownMenu

  useEffect(() => {
    const fetchTrucks = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/admin/trucks?page=1&limit=10", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const result = await response.json();
        if (result.success) {
          setTrucks(result.data.trucks);
        } else {
          console.error("Failed to fetch trucks:", result.error);
        }
      } catch (error) {
        console.error("Error fetching trucks:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchTechnicians = async () => {
      try {
        const response = await fetch("/api/admin/users?page=1&limit=50", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error("Failed to fetch technicians");
        }
        const data = await response.json();
        const filteredTechnicians: Technician[] = data.data.users
          .filter(
            (user: any) =>
              user.role === "technician" && user.status === "active"
          )
          .map((user: any) => ({
            id: user.id,
            name: `${user.first_name} ${user.last_name}`.trim(),
            email: user.email,
            status: user.status,
            assignedTrucks: user.assigned_trucks || [],
          }));
        setTechnicians(filteredTechnicians);
        setTechnicianError(null);
      } catch (error) {
        setTechnicianError("Error fetching technicians. Please try again.");
        console.error("Error fetching technicians:", error);
      }
    };

    if (token) {
      fetchTrucks();
      fetchTechnicians();
    }
  }, [token]);

  const filteredTrucks = trucks.filter((truck) => {
    const matchesSearch =
      truck.truck_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (truck.location &&
        truck.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (truck.assigned_technician &&
        `${truck.assigned_technician.first_name} ${truck.assigned_technician.last_name}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase())) ||
      truck.license_plate.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || truck.status === statusFilter;
    const matchesAssignment =
      assignmentFilter === "all" ||
      (assignmentFilter === "assigned" && truck.assigned_technician) ||
      (assignmentFilter === "unassigned" && !truck.assigned_technician);
    return matchesSearch && matchesStatus && matchesAssignment;
  });

  const totalTrucks = trucks.length;
  const activeTrucks = trucks.filter(
    (truck) => truck.status === "active"
  ).length;
  const inactiveTrucks = trucks.filter(
    (truck) => truck.status === "inactive"
  ).length;
  const maintenanceTrucks = trucks.filter(
    (truck) => truck.status === "maintenance"
  ).length;
  const totalItems = trucks.reduce((sum, truck) => sum + truck.totalItems, 0);
  const totalLowStock = trucks.reduce(
    (sum, truck) => sum + truck.lowStockItems,
    0
  );

  const handleCreateTruck = async (truckData: any) => {
    try {
      const response = await fetch("/api/admin/trucks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(truckData),
      });
      const result = await response.json();
      if (result.success) {
        setTrucks([
          ...trucks,
          {
            ...result.data,
            totalItems: 0,
            lowStockItems: 0,
            bins: 0,
            lastUpdated: result.data.updated_at
              ? new Date(result.data.updated_at).toLocaleString()
              : "Never",
            assigned_technician: result.data.technician_id
              ? {
                  id: result.data.technician_id,
                  first_name: result.data.first_name,
                  last_name: result.data.last_name,
                  email: result.data.email,
                }
              : null,
          },
        ]);
        setShowCreateDialog(false);
      } else {
        console.error("Failed to create truck:", result.error);
      }
    } catch (error) {
      console.error("Error creating truck:", error);
    }
  };

  const handleAssignTruck = useCallback((truck: Truck) => {
    setSelectedTruck({
      ...truck,
      name: truck.truck_number,
      assignedTechnician: truck.assigned_technician
        ? `${truck.assigned_technician.first_name} ${truck.assigned_technician.last_name}`
        : null,
      technicianId: truck.assigned_technician
        ? truck.assigned_technician.id
        : null,
    });
    setShowAssignDialog(true);
    setDropdownKey((prev) => prev + 1); // Reset DropdownMenu
  }, []);

  const handleEditTruck = useCallback((truck: Truck) => {
    setSelectedTruck({
      ...truck,
      name: truck.truck_number,
      licensePlate: truck.license_plate,
    });
    setShowEditDialog(true);
    setDropdownKey((prev) => prev + 1); // Reset DropdownMenu
  }, []);

  const handleDeleteTruck = async (truck: Truck) => {
    try {
      const response = await fetch(`/api/admin/trucks/${truck.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const result = await response.json();
      if (result.success) {
        setTrucks(trucks.filter((t) => t.id !== truck.id));
      } else {
        console.error("Failed to delete truck:", result.error);
      }
    } catch (error) {
      console.error("Error deleting truck:", error);
    }
    setDropdownKey((prev) => prev + 1); // Reset DropdownMenu
  };

  const handleDialogClose = useCallback(() => {
    setShowAssignDialog(false);
    setShowEditDialog(false);
    setShowCreateDialog(false);
    setSelectedTruck(null);
    setDropdownKey((prev) => prev + 1); // Reset DropdownMenu
  }, []);

  const handleTruckUpdate = useCallback((updated: Partial<Truck>) => {
    setTrucks((prev) =>
      prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t))
    );
  }, []);

  return (
    <Navigation
      title="Fleet Management"
      subtitle="Manage trucks, assignments, and fleet operations"
    >
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-end mb-6">
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="bg-[#E3253D] hover:bg-[#E3253D]/90 text-white shadow-lg"
          >
            <Truck className="h-4 w-4 mr-2" />
            Add New Truck
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <Card className="bg-gradient-to-br from-[#10294B] to-[#006AA1] text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">
                Total Fleet
              </CardTitle>
              <Truck className="h-4 w-4 opacity-90" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalTrucks}</div>
              <p className="text-xs opacity-75">{activeTrucks} active</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">
                Inactive
              </CardTitle>
              <Package className="h-4 w-4 opacity-90" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inactiveTrucks}</div>
              <p className="text-xs opacity-75">Available for assignment</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">
                Maintenance
              </CardTitle>
              <Settings className="h-4 w-4 opacity-90" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{maintenanceTrucks}</div>
              <p className="text-xs opacity-75">In service</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-[#E3253D] to-red-600 text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">
                Low Stock Items
              </CardTitle>
              <AlertTriangle className="h-4 w-4 opacity-90" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalLowStock}</div>
              <p className="text-xs opacity-75">Across all trucks</p>
            </CardContent>
          </Card>
        </div>

        {/* Technician Fetch Error */}
        {technicianError && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4 text-red-600">
              {technicianError}
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search by truck number, location, technician, or license plate..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={assignmentFilter}
                onValueChange={setAssignmentFilter}
              >
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by assignment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Trucks</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Trucks List */}
        {isLoading ? (
          <Card className="border-0 shadow-lg">
            <CardContent className="text-center py-12">
              <p className="text-gray-500">Loading trucks...</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredTrucks.map((truck) => (
              <Card
                key={truck.id}
                className="border-0 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-[#10294B] rounded-full flex items-center justify-center text-white font-bold">
                            <Truck className="h-6 w-6" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-[#10294B]">
                              {truck.truck_number}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {truck.model} ({truck.year})
                            </p>
                            <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {truck.location || "Unspecified"}
                              </span>
                              <span>{truck.license_plate}</span>
                              <span>
                                {truck.mileage.toLocaleString()} miles
                              </span>
                            </div>
                            {truck.assigned_technician && (
                              <div className="flex items-center gap-1 text-sm text-blue-600 mt-1">
                                <Users className="h-3 w-3" />
                                Assigned to:{" "}
                                {truck.assigned_technician.first_name}{" "}
                                {truck.assigned_technician.last_name}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            className={
                              statusConfig[
                                truck.status as keyof typeof statusConfig
                              ]?.color
                            }
                          >
                            {
                              statusConfig[
                                truck.status as keyof typeof statusConfig
                              ]?.label
                            }
                          </Badge>
                          {!truck.assigned_technician && (
                            <Badge
                              variant="outline"
                              className="text-orange-600 border-orange-600"
                            >
                              Unassigned
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-3 border-t border-gray-100">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">
                            Total Items
                          </div>
                          <div className="font-semibold">
                            {truck.totalItems}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">
                            Storage Bins
                          </div>
                          <div className="font-semibold">{truck.bins}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">
                            Low Stock
                          </div>
                          <div
                            className={`font-semibold ${
                              truck.lowStockItems > 0
                                ? "text-red-600"
                                : "text-green-600"
                            }`}
                          >
                            {truck.lowStockItems}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">
                            Next Maintenance
                          </div>
                          <div className="font-semibold text-xs">
                            {truck.next_maintenance || "Not scheduled"}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">
                            Last Updated
                          </div>
                          <div className="font-semibold text-xs">
                            {truck.lastUpdated}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 lg:ml-6">
                      <DropdownMenu key={dropdownKey}>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/trucks/${truck.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleEditTruck(truck)}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Truck
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleAssignTruck(truck)}
                          >
                            <UserPlus className="mr-2 h-4 w-4" />
                            {truck.assigned_technician
                              ? "Reassign"
                              : "Assign"}{" "}
                            Technician
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDeleteTruck(truck)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Truck
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {filteredTrucks.length === 0 && !isLoading && (
          <Card className="border-0 shadow-lg">
            <CardContent className="text-center py-12">
              <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                No trucks found
              </h3>
              <p className="text-gray-500 mb-6">
                Try adjusting your search or filter criteria
              </p>
              <Button
                onClick={() => setShowCreateDialog(true)}
                className="bg-[#E3253D] hover:bg-[#E3253D]/90"
              >
                <Truck className="h-4 w-4 mr-2" />
                Add New Truck
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Dialogs */}
        <CreateTruckDialog
          isOpen={showCreateDialog}
          onClose={handleDialogClose}
          onTruckCreated={handleCreateTruck}
        />

        {selectedTruck && (
          <>
            <AssignTruckDialog
              isOpen={showAssignDialog}
              onClose={handleDialogClose}
              truck={selectedTruck}
              technicians={technicians}
              onAssignSuccess={handleTruckUpdate}
            />
            <EditTruckDialog
              isOpen={showEditDialog}
              onClose={handleDialogClose}
              truck={selectedTruck}
            />
          </>
        )}
      </div>
    </Navigation>
  );
}
