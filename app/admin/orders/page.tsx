"use client";

import { useState, useEffect } from "react";
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
import { useToast } from "@/hooks/use-toast";
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
} from "lucide-react";

interface Order {
  id: string;
  order_number: string;
  technician: string;
  technician_email: string;
  technician_phone: string | null;
  truck_id: string;
  truck_number: string;
  status: string;
  urgency: string;
  total_amount: number | null;
  commission: number | null;
  credit: number | null;
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

const statusConfig = {
  pending: { color: "bg-yellow-100 text-yellow-800", icon: Clock },
  confirmed: { color: "bg-blue-100 text-blue-800", icon: Package },
  processing: { color: "bg-blue-100 text-blue-800", icon: Package },
  shipped: { color: "bg-purple-100 text-purple-800", icon: Truck },
  delivered: { color: "bg-green-100 text-green-800", icon: Package },
  cancelled: { color: "bg-red-100 text-red-800", icon: Package },
};

const urgencyConfig = {
  low: { color: "bg-gray-100 text-gray-800" },
  normal: { color: "bg-blue-100 text-blue-800" },
  high: { color: "bg-orange-100 text-orange-800" },
  urgent: { color: "bg-red-100 text-red-800" },
};

export default function AdminOrdersPage() {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1,
  });
  const [statusFilter, setStatusFilter] = useState("");
  const [technicianFilter, setTechnicianFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showOrderDetailsModal, setShowOrderDetailsModal] = useState(false);
  const [showContactTechnicianModal, setShowContactTechnicianModal] =
    useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const formatCurrency = (value: number | null | undefined): string => {
    return value ? `$${value.toFixed(2)}` : "$0.00";
  };

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(statusFilter && { status: statusFilter }),
        ...(technicianFilter && { technician: technicianFilter }),
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
        toast({
          title: "Error",
          description: result.error || "Failed to fetch orders",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch orders",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "admin" && token) {
      fetchOrders();

      const handleOpenContactModal = (event: any) => {
        setSelectedOrder(event.detail);
        setShowContactTechnicianModal(true);
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
  }, [
    user,
    token,
    pagination.page,
    statusFilter,
    technicianFilter,
    searchTerm,
  ]);

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const totalValue = orders.reduce(
    (sum, order) => sum + (order.total_amount || 0),
    0
  );
  const totalCommissions = orders.reduce(
    (sum, order) => sum + (order.commission || 0),
    0
  );
  const totalCredits = orders.reduce(
    (sum, order) => sum + (order.credit || 0),
    0
  );
  const totalOrders = orders.length;
  const uniqueTechnicians = new Set(orders.map((order) => order.technician))
    .size;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-4 text-[#10294B]">
        Order Management
      </h1>

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
                placeholder="Search orders by technician, truck ID, or part name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 text-sm"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48 text-sm">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Statuses">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={technicianFilter}
              onValueChange={setTechnicianFilter}
            >
              <SelectTrigger className="w-full md:w-48 text-sm">
                <SelectValue placeholder="Filter by technician" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Technicians">All Technicians</SelectItem>
                <SelectItem value="123e4567-e89b-12d3-a456-426614174001">
                  Mike Rodriguez
                </SelectItem>
                <SelectItem value="123e4567-e89b-12d3-a456-426614174002">
                  Sarah Chen
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg text-[#10294B]">Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="border-0 rounded-lg p-3 bg-gray-50 cursor-pointer hover:bg-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                  onClick={() => {
                    setSelectedOrder(order);
                    setShowOrderDetailsModal(true);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-sm text-[#10294B]">
                          Order #{order.order_number}
                        </h3>
                        <Badge
                          className={`text-xs ${
                            statusConfig[
                              order.status as keyof typeof statusConfig
                            ]?.color
                          }`}
                        >
                          {order.status.charAt(0).toUpperCase() +
                            order.status.slice(1)}
                        </Badge>
                        <Badge
                          className={`text-xs ${
                            urgencyConfig[
                              order.urgency as keyof typeof urgencyConfig
                            ]?.color
                          }`}
                        >
                          {order.urgency.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-500">
                        <div>
                          <span className="text-gray-600">Technician:</span>
                          <span className="ml-1">{order.technician}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Truck:</span>
                          <span className="ml-1">{order.truck_number}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Date:</span>
                          <span className="ml-1">{order.created_at}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Total:</span>
                          <span className="font-semibold ml-1">
                            {formatCurrency(order.total_amount)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedOrder(order);
                        setShowOrderDetailsModal(true);
                      }}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Pagination */}
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
                disabled={pagination.page === 1}
                onClick={() => handlePageChange(pagination.page - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page === pagination.pages}
                onClick={() => handlePageChange(pagination.page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* No Orders Found */}
      {orders.length === 0 && (
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

      {/* Modals */}
      {selectedOrder && (
        <>
          <OrderDetailsAdminModal
            isOpen={showOrderDetailsModal}
            onClose={() => setShowOrderDetailsModal(false)}
            order={selectedOrder}
          />
          <ContactTechnicianModal
            isOpen={showContactTechnicianModal}
            onClose={() => setShowContactTechnicianModal(false)}
            technician={{
              name: selectedOrder.technician,
              email: selectedOrder.technician_email,
              phone: selectedOrder.technician_phone,
            }}
          />
        </>
      )}
    </div>
  );
}
