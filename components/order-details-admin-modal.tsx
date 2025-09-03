"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Package,
  User,
  DollarSign,
  MapPin,
  Phone,
  Mail,
  Clock,
  CheckCircle,
  AlertCircle,
  Truck,
  Calendar,
  FileText,
  Hash,
  Box,
} from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useRef } from "react";

interface OrderItem {
  id: string;
  part_name: string;
  part_number: string;
  bin_code: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  category: string;
  description: string;
}

interface OrderDetailsAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: {
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
    items?: OrderItem[];
  };
}

const statusConfig = {
  pending: { color: "bg-yellow-100 text-yellow-800", icon: Clock },
  confirmed: { color: "bg-blue-100 text-blue-800", icon: Package },
  processing: { color: "bg-blue-100 text-blue-800", icon: Package },
  shipped: { color: "bg-purple-100 text-purple-800", icon: Truck },
  delivered: { color: "bg-green-100 text-green-800", icon: CheckCircle },
  cancelled: { color: "bg-red-100 text-red-800", icon: AlertCircle },
};

const urgencyConfig = {
  low: { color: "bg-gray-100 text-gray-800" },
  normal: { color: "bg-blue-100 text-blue-800" },
  high: { color: "bg-orange-100 text-orange-800" },
  urgent: { color: "bg-red-100 text-red-800" },
};

export function OrderDetailsAdminModal({ isOpen, onClose, order }: OrderDetailsAdminModalProps) {
  const { token } = useAuth();
  const { toast } = useToast();
  const [status, setStatus] = useState(order.status);
  const [isUpdating, setIsUpdating] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  // Debug logging for modal state changes
  useEffect(() => {
    console.log("[v0] Modal state changed:", isOpen);
    if (isOpen) {
      console.log("[v0] Modal opened for order:", order.id);
    } else {
      console.log("[v0] Modal closed for order:", order.id);
      // Restore focus with delay after modal closure
      setTimeout(() => {
        if (triggerRef.current) {
          triggerRef.current.focus();
        }
      }, 100);
    }
  }, [isOpen, order.id]);

  const formatCurrency = (value: number | null | undefined): string => {
    return value ? `$${value.toFixed(2)}` : "$0.00";
  };

  const parseBinCode = (binCode: string | undefined): { aisle: string; bay: string; shelf: string } => {
    if (!binCode || typeof binCode !== "string") {
      return { aisle: "N/A", bay: "N/A", shelf: "N/A" };
    }
    const parts = binCode.split("-");
    return {
      aisle: parts[0] || "N/A",
      bay: parts[1] || "N/A",
      shelf: parts[2] || "N/A",
    };
  };

  const handleUpdateStatus = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling
    if (status !== "pending") return;
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/admin/orders/${order.id}/confirm`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (result.success) {
        setStatus("confirmed");
        toast({
          title: "Order status updated",
          description: `Order #${order.order_number} has been confirmed.`,
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update order status",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDownloadInvoice = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling
    try {
      const response = await fetch(`/api/admin/orders/${order.id}/invoice`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `invoice-${order.order_number}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        toast({
          title: "Invoice downloaded",
          description: `Invoice for order #${order.order_number} has been downloaded.`,
        });
      } else {
        const result = await response.json();
        toast({
          title: "Error",
          description: result.error || "Failed to download invoice",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download invoice",
        variant: "destructive",
      });
    }
  };

  const handleContactTechnician = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling
    onClose();
    setTimeout(() => {
      document.dispatchEvent(
        new CustomEvent("openContactTechnicianModal", { detail: order })
      );
    }, 0);
  };

  const orderItems: OrderItem[] = order.items || [];
  const totalOrderValue = orderItems.reduce((sum, item) => sum + (item.total_price || 0), 0);
  const totalItems = orderItems.reduce((sum, item) => sum + item.quantity, 0);

  const technicianDetails = {
    name: order.technician,
    email: order.technician_email,
    phone: order.technician_phone || "(555) 123-4567",
    location: "Dallas, TX", // Could fetch from API if needed
    specialization: "HVAC", // Could fetch from API if needed
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && triggerRef.current) {
          setTimeout(() => triggerRef.current?.focus(), 100); // Restore focus on close
        }
        onClose();
      }}
    >
      <DialogContent
        className="flex flex-col overflow-hidden"
        style={{
          width: "1200px",
          maxWidth: "95vw",
          minWidth: "900px",
          height: "90vh",
        }}
      >
        <DialogHeader className="flex-shrink-0 px-4 py-3">
          <DialogTitle className="text-xl text-[#10294B]">
            Order #{order.order_number}
          </DialogTitle>
          <DialogDescription className="text-sm">
            Full order breakdown with all items and bin locations
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="overview" className="w-full h-full flex flex-col">
            <div className="flex-shrink-0 mx-4">
              <TabsList className="grid w-full grid-cols-3 h-9 max-w-full">
                <TabsTrigger value="overview" className="text-xs px-2">
                  Complete Order
                </TabsTrigger>
                <TabsTrigger value="technician" className="text-xs px-2">
                  Technician & Truck
                </TabsTrigger>
                <TabsTrigger value="financial" className="text-xs px-2">
                  Financial
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-hidden mt-2">
              <ScrollArea className="h-full overflow-auto">
                <div className="px-4 py-3 space-y-3">
                  <TabsContent value="overview" className="space-y-3 mt-0">
                    {/* Order Summary Header */}
                    <Card>
                      <CardHeader className="px-4 pb-1 pt-3">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg mb-1">
                              Order #{order.order_number}
                            </CardTitle>
                            <p className="text-gray-600 mb-2 text-sm">
                              Order ID: {order.id}
                            </p>
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {order.created_at}
                              </span>
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {order.technician}
                              </span>
                              <span className="flex items-center gap-1">
                                <Truck className="h-3 w-3" />
                                {order.truck_number}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <Badge
                              className={`text-xs ${
                                statusConfig[status as keyof typeof statusConfig]?.color
                              }`}
                            >
                              {/* <statusConfig[status as keyof typeof statusConfig].icon className="h-3 w-3 mr-1" /> */}
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </Badge>
                            <Badge
                              className={`text-xs ${
                                urgencyConfig[order.urgency as keyof typeof urgencyConfig]?.color
                              }`}
                            >
                              {order.urgency.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="px-4 pb-2 pt-1">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="text-center">
                            <Package className="h-6 w-6 text-[#10294B] mx-auto mb-1" />
                            <div className="text-lg font-bold text-[#10294B]">
                              {totalItems}
                            </div>
                            <p className="text-xs text-gray-600">Total Items</p>
                          </div>
                          <div className="text-center">
                            <Box className="h-6 w-6 text-purple-600 mx-auto mb-1" />
                            <div className="text-lg font-bold text-purple-600">
                              {orderItems.length}
                            </div>
                            <p className="text-xs text-gray-600">Item Types</p>
                          </div>
                          <div className="text-center">
                            <DollarSign className="h-6 w-6 text-green-600 mx-auto mb-1" />
                            <div className="text-lg font-bold text-green-600">
                              {formatCurrency(totalOrderValue)}
                            </div>
                            <p className="text-xs text-gray-600">Order Total</p>
                          </div>
                          <div className="text-center">
                            <Hash className="h-6 w-6 text-blue-600 mx-auto mb-1" />
                            <div className="text-lg font-bold text-blue-600">
                              {
                                new Set(
                                  orderItems.map((item) => parseBinCode(item.bin_code).aisle)
                                ).size
                              }
                            </div>
                            <p className="text-xs text-gray-600">Bin Locations</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="px-4 pb-1 pt-3">
                        <CardTitle className="flex items-center gap-2 text-sm">
                          <Package className="h-4 w-4" />
                          Complete Items List ({orderItems.length} items)
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="px-4 pb-2 pt-1">
                        <div className="space-y-3">
                          {orderItems.map((item) => (
                            <div key={item.id} className="border rounded-lg p-3 bg-gray-50">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-semibold text-sm">{item.part_name}</h4>
                                    <Badge variant="outline" className="text-xs">
                                      {item.category || "Uncategorized"}
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-gray-600 mb-2">
                                    {item.description || "No description"}
                                  </p>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                                    <div>
                                      <span className="text-gray-500">Part #:</span>
                                      <span className="font-mono ml-1">{item.part_number}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Hash className="h-3 w-3 text-blue-600" />
                                      <span className="text-gray-500">Bin:</span>
                                      <span className="font-mono font-semibold text-blue-600">
                                        {item.bin_code}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-gray-500">Qty:</span>
                                      <span className="font-semibold ml-1">{item.quantity}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-500">Unit:</span>
                                      <span className="font-semibold ml-1">
                                        {formatCurrency(item.unit_price)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-lg font-bold text-green-600">
                                    {formatCurrency(item.total_price)}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {item.quantity} × {formatCurrency(item.unit_price)}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 mt-2 p-2 bg-blue-50 rounded border-l-4 border-blue-500">
                                <MapPin className="h-4 w-4 text-blue-600" />
                                <div className="flex-1">
                                  <div className="text-xs font-semibold text-blue-800">
                                    Bin Location: {item.bin_code || "Not assigned"}
                                  </div>
                                  <div className="text-xs text-blue-600">
                                    {(() => {
                                      const { aisle, bay, shelf } = parseBinCode(item.bin_code);
                                      return `Aisle ${aisle} → Bay ${bay} → Shelf ${shelf}`;
                                    })()}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <Separator className="my-3" />
                        <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                          <div>
                            <div className="font-semibold text-sm">Order Total</div>
                            <div className="text-xs text-gray-600">
                              {totalItems} items across {orderItems.length} part types
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold text-green-600">
                              {formatCurrency(totalOrderValue)}
                            </div>
                            <div className="text-xs text-gray-500">Including all items</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="px-4 pb-1 pt-3">
                        <CardTitle className="text-sm">Quick Actions</CardTitle>
                      </CardHeader>
                      <CardContent className="px-4 pb-2 pt-1">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          <Button
                            variant="outline"
                            className="h-16 flex flex-col gap-1 bg-transparent text-xs"
                            onClick={handleContactTechnician}
                          >
                            <User className="h-4 w-4" />
                            <span>Contact Technician</span>
                          </Button>
                          <Button
                            variant="outline"
                            className="h-16 flex flex-col gap-1 bg-transparent text-xs"
                            onClick={handleDownloadInvoice}
                          >
                            <FileText className="h-4 w-4" />
                            <span>Download Invoice</span>
                          </Button>
                          {status === "pending" && (
                            <Button
                              variant="outline"
                              className="h-16 flex flex-col gap-1 bg-transparent text-xs"
                              onClick={handleUpdateStatus}
                              disabled={isUpdating}
                            >
                              <Package className="h-4 w-4" />
                              <span>{isUpdating ? "Updating..." : "Confirm Order"}</span>
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="px-4 pb-1 pt-3">
                        <CardTitle className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4" />
                          Order Timeline
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="px-4 pb-2 pt-1">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3 p-2 bg-green-50 rounded-lg border-l-4 border-green-500">
                            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm">Order Placed</p>
                              <p className="text-xs text-gray-600">
                                {order.created_at} at 10:30 AM
                              </p>
                              <p className="text-xs text-gray-500">
                                Order submitted by {order.technician}
                              </p>
                            </div>
                          </div>

                          {status !== "pending" && (
                            <div className="flex items-center gap-3 p-2 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                              <Package className="h-5 w-5 text-blue-600 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm">Order Confirmed</p>
                                <p className="text-xs text-gray-600">
                                  {order.created_at} at 11:15 AM
                                </p>
                                <p className="text-xs text-gray-500">Order processing started</p>
                              </div>
                            </div>
                          )}

                          {(status === "shipped" || status === "delivered") && (
                            <div className="flex items-center gap-3 p-2 bg-purple-50 rounded-lg border-l-4 border-purple-500">
                              <Truck className="h-5 w-5 text-purple-600 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm">Order Shipped</p>
                                <p className="text-xs text-gray-600">
                                  {order.created_at} at 2:45 PM
                                </p>
                                <p className="text-xs text-gray-500">Tracking: TRK123456789</p>
                              </div>
                            </div>
                          )}

                          {status === "delivered" && (
                            <div className="flex items-center gap-3 p-2 bg-green-50 rounded-lg border-l-4 border-green-500">
                              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm">Order Delivered</p>
                                <p className="text-xs text-gray-600">
                                  {order.created_at} at 4:20 PM
                                </p>
                                <p className="text-xs text-gray-500">
                                  Delivered and confirmed by technician
                                </p>
                              </div>
                            </div>
                          )}

                          {status === "cancelled" && (
                            <div className="flex items-center gap-3 p-2 bg-red-50 rounded-lg border-l-4 border-red-500">
                              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm">Order Cancelled</p>
                                <p className="text-xs text-gray-600">
                                  {order.created_at} at 3:00 PM
                                </p>
                                <p className="text-xs text-gray-500">
                                  Cancelled due to unavailability
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="technician" className="space-y-3 mt-0">
                    <Card>
                      <CardHeader className="px-4 pb-1 pt-3">
                        <CardTitle className="flex items-center gap-2 text-sm">
                          <User className="h-4 w-4" />
                          Technician Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="px-4 pb-2 pt-1">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-[#10294B] rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {technicianDetails.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-base">{technicianDetails.name}</h3>
                            <p className="text-gray-600 text-sm">
                              {technicianDetails.specialization} Specialist
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                <Mail className="h-3 w-3" />
                                <span className="truncate">{technicianDetails.email}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                <Phone className="h-3 w-3" />
                                {technicianDetails.phone}
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                <MapPin className="h-3 w-3" />
                                {technicianDetails.location}
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                <Truck className="h-3 w-3" />
                                {order.truck_number}
                              </div>
                            </div>
                          </div>
                          <Button
                            className="bg-[#10294B] hover:bg-[#10294B]/90 text-xs h-8"
                            onClick={handleContactTechnician}
                          >
                            Contact Technician
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="px-4 pb-1 pt-3">
                        <CardTitle className="flex items-center gap-2 text-sm">
                          <Truck className="h-4 w-4" />
                          Assigned Truck Details
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="px-4 pb-2 pt-1">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Truck ID</div>
                            <div className="font-semibold">{order.truck_id}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Truck Name</div>
                            <div className="font-semibold">{order.truck_number}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Current Location</div>
                            <div className="font-semibold">Downtown Route</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Status</div>
                            <Badge className="bg-green-100 text-green-800 text-xs">
                              Active
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="financial" className="space-y-3 mt-0">
                    <Card>
                      <CardHeader className="px-4 pb-1 pt-3">
                        <CardTitle className="flex items-center gap-2 text-sm">
                          <DollarSign className="h-4 w-4" />
                          Financial Breakdown
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="px-4 pb-2 pt-1">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-base">
                            <span>Order Total</span>
                            <span className="font-semibold">{formatCurrency(totalOrderValue)}</span>
                          </div>
                          <Separator />
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center text-blue-600 text-sm">
                              <span>Platform Commission (3%)</span>
                              <span className="font-semibold">{formatCurrency(order.commission)}</span>
                            </div>
                            <div className="flex justify-between items-center text-green-600 text-sm">
                              <span>Credit to Technician</span>
                              <span className="font-semibold">{formatCurrency(order.credit)}</span>
                            </div>
                            <div className="flex justify-between items-center text-purple-600 text-sm">
                              <span>Platform Revenue</span>
                              <span className="font-semibold">
                                {formatCurrency((order.commission || 0) - (order.credit || 0))}
                              </span>
                            </div>
                          </div>
                          <Separator />
                          <div className="flex justify-between items-center font-semibold text-base">
                            <span>Net Platform Revenue</span>
                            <span className="text-green-600">
                              {formatCurrency((order.commission || 0) - (order.credit || 0))}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="px-4 pb-1 pt-3">
                        <CardTitle className="text-sm">Payment Information</CardTitle>
                      </CardHeader>
                      <CardContent className="px-4 pb-2 pt-1">
                        <div>
                          <h4 className="font-semibold mb-1.5 text-sm">Technician Payment</h4>
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between">
                              <span>Credit Earned:</span>
                              <span className="font-semibold">{formatCurrency(order.credit)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Status:</span>
                              <Badge className="bg-green-100 text-green-800 text-xs">
                                Credited
                              </Badge>
                            </div>
                            <div className="flex justify-between">
                              <span>Date:</span>
                              <span>{order.created_at}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </div>
              </ScrollArea>
            </div>
          </Tabs>
        </div>

        <div className="flex justify-between pt-2 border-t flex-shrink-0 px-4 py-3">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8 bg-transparent"
              onClick={handleDownloadInvoice}
            >
              <FileText className="h-3 w-3 mr-1" />
              Download Invoice
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8 bg-transparent"
              onClick={handleContactTechnician}
            >
              <User className="h-3 w-3 mr-1" />
              Contact Technician
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={(e) => {
                e.stopPropagation(); // Prevent event bubbling
                onClose();
              }}
              className="text-xs h-8 bg-transparent"
              ref={triggerRef}
            >
              Close
            </Button>
            {status === "pending" && (
              <Button
                className="bg-[#E3253D] hover:bg-[#E3253D]/90 text-xs h-8"
                onClick={handleUpdateStatus}
                disabled={isUpdating}
              >
                Confirm Order
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}