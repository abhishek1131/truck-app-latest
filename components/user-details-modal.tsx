"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth-provider";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  User,
  Truck,
  ShoppingCart,
  Calendar,
  Package,
  CheckCircle,
  Clock,
  Mail,
  Phone,
} from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";

interface UserDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
    role: "admin" | "manager" | "technician";
    status: "active" | "inactive" | "pending" | "suspended";
    created_at: string;
    updated_at: string | null;
    assigned_trucks: {
      id: string;
      truck_number: string;
      make: string;
      model: string;
    }[];
  };
}

interface Truck {
  id: string;
  truck_number: string;
  make: string;
  model: string;
  status: "active" | "maintenance";
  location: string;
}

interface Order {
  id: string;
  orderId: string;
  date: string;
  truckId: string;
  truckName: string;
  technician: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    role: string;
  };
  items: Array<{
    id: string;
    inventoryItemId: string;
    inventoryItem: {
      id: string;
      name: string;
      unit: string;
      category: string;
      supplier: string;
      description: string;
      part_number: string;
      standard_level: number;
      low_stock_threshold: number;
    };
    requestedQuantity: number;
    truckId: string;
    truckName: string;
    binId: string | null;
    binName: string | null;
    currentStock: number | null;
    reason: string;
  }>;
  totalItems: number;
  status: "completed" | "shipped" | "pending" | "processing";
}

const statusConfig = {
  active: { color: "bg-green-100 text-green-800", label: "Active" },
  inactive: { color: "bg-red-100 text-red-800", label: "Inactive" },
  pending: { color: "bg-yellow-100 text-yellow-800", label: "Pending" },
  suspended: { color: "bg-gray-100 text-gray-800", label: "Suspended" },
  maintenance: { color: "bg-yellow-100 text-yellow-800", label: "Maintenance" },
  completed: { color: "bg-green-100 text-green-800", label: "Completed", icon: CheckCircle },
  shipped: { color: "bg-purple-100 text-purple-800", label: "Shipped", icon: Package },
  processing: { color: "bg-blue-100 text-blue-800", label: "Processing", icon: Clock },
};

const roleConfig = {
  super_admin: { color: "bg-red-100 text-red-800", label: "Super Admin" },
  company_admin: { color: "bg-purple-100 text-purple-800", label: "Company Admin" },
  technician: { color: "bg-green-100 text-green-800", label: "Technician" },
};

const allTabs = [
  { id: "overview", label: "Overview" },
  { id: "trucks", label: "Assigned Trucks" },
  { id: "orders", label: "Order History" },
];

export function UserDetailsModal({
  isOpen,
  onClose,
  user,
}: UserDetailsModalProps) {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Show tabs based on user role
  const tabs = user.role === "technician" ? allTabs : [allTabs[0]]; // Only Overview for non-technicians

  useEffect(() => {
    const fetchData = async () => {
      if (!token) {
        setError("Authentication required.");
        return;
      }
      setIsLoading(true);
      try {
        // Only fetch trucks and orders for technicians
        if (user.role === "technician") {
          // Fetch trucks (already included in user.assigned_trucks)
          setTrucks(
            user.assigned_trucks.map((truck) => ({
              ...truck,
              status: "active" as const,
              location: "Unknown",
            }))
          );

          // Fetch orders from /api/orders/previous endpoint
          const orderResponse = await fetch(`/api/orders/previous?page=1&limit=50&userId=${user.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const orderResult = await orderResponse.json();        
          console.log("API Response:", orderResult);
          
          // Handle the /api/orders/previous response structure
          if (orderResult.previousOrders) {
            setOrders(orderResult.previousOrders);
          } else {
            setError(orderResult.error || "Failed to fetch orders.");
          }
        } else {
          // For non-technicians, clear trucks and orders
          setTrucks([]);
          setOrders([]);
        }
      } catch (error) {
        setError("Error fetching data.");
        console.error("Fetch error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      fetchData();
    }
  }, [isOpen, user.id, token, user.assigned_trucks, user.role]);
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto sm:max-w-[90%] sm:max-h-[85vh] p-0 sm:p-6">
        <DialogHeader className="px-4 sm:px-0 pt-4 sm:pt-0">
          <DialogTitle className="text-lg sm:text-xl font-bold text-[#10294B]">
            <span className="truncate">User Details - {user.first_name} {user.last_name}</span>
          </DialogTitle>
          <DialogDescription className="text-sm">
            Complete information about this user
          </DialogDescription>
        </DialogHeader>

        {/* {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )} */}

        <div className="space-y-4 sm:space-y-6 px-4 sm:px-0">
          <div className="flex flex-col sm:flex-row items-center gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#10294B] rounded-full flex items-center justify-center text-white font-bold text-lg sm:text-xl">
              {user.first_name[0]}
              {user.last_name[0]}
            </div>
            <div className="flex-1 text-center sm:text-left min-w-0">
              <h3 className="text-lg sm:text-xl font-semibold text-[#10294B] truncate">
                {user.first_name} {user.last_name}
              </h3>
              <div className="flex flex-col sm:flex-row items-center gap-2 text-xs sm:text-sm text-gray-500 mt-1">
                <span className="flex items-center gap-1 truncate">
                  <Mail className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{user.email}</span>
                </span>
                {user.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3 flex-shrink-0" />
                    {user.phone}
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Badge
                className={`${statusConfig[user.status as keyof typeof statusConfig]?.color} text-xs`}
              >
                {statusConfig[user.status as keyof typeof statusConfig]?.label}
              </Badge>
              <Badge 
                className={`${roleConfig[user.role as keyof typeof roleConfig]?.color} text-xs`}
              >
                {roleConfig[user.role as keyof typeof roleConfig]?.label}
              </Badge>
            </div>
          </div>

          <div className="w-full">
            <div className="flex border-b border-gray-200 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? "border-[#E3253D] text-[#E3253D]"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="min-h-[300px]">
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : (
              <>
                {activeTab === "overview" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <User className="h-5 w-5" />
                          User Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <span className="text-sm font-medium text-gray-600">
                            User ID:
                          </span>
                          <p className="font-semibold">{user.id}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-600">
                            Join Date:
                          </span>
                          <p className="font-semibold">
                            {new Date(user.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-600">
                            Last Active:
                          </span>
                          <p className="font-semibold">
                            {user.updated_at
                              ? new Date(user.updated_at).toLocaleDateString()
                              : "Never"}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-600">
                            Role:
                          </span>
                          <p className="font-semibold">
                            {roleConfig[user.role as keyof typeof roleConfig]?.label}
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <ShoppingCart className="h-5 w-5" />
                          Activity Summary
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <span className="text-sm font-medium text-gray-600">
                            Total Orders:
                          </span>
                          <p className="font-semibold text-2xl text-green-600">
                            {orders.length}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-600">
                            Assigned Trucks:
                          </span>
                          <p className="font-semibold text-2xl text-blue-600">
                            {trucks.length}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-600">
                            Total Items:
                          </span>
                          {orders.length > 0 ? (
                            <p className="font-semibold text-2xl text-purple-600">
                              {orders
                                ?.reduce((sum, order) => sum + order.totalItems, 0)}
                            </p>
                          ) : (
                            <p className="font-semibold text-2xl text-purple-600">
                              0
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {activeTab === "trucks" && (
                  <div className="space-y-3 md:space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base md:text-lg font-semibold text-[#10294B]">
                        Assigned Trucks ({trucks.length})
                      </h3>
                    </div>
                    {trucks.map((truck) => (
                      <Card key={truck.id} className="border-0 shadow-md">
                        <CardContent className="p-3 md:p-4">
                          {/* Mobile Layout */}
                          <div className="block md:hidden space-y-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Truck className="h-4 w-4 text-blue-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-sm truncate">
                                  {truck.make} {truck.model}
                                </h4>
                                <p className="text-xs text-gray-500 truncate">
                                  {truck.truck_number}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge
                                className={`${statusConfig[truck.status as keyof typeof statusConfig]?.color} text-xs`}
                              >
                                {statusConfig[truck.status as keyof typeof statusConfig]?.label}
                              </Badge>
                              <Badge variant="outline" className="text-xs">{truck.id}</Badge>
                            </div>
                          </div>

                          {/* Desktop Layout */}
                          <div className="hidden md:flex md:items-center md:justify-between md:gap-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Truck className="h-5 w-5 text-blue-600" />
                              </div>
                              <div>
                                <h4 className="font-semibold">
                                  {truck.make} {truck.model}
                                </h4>
                                <p className="text-sm text-gray-500">
                                  {truck.truck_number}
                                </p>
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
                              <Badge variant="outline">{truck.id}</Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {trucks.length === 0 && (
                      <div className="text-center py-6 md:py-8 text-gray-500">
                        <Truck className="h-10 w-10 md:h-12 md:w-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm md:text-base">No trucks assigned to this user</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "orders" && (
                  <div className="space-y-3 md:space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base md:text-lg font-semibold text-[#10294B]">
                        Order History ({orders.length})
                      </h3>
                    </div>
                    {orders.length > 0 &&
                      orders?.map((order) => {
                        const statusInfo = statusConfig[order.status as keyof typeof statusConfig];
                        const StatusIcon = (statusInfo as any)?.icon || Clock;
                        return (
                          <Card key={order.id} className="border-0 shadow-md">
                            <CardContent className="p-3 md:p-4">
                              {/* Mobile Layout */}
                              <div className="block md:hidden space-y-3">
                                {/* Header Row */}
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-start gap-2 flex-1 min-w-0">
                                    <div className="w-7 h-7 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                      <Package className="h-3 w-3 text-green-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h4 className="font-semibold text-sm truncate">
                                        {order.orderId}
                                      </h4>
                                      <p className="text-xs text-gray-600 truncate">
                                        {order.items[0]?.inventoryItem?.name || 'Order Items'}
                                      </p>
                                    </div>
                                  </div>
                                  <Badge className={`${statusInfo?.color} text-xs px-2 py-1`}>
                                    {/* {StatusIcon && (
                                      <StatusIcon className="h-3 w-3 mr-1" />
                                    )}
                                    <span className="hidden xs:inline">
                                      {statusInfo?.label || order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                    </span> */}
                                    <span className="xs:hidden">
                                      {order.status}
                                    </span>
                                  </Badge>
                                </div>

                                {/* Details Row */}
                                <div className="space-y-2">
                                  <div className="flex flex-col gap-2 text-xs text-gray-500">
                                    <div className="flex items-center gap-2">
                                      <Calendar className="h-3 w-3 flex-shrink-0" />
                                      <span>{new Date(order.date).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Truck className="h-3 w-3 flex-shrink-0" />
                                      <span className="truncate">{order.truckName}</span>
                                    </div>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                      <div className="flex flex-wrap gap-1">
                                        <Badge variant="outline" className="text-xs px-2 py-1">
                                          {order.technician.firstName} {order.technician.lastName}
                                        </Badge>
                                        {order.items[0]?.inventoryItem?.category && (
                                          <Badge variant="outline" className="text-xs px-2 py-1">
                                            {order.items[0].inventoryItem.category}
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <p className="font-semibold text-sm">
                                        {order.totalItems} items
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        {order.items[0]?.requestedQuantity || 0} {order.items[0]?.inventoryItem?.unit || 'units'}
                                      </p>
                                    </div>
                                  </div>

                                  {order.items[0]?.reason && (
                                    <div className="bg-gray-50 rounded p-2">
                                      <p className="text-xs text-gray-600 line-clamp-2">
                                        <span className="font-medium">Reason:</span> {order.items[0].reason}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Desktop Layout */}
                              <div className="hidden md:flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3">
                                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                    <Package className="h-5 w-5 text-green-600" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-base">
                                      {order.orderId}
                                    </h4>
                                    <p className="text-sm text-gray-600 truncate">
                                      {order.items[0]?.inventoryItem?.name || 'Order Items'}
                                    </p>
                                    <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                                      <span className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3 flex-shrink-0" />
                                        {new Date(order.date).toLocaleDateString()}
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <Truck className="h-3 w-3 flex-shrink-0" />
                                        {order.truckName}
                                      </span>
                                    </div>
                                    <div className="flex flex-wrap gap-1 mt-2">
                                      <Badge variant="outline" className="text-xs">
                                        {order.technician.firstName} {order.technician.lastName}
                                      </Badge>
                                      {order.items[0]?.inventoryItem?.category && (
                                        <Badge variant="outline" className="text-xs">
                                          {order.items[0].inventoryItem.category}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                  <div className="text-right">
                                    <p className="font-semibold text-base">
                                      {order.totalItems} items
                                    </p>
                                    <p className="text-sm text-gray-500">
                                      {order.items[0]?.requestedQuantity || 0} {order.items[0]?.inventoryItem?.unit || 'units'}
                                    </p>
                                    {order.items[0]?.reason && (
                                      <p className="text-xs text-gray-600 truncate max-w-[200px]">
                                        {order.items[0].reason}
                                      </p>
                                    )}
                                  </div>
                                  <Badge className={statusInfo?.color}>
                                    {StatusIcon && (
                                      <StatusIcon className="h-3 w-3 mr-1" />
                                    )}
                                    {statusInfo?.label || order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                  </Badge>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    {orders.length === 0 && (
                      <div className="text-center py-6 md:py-8 text-gray-500">
                        <ShoppingCart className="h-10 w-10 md:h-12 md:w-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm md:text-base">No orders found for this user</p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
