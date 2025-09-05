"use client";

import { useState, useEffect, useCallback } from "react";
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
  ShoppingCart,
  Plus,
  Search,
  Filter,
  Calendar,
  DollarSign,
  Package,
  Clock,
  CheckCircle,
  AlertCircle,
  Download,
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { OrderDetailsModal } from "@/components/order-details-modal";

interface Order {
  id: string;
  order_number: string;
  part_name: string;
  description: string;
  supply_house: string;
  status: string;
  priority: string;
  total_amount: number | null;
  commission: number | null;
  credit: number | null;
  created_at: string;
  quantity: number;
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
  code?: string;
}

const statusConfig = {
  pending: { color: "bg-yellow-100 text-yellow-800", icon: Clock },
  processing: { color: "bg-blue-100 text-blue-800", icon: Package },
  shipped: { color: "bg-purple-100 text-purple-800", icon: Package },
  completed: { color: "bg-green-100 text-green-800", icon: CheckCircle },
  cancelled: { color: "bg-red-100 text-red-800", icon: AlertCircle },
};

const urgencyConfig = {
  low: { color: "bg-gray-100 text-gray-800" },
  normal: { color: "bg-blue-100 text-blue-800" },
  high: { color: "bg-orange-100 text-orange-800" },
  urgent: { color: "bg-red-100 text-red-800" },
};

export default function OrdersPage() {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [downloadingOrderId, setDownloadingOrderId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [isLoading, setIsLoading] = useState(false);

  const formatCurrency = (value: number | null | undefined): string => {
    return value ? `$${value.toFixed(2)}` : "$0.00";
  };

  const fetchOrders = async () => {
    if (!user || !token) return;

    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        status: statusFilter && statusFilter !== "" ? statusFilter : "all",
        ...(searchTerm && { search: searchTerm }),
      });

      const response = await fetch(`/api/orders?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        const orders = data?.data?.orders || [];
        setOrders(
          orders.map((o: any) => ({
            id: o.id,
            order_number: o.order_number || "N/A",
            part_name: o.partName,
            description: o.description,
            supply_house: o.supplyHouse,
            status: o.status,
            priority: o.urgency,
            total_amount: o.cost,
            commission_amount: o.commission,
            total_credit: o.credit,
            created_at: o.date,
            quantity: o.quantity,
            items: o.items || [],
          }))
        )
        setPagination(data?.data?.pagination);
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fetch orders",
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
    const delayDebounce = setTimeout(() => {
      fetchOrders();
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [user, token, pagination?.page, statusFilter, searchTerm]);

  const handleDownloadInvoice = useCallback(
    async (order: Order) => {
      try {
        setDownloadingOrderId(order.id);
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
        link.download = `invoice-${order.id}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        toast({
          title: "Success",
          description: `Invoice for order #${order.order_number} downloaded`,
        });
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to download invoice",
          variant: "destructive",
        });
      } finally {
        setDownloadingOrderId(null);
      }
    },
    [toast, token]
  );

  const handlePageChange = useCallback((newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  }, []);

  const totalOrders = pagination?.total;
  const totalValue = orders.reduce(
    (sum, order) => sum + (order.total_amount || 0),
    0
  );
  const totalCredits = orders.reduce(
    (sum, order) => sum + (order.credit || 0),
    0
  );
  const completedOrders = orders.filter(
    (order) => order.status === "completed"
  ).length;

  const filteredOrders = orders
    .filter((order) => {
      const matchesSearch =
        order?.part_name && order?.part_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order?.order_number && order?.order_number.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === "date")
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      if (sortBy === "cost")
        return (b.total_amount || 0) - (a.total_amount || 0);
      if (sortBy === "status") return a.status.localeCompare(b.status);
      if (sortBy === "partName") return a.part_name.localeCompare(b.part_name);
      return 0;
    });

  return (
    <Navigation
      title="Order Management"
      subtitle="Monitor and manage all orders across technicians and trucks"
    >
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="flex">
          <main className="flex-1 p-6">
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-[#10294B] mb-2">
                    Order Management
                  </h1>
                  <p className="text-gray-600">
                    Track and manage all your parts orders
                  </p>
                </div>
                <Button
                  asChild
                  className="bg-[#E3253D] hover:bg-[#E3253D]/90 text-white shadow-lg"
                >
                  <Link href="/orders/new">
                    <Plus className="h-4 w-4 mr-2" />
                    New Order
                  </Link>
                </Button>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card className="bg-gradient-to-br from-[#10294B] to-[#006AA1] text-white border-0">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium opacity-90">
                      Total Orders
                    </CardTitle>
                    <ShoppingCart className="h-4 w-4 opacity-90" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{totalOrders}</div>
                    <p className="text-xs opacity-75">All time orders</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
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
                <Card className="bg-gradient-to-br from-[#E3253D] to-red-600 text-white border-0">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium opacity-90">
                      Credits Earned
                    </CardTitle>
                    <DollarSign className="h-4 w-4 opacity-90" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(totalCredits)}
                    </div>
                    <p className="text-xs opacity-75">Available credits</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium opacity-90">
                      Completed
                    </CardTitle>
                    <CheckCircle className="h-4 w-4 opacity-90" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{completedOrders}</div>
                    <p className="text-xs opacity-75">Successful orders</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Filters and Search */}
            <Card className="mb-6 border-0 shadow-lg">
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
                        placeholder="Search orders by part name or order ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  <Select
                    value={statusFilter}
                    onValueChange={setStatusFilter}
                    disabled={isLoading}
                  >
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="shipped">Shipped</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={sortBy}
                    onValueChange={setSortBy}
                    disabled={isLoading}
                  >
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="cost">Cost</SelectItem>
                      <SelectItem value="status">Status</SelectItem>
                      <SelectItem value="partName">Part Name</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Orders List */}
            <div className="space-y-4">
              {filteredOrders.map((order) => {
                console.log("order--",order)
                const StatusIcon =
                  statusConfig[order.status as keyof typeof statusConfig]
                    ?.icon || Clock;

                return (
                  <Card
                    key={order.id}
                    className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                  >
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="text-lg font-semibold text-[#10294B] mb-1">
                                {order.part_name}
                              </h3>
                              <p className="text-sm text-gray-600 mb-2">
                                {order.description}
                              </p>
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  {order.created_at}
                                </span>
                                <span>Order #{order.order_number}</span>
                                <span>Supply House: {order.supply_house}</span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Badge
                                className={
                                  statusConfig[
                                    order.status as keyof typeof statusConfig
                                  ]?.color
                                }
                              >
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {order.status.charAt(0).toUpperCase() +
                                  order.status.slice(1)}
                              </Badge>
                              <Badge
                                className={
                                  urgencyConfig[
                                    order.priority as keyof typeof urgencyConfig
                                  ]?.color
                                }
                              >
                                {order.priority}
                              </Badge>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t border-gray-100">
                            <div>
                              <div className="text-xs text-gray-500 mb-1">
                                Quantity
                              </div>
                              <div className="font-semibold">
                                {order.quantity} units
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
                                {formatCurrency(order.commission)}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500 mb-1">
                                Credit Earned
                              </div>
                              <div className="font-semibold text-green-600">
                                {formatCurrency(order.credit)}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 lg:ml-6">
                          <OrderDetailsModal order={order} />
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full lg:w-auto bg-transparent"
                            onClick={() => handleDownloadInvoice(order)}
                            disabled={downloadingOrderId === order.id}
                          >
                            {downloadingOrderId === order.id ? (
                              <>
                                <Download className="h-4 w-4 mr-2 animate-spin" />
                                Downloading...
                              </>
                            ) : (
                              <>
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* No Orders Found */}
            {filteredOrders.length === 0 && !isLoading && (
              <Card className="border-0 shadow-lg">
                <CardContent className="text-center py-12">
                  <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">
                    No orders found
                  </h3>
                  <p className="text-gray-500 mb-6">
                    Try adjusting your search or filter criteria
                  </p>
                  <Button
                    asChild
                    className="bg-[#E3253D] hover:bg-[#E3253D]/90"
                  >
                    <Link href="/orders/new">Create Your First Order</Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Pagination */}
            {filteredOrders.length > 0 && (
              <div className="flex justify-between items-center mt-4">
                <div className="text-sm text-gray-600">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                  {Math.min(
                    pagination.page * pagination.limit,
                    pagination.total
                  )}{" "}
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
          </main>
        </div>
      </div>
    </Navigation>
  );
}
