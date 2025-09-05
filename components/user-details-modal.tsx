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
  date: string;
  items: number;
  cost: number;
  status: "completed" | "shipped" | "pending";
  truck_id: string;
}

const statusConfig = {
  active: { color: "bg-green-100 text-green-800", label: "Active" },
  inactive: { color: "bg-red-100 text-red-800", label: "Inactive" },
  pending: { color: "bg-yellow-100 text-yellow-800", label: "Pending" },
  suspended: { color: "bg-gray-100 text-gray-800", label: "Suspended" },
  maintenance: { color: "bg-yellow-100 text-yellow-800", label: "Maintenance" },
  completed: { color: "bg-green-100 text-green-800", icon: CheckCircle },
  shipped: { color: "bg-purple-100 text-purple-800", icon: Package },
};

const tabs = [
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

  useEffect(() => {
    const fetchData = async () => {
      if (!token) {
        setError("Authentication required.");
        return;
      }
      setIsLoading(true);
      try {
        // Fetch trucks (already included in user.assigned_trucks)
        setTrucks(
          user.assigned_trucks.map((truck) => ({
            ...truck,
            status: truck.status || "active",
            location: truck.location || "Unknown",
          }))
        );

        // Fetch orders (assuming /api/orders endpoint exists)
        const orderResponse = await fetch(`/api/orders?user_id=${user.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const orderResult = await orderResponse.json();
        if (orderResult.success && orderResult.data) {
          setOrders(orderResult.data);
        } else {
          setError(orderResult.error || "Failed to fetch orders.");
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
  }, [isOpen, user.id, token, user.assigned_trucks]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[#10294B]">
            User Details - {user.first_name} {user.last_name}
          </DialogTitle>
          <DialogDescription>
            Complete information about this user
          </DialogDescription>
        </DialogHeader>

        {/* {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )} */}

        <div className="space-y-6">
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="w-16 h-16 bg-[#10294B] rounded-full flex items-center justify-center text-white font-bold text-xl">
              {user.first_name[0]}
              {user.last_name[0]}
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-[#10294B]">
                {user.first_name} {user.last_name}
              </h3>
              <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                <span className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {user.email}
                </span>
                {user.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {user.phone}
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Badge
                className={
                  statusConfig[user.status as keyof typeof statusConfig]?.color
                }
              >
                {statusConfig[user.status as keyof typeof statusConfig]?.label}
              </Badge>
              <Badge variant="outline">{user.role}</Badge>
            </div>
          </div>

          <div className="w-full">
            <div className="flex border-b border-gray-200 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                          <p className="font-semibold capitalize">
                            {user.role}
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
                            Total Value:
                          </span>
                          {
                            orders.length > 0 ? (
                              <p className="font-semibold text-2xl text-purple-600">
                            $
                            {orders
                              ?.reduce((sum, order) => sum + order.cost, 0)
                              ?.toFixed(2)}
                          </p>) : (
                                <p className="font-semibold text-2xl text-purple-600">
                            $0.00
                          </p>
                            )
                          }
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {activeTab === "trucks" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-[#10294B]">
                        Assigned Trucks ({trucks.length})
                      </h3>
                    </div>
                    {trucks.map((truck) => (
                      <Card key={truck.id} className="border-0 shadow-md">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
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
                      <div className="text-center py-8 text-gray-500">
                        <Truck className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No trucks assigned to this user</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "orders" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-[#10294B]">
                        Order History ({orders.length})
                      </h3>
                    </div>
                    {orders.length > 1 && orders?.map((order) => {
                      const StatusIcon =
                        statusConfig[order.status as keyof typeof statusConfig]
                          ?.icon || Clock;
                      return (
                        <Card key={order.id} className="border-0 shadow-md">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                  <Package className="h-5 w-5 text-green-600" />
                                </div>
                                <div>
                                  <h4 className="font-semibold">
                                    Order #{order.id}
                                  </h4>
                                  <div className="flex items-center gap-4 text-sm text-gray-500">
                                    <span className="flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      {new Date(
                                        order.date
                                      ).toLocaleDateString()}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Truck className="h-3 w-3" />
                                      {order.truck_id}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  <p className="font-semibold">
                                    ${order.cost.toFixed(2)}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    {order.items} items
                                  </p>
                                </div>
                                <Badge
                                  className={
                                    statusConfig[
                                      order.status as keyof typeof statusConfig
                                    ]?.color
                                  }
                                >
                                  {StatusIcon && (
                                    <StatusIcon className="h-3 w-3 mr-1" />
                                  )}
                                  {order.status}
                                </Badge>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                    {orders.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No orders found for this user</p>
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
