"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { OrderDetailsAdminModal } from "@/components/order-details-admin-modal";
import { ContactTechnicianModal } from "@/components/contact-technician-modal";
import toast from "react-hot-toast";
import {
  Search,
  Filter,
  Truck,
  User,
  DollarSign,
  Clock,
  Package,
  ShoppingCart,
  CheckCircle,
  Eye,
  Download,
  MoreHorizontal,
  Calendar,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Navigation } from "@/components/layout/navigation";
import { debounce } from "lodash";

interface Order {
  id: string;
  order_number: string;
  technician: string;
  technician_email: string;
  technician_phone: string | null;
  truck_id: string;
  truck_number: string;
  status: string;
  priority: string;
  total_amount: number | null;
  commission_amount: number | null;
  total_credit: number | null;
  created_at: string;
  items: {
    id: string;
    part_name: string;
    part_number: string;
    bin_code: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    category: string;
    description: string;
  }[];
}

interface Technician {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface OrdersResponse {
  success: boolean;
  data?: {
    orders: Order[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
  error?: string;
}

interface TechniciansResponse {
  success: boolean;
  data?: {
    users: Technician[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
  error?: string;
}

const statusConfig = {
  pending: {
    color: "bg-yellow-100 text-yellow-800",
    icon: Clock,
    label: "Pending",
  },
  confirmed: {
    color: "bg-blue-100 text-blue-800",
    icon: Package,
    label: "Confirmed",
  },
};

const urgencyConfig = {
  low: { color: "bg-gray-100 text-gray-800", label: "Low" },
  normal: { color: "bg-blue-100 text-blue-800", label: "Normal" },
  high: { color: "bg-orange-100 text-orange-800", label: "High" },
  urgent: { color: "bg-red-100 text-red-800", label: "Urgent" },
};

export default function AdminOrdersPage() {
  const { user, token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1,
  });
  const [statusFilter, setStatusFilter] = useState("all");
  const [technicianFilter, setTechnicianFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showOrderDetailsModal, setShowOrderDetailsModal] = useState(false);
  const [showContactTechnicianModal, setShowContactTechnicianModal] =
    useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [dropdownKeys, setDropdownKeys] = useState<{ [key: string]: number }>(
    {}
  );
  const triggerRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const searchInputRef = useRef<HTMLInputElement>(null);

  const formatCurrency = (value: number | null | undefined): string => {
    return value ? `$${value.toFixed(2)}` : "$0.00";
  };

  const fetchTechnicians = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/users?role=technician", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result: TechniciansResponse = await response.json();

      if (result.success && result.data) {
        setTechnicians(result.data.users);
      } else {
        toast.error(result.error || "Failed to fetch technicians");
      }
    } catch (error) {
      toast.error("Failed to fetch technicians");
    }
  }, [token, toast]);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(statusFilter && statusFilter !== "all" && { status: statusFilter }),
        ...(technicianFilter &&
          technicianFilter !== "all" && { technician: technicianFilter }),
        ...(searchTerm && { search: searchTerm }),
      });

      const response = await fetch(`/api/admin/orders?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result: OrdersResponse = await response.json();

      if (result.success && result.data) {
        setOrders(result.data.orders);
        setPagination(result.data.pagination);
      } else {
        toast.error(result.error || "Failed to fetch orders");
      }
    } catch (error) {
      toast.error("Failed to fetch orders");
    } finally {
      setIsLoading(false);
    }
  }, [
    token,
    pagination.page,
    pagination.limit,
    statusFilter,
    technicianFilter,
    searchTerm,
    toast,
  ]);

  const debouncedFetchOrders = useCallback(
    debounce(() => {
      fetchOrders();
    }, 300),
    [fetchOrders]
  );

  const handleConfirmOrder = useCallback(
    async (orderId: string) => {
      try {
        const response = await fetch(`/api/admin/orders/${orderId}/confirm`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        const result = await response.json();
        if (result.success && result.data) {
          setOrders((prev) =>
            prev.map((o) =>
              o.id === orderId ? { ...o, status: result.data.status } : o
            )
          );
          toast.success(`Order #${result.data.order_number} confirmed`);
        } else {
          toast.error(result.error || "Failed to confirm order");
        }
      } catch (error) {
        toast.error("Failed to confirm order");
      }
    },
    [token, toast]
  );

  const handleDownloadInvoice = useCallback(
    async (order: Order) => {
      try {
        const response = await fetch(`/api/invoice/${order.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to download invoice");
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `invoice-${order.order_number}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        toast.success(`Invoice for order #${order.order_number} downloaded`);
      } catch (error: any) {
        toast.error(error.message || "Failed to download invoice");
      }
      document.activeElement?.blur();
      setDropdownKeys((prev) => ({
        ...prev,
        [order.id]: (prev[order.id] || 0) + 1,
      }));
    },
    [token, toast]
  );

  useEffect(() => {
    if (user?.role === "admin" && token) {
      fetchTechnicians();
      fetchOrders();

      const handleOpenContactModal = (event: any) => {
        setSelectedOrder(event.detail);
        setShowContactTechnicianModal(true);
        setDropdownKeys((prev) => ({
          ...prev,
          [event.detail.id]: (prev[event.detail.id] || 0) + 1,
        }));
      };

      document.addEventListener(
        "openContactTechnicianModal",
        handleOpenContactModal
      );

      return () => {
        document.removeEventListener(
          "openContactTechnicianModal",
          handleOpenContactModal
        );
      };
    }
  }, [user, token, fetchTechnicians, fetchOrders]);

  useEffect(() => {
    debouncedFetchOrders();
    return () => {
      debouncedFetchOrders.cancel();
    };
  }, [statusFilter, technicianFilter, searchTerm, debouncedFetchOrders]);

  const handlePageChange = useCallback((newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
    setDropdownKeys((prev) => ({
      ...prev,
      ...Object.fromEntries(
        Object.keys(prev).map((key) => [key, (prev[key] || 0) + 1])
      ),
    }));
  }, []);

  const handleDialogClose = useCallback(() => {
    setShowOrderDetailsModal(false);
    setShowContactTechnicianModal(false);
    setSelectedOrder(null);
    setDropdownKeys((prev) => ({
      ...prev,
      ...(selectedOrder
        ? { [selectedOrder.id]: (prev[selectedOrder.id] || 0) + 1 }
        : {}),
    }));
  }, [selectedOrder]);

  const handleViewDetails = useCallback((order: Order) => {
    setSelectedOrder(order);
    setShowOrderDetailsModal(true);
    document.activeElement?.blur();
    setDropdownKeys((prev) => ({
      ...prev,
      [order.id]: (prev[order.id] || 0) + 1,
    }));
  }, []);

  const handleContactTechnician = useCallback((order: Order) => {
    setSelectedOrder(order);
    setShowContactTechnicianModal(true);
    document.activeElement?.blur();
    setDropdownKeys((prev) => ({
      ...prev,
      [order.id]: (prev[order.id] || 0) + 1,
    }));
  }, []);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(e.target.value);
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    },
    []
  );

  const totalValue = orders.reduce(
    (sum, order) => sum + (order.total_amount || 0),
    0
  );
  const totalCommissions = orders.reduce(
    (sum, order) => sum + (order.commission_amount || 0),
    0
  );
  const totalCredits = orders.reduce(
    (sum, order) => sum + (order.total_credit || 0),
    0
  );
  const totalOrders = orders.length;

  return (
    <Navigation
      title="Order Management"
      subtitle="Monitor and manage all orders across technicians and trucks"
    >
      <div className="p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-4">
          <Card className="bg-gradient-to-br from-[#10294B] to-[#006AA1] text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">
                Total Orders
              </CardTitle>
              <ShoppingCart className="h-4 w-4 opacity-90" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalOrders}</div>
              <p className="text-xs opacity-75">Grouped by technician</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">
                Total Value
              </CardTitle>
              <DollarSign className="h-4 w-4 opacity-90" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(totalValue)}
              </div>
              <p className="text-xs opacity-75">Order value</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-[#E3253D] to-red-600 text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">
                Commissions
              </CardTitle>
              <DollarSign className="h-4 w-4 opacity-90" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(totalCommissions)}
              </div>
              <p className="text-xs opacity-75">Total commissions</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">
                Credits Issued
              </CardTitle>
              <CheckCircle className="h-4 w-4 opacity-90" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(totalCredits)}
              </div>
              <p className="text-xs opacity-75">To technicians</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-[#10294B]" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  ref={searchInputRef}
                  placeholder="Search orders by technician, truck ID, or part name..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="pl-10 text-sm"
                  disabled={isLoading}
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
                disabled={isLoading}
              >
                <SelectTrigger className="w-full md:w-48 text-sm">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={technicianFilter}
                onValueChange={setTechnicianFilter}
                disabled={isLoading}
              >
                <SelectTrigger className="w-full md:w-48 text-sm">
                  <SelectValue placeholder="Filter by technician" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Technicians</SelectItem>
                  {technicians.map((technician) => (
                    <SelectItem key={technician.id} value={technician.id}>
                      {`${technician.first_name} ${technician.last_name}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Orders List */}
        <div className="space-y-4">
          {orders.map((order) => {
            const statusKey = statusConfig.hasOwnProperty(order.status)
              ? order.status
              : "pending";
            const StatusIcon =
              statusConfig[statusKey as keyof typeof statusConfig].icon;
            const statusLabel =
              statusConfig[statusKey as keyof typeof statusConfig].label;

            if (!statusConfig.hasOwnProperty(order.status)) {
              console.warn(
                `Unknown order status: ${order.status} for order #${order.order_number}`
              );
            }

            return (
              <Card
                key={order.id}
                className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between flex-wrap">
                        <div>
                          <h3 className="text-lg font-semibold text-[#10294B] mb-1">
                            Order #{order.order_number} - {order.items.length}{" "}
                            Items
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">
                            {order.items
                              .map((item) => item.part_name)
                              .join(", ")}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {new Date(order.created_at).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              {order.technician}
                            </span>
                            <span className="flex items-center gap-1">
                              <Truck className="h-4 w-4" />
                              {order.truck_number}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Badge
                            className={
                              statusConfig[
                                statusKey as keyof typeof statusConfig
                              ].color
                            }
                          >
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusLabel}
                          </Badge>
                          <Badge
                            className={
                              urgencyConfig[
                                order.urgency as keyof typeof urgencyConfig
                              ]?.color || urgencyConfig.normal.color
                            }
                          >
                            {urgencyConfig[
                              order.urgency as keyof typeof urgencyConfig
                            ]?.label || order.urgency}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-3 border-t border-gray-100">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">
                            Total Items
                          </div>
                          <div className="font-semibold">
                            {order.items.reduce(
                              (sum, item) => sum + item.quantity,
                              0
                            )}{" "}
                            units
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">
                            Total Cost
                          </div>
                          <div className="font-semibold">
                            {formatCurrency(order.total_amount)}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">
                            Commission
                          </div>
                          <div className="font-semibold text-blue-600">
                            {formatCurrency(order.commission_amount)}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">
                            Credit Issued
                          </div>
                          <div className="font-semibold text-green-600">
                            {formatCurrency(order.total_credit)}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">
                            Platform Fee
                          </div>
                          <div className="font-semibold text-purple-600">
                            {formatCurrency(
                              (order.commission_amount || 0) -
                                (order.total_credit || 0)
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 lg:ml-6">
                      <DropdownMenu
                        key={`dropdown-${order.id}-${
                          dropdownKeys[order.id] || 0
                        }`}
                        onOpenChange={(open) => {
                          if (!open && triggerRefs.current.get(order.id)) {
                            triggerRefs.current.get(order.id)!.focus();
                          }
                        }}
                      >
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isLoading}
                            ref={(el) => {
                              if (el) {
                                triggerRefs.current.set(order.id, el);
                              } else {
                                triggerRefs.current.delete(order.id);
                              }
                            }}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewDetails(order);
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleContactTechnician(order);
                            }}
                          >
                            <User className="mr-2 h-4 w-4" />
                            Contact Technician
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadInvoice(order);
                            }}
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Download Invoice
                          </DropdownMenuItem>
                          {order.status === "pending" && (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleConfirmOrder(order.id);
                              }}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Confirm Order
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* No Orders Found */}
        {orders.length === 0 && !isLoading && (
          <Card className="border-0 shadow-lg">
            <CardContent className="text-center py-12">
              <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                No orders found
              </h3>
              <p className="text-gray-500 mb-6">
                Try adjusting your search or filter criteria
              </p>
            </CardContent>
          </Card>
        )}

        {/* Pagination */}
        {orders.length > 0 && (
          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-gray-600">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
              of {pagination.total} orders
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page === 1 || isLoading}
                onClick={() => handlePageChange(pagination.page - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page === pagination.pages || isLoading}
                onClick={() => handlePageChange(pagination.page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Modals */}
        {selectedOrder && (
          <>
            <OrderDetailsAdminModal
              isOpen={showOrderDetailsModal}
              onClose={handleDialogClose}
              order={selectedOrder}
              onConfirm={handleConfirmOrder}
            />
            <ContactTechnicianModal
              isOpen={showContactTechnicianModal}
              onClose={handleDialogClose}
              technician={{
                name: selectedOrder.technician,
                email: selectedOrder.technician_email,
                phone: selectedOrder.technician_phone,
              }}
              orderId={selectedOrder.order_number}
            />
          </>
        )}
      </div>
    </Navigation>
  );
}
