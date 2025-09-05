"use client";

import { useAuth } from "@/components/auth-provider";
import { Navigation } from "@/components/layout/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  RefreshCw,
  FileText,
  Package,
  AlertTriangle,
  CheckCircle,
  Edit,
  RotateCcw,
  Download,
  Mail,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface RestockItem {
  id: string;
  name: string;
  currentStock: number;
  standardLevel: number;
  suggestedQuantity: number;
  truck: string;
  category: string;
  priority: "high" | "medium" | "low";
  inventoryItemId?: string;
  binId?: string;
}

interface OrderDetails {
  id: string;
  orderNumber: string;
  technician: string;
  email: string;
  date: string;
  truck: string;
  totalItems: number;
  totalQuantity: number;
  items: RestockItem[];
}

export default function RestockPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [restockItems, setRestockItems] = useState<RestockItem[]>([]);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [isLoadingItems, setIsLoadingItems] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [technicianName, setTechnicianName] = useState<string>("Unknown");
  const [isDownloading, setIsDownloading] = useState(false);

  // Fetch technician name on mount
  useEffect(() => {
    const fetchTechnicianName = async () => {
      if (!user || !token) return;

      try {
        const response = await fetch("/api/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (response.ok) {
          setTechnicianName(data.name || "Unknown");
        } else {
          console.error("Failed to fetch technician name:", data.error);
          setTechnicianName("Unknown");
        }
      } catch (err) {
        console.error("Error fetching technician name:", err);
        setTechnicianName("Unknown");
      }
    };

    if (user && token) {
      fetchTechnicianName();
    }
  }, [user, token]);

  // Fetch restock items
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
      return;
    }

    const fetchRestockItems = async () => {
      if (!user || !token) return;

      try {
        setIsLoadingItems(true);
        const response = await fetch("/api/technician/restock", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (response.ok) {
          // Map API response to include inventoryItemId and binId
          const items = data.restockItems.map((item: any) => ({
            ...item,
            inventoryItemId: item.inventory_item_id,
            binId: item.bin_id,
          }));
          setRestockItems(items || []);
        } else {
          setError(data.error || "Failed to fetch restock items");
        }
      } catch (err) {
        console.error("Error fetching restock items:", err);
        setError("Failed to load restock items");
      } finally {
        setIsLoadingItems(false);
      }
    };

    if (user && token) {
      fetchRestockItems();
    }
  }, [user, token, loading, router]);

  const updateQuantity = (id: string, quantity: number) => {
    setRestockItems((items) =>
      items.map((item) =>
        item.id === id
          ? { ...item, suggestedQuantity: Math.max(0, quantity) }
          : item
      )
    );
  };

  const handleSubmitRestock = async () => {
    const itemsToRestock = restockItems.filter(
      (item) => item.suggestedQuantity > 0
    );
    if (itemsToRestock.length === 0) {
      setError("No items selected for restock");
      return;
    }

    try {
      setError(null);
      const truckId = itemsToRestock[0].truck; // Assume all items are from the same truck
      const urgency = itemsToRestock.some((item) => item.priority === "high")
        ? "high"
        : itemsToRestock.some((item) => item.priority === "medium")
        ? "medium"
        : "low";
      const notes = `Restock order for ${
        itemsToRestock.length
      } items, total quantity: ${itemsToRestock.reduce(
        (sum, item) => sum + item.suggestedQuantity,
        0
      )}`;

      const orderPayload = {
        truck_id: truckId,
        items: itemsToRestock.map((item) => ({
          inventory_item_id: item.inventoryItemId,
          inventory_item_name: item.name, // Include name as fallback
          bin_id: item.binId,
          quantity: item.suggestedQuantity,
          unit_price: 0, // Default unit price; adjust if available
          reason: `Restock: ${item.name} (Priority: ${item.priority})`,
        })),
        notes,
        supply_house_id: null, // Adjust if a default supply house is needed
        urgency,
      };

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create order");
      }

      const { order } = await response.json();
      setOrderDetails({
        id: order.id,
        orderNumber: order.order_number || `RESTOCK-${Date.now()}`, // Fallback if order_number is not returned
        technician: technicianName, // Use fetched technician name
        email:
          user?.email || responseData?.data?.email || "no-reply@company.com",
        date: new Date().toLocaleString(),
        truck: truckId,
        totalItems: itemsToRestock.length,
        totalQuantity: itemsToRestock.reduce(
          (sum, item) => sum + item.suggestedQuantity,
          0
        ),
        items: itemsToRestock,
      });
      setIsModalOpen(true);
      // setRestockItems([]); // Reset form on success
    } catch (err) {
      console.error("Error creating restock order:", err);
      setError(err.message || "Failed to create restock order");
    }
  };

  const handleDownloadInvoice = async () => {
    if (!orderDetails || !token) return;

    try {
      setIsDownloading(true);
      const response = await fetch(`/api/invoice/${orderDetails.id}`, {
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
      link.download = `invoice-${orderDetails.orderNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading invoice:", err);
      setError("Failed to download invoice");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleOpenGmail = () => {
    if (!orderDetails) return;

    // Create a well-formatted email body
    const emailSubject = `Restock Order - ${orderDetails.orderNumber}`;

    const emailBody = `Dear Team,

Please find the restock order details below:

ORDER INFORMATION:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Order ID: ${orderDetails.orderNumber}
Technician: ${orderDetails.technician}
Email: ${orderDetails.email}
Date: ${orderDetails.date}
Truck: ${orderDetails.truck}
Total Items: ${orderDetails.totalItems}
Total Quantity: ${orderDetails.totalQuantity}

ITEMS REQUESTED:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${orderDetails.items
  .map(
    (item, index) =>
      `${index + 1}. ${item.name}
   Category: ${item.category}
   Quantity Requested: ${item.suggestedQuantity}
   Current Stock: ${item.currentStock}
   Standard Level: ${item.standardLevel}
   Priority: ${item.priority.toUpperCase()}
   
`
  )
  .join("")}

Please process this order at your earliest convenience.

NOTE: The invoice PDF should be downloaded separately and attached to this email.

Best regards,
${orderDetails.technician}`;

    // Encode the email components properly
    const encodedSubject = encodeURIComponent(emailSubject);
    const encodedBody = encodeURIComponent(emailBody);

    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=&su=${encodedSubject}&body=${encodedBody}`;
    window.open(gmailUrl, "_blank");
  };

  // Combined function that downloads PDF and opens Gmail with user guidance
  const handleEmailWithPDF = async () => {
    if (!orderDetails) return;

    try {
      setIsDownloading(true);

      // First download the PDF
      const response = await fetch(`/api/invoice/${orderDetails.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to download invoice");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `invoice-${orderDetails.orderNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Wait a moment then open Gmail
      setTimeout(() => {
        handleOpenGmail();

        // Show user-friendly notification
        const showNotification = () => {
          const notification = document.createElement("div");
          notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #10294B;
            color: white;
            padding: 16px;
            border-radius: 8px;
            z-index: 9999;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            max-width: 300px;
            font-family: system-ui, -apple-system, sans-serif;
          `;
          notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="width: 8px; height: 8px; background: #22c55e; border-radius: 50%;"></div>
              <strong>PDF Downloaded!</strong>
            </div>
            <div style="margin-top: 8px; font-size: 14px; line-height: 1.4;">
              Please attach the downloaded invoice PDF to the email that just opened.
            </div>
          `;

          document.body.appendChild(notification);

          // Remove notification after 5 seconds
          setTimeout(() => {
            if (document.body.contains(notification)) {
              document.body.removeChild(notification);
            }
          }, 5000);
        };

        showNotification();
      }, 1000);
    } catch (error) {
      console.error("Error with email and PDF:", error);
      setError("Failed to download invoice");
      // Still open Gmail even if PDF download fails
      handleOpenGmail();
    } finally {
      setIsDownloading(false);
    }
  };

  const totalItems = restockItems.filter(
    (item) => item.suggestedQuantity > 0
  ).length;
  const totalQuantity = restockItems.reduce(
    (sum, item) => sum + item.suggestedQuantity,
    0
  );
  const highPriorityItems = restockItems.filter(
    (item) => item.priority === "high"
  ).length;

  return (
    <Navigation title="Restock" subtitle="Manage restocking operations">
      <div className="p-4 md:p-6 space-y-6">
        {isLoadingItems ? (
          <div className="flex items-center justify-center min-h-screen">
            Loading restock items...
          </div>
        ) : error ? (
          <Card>
            <CardContent className="p-8 text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error</h3>
              <p className="text-gray-500">{error}</p>
            </CardContent>
          </Card>
        ) : restockItems.length > 0 ? (
          <>
            {/* Dashboard Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-gradient-to-br from-[#10294B] to-[#006AA1] text-white border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm opacity-90">Items to Restock</p>
                      <p className="text-2xl font-bold">{totalItems}</p>
                    </div>
                    <Package className="h-8 w-8 opacity-80" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-[#E3253D] to-red-600 text-white border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm opacity-90">High Priority</p>
                      <p className="text-2xl font-bold">{highPriorityItems}</p>
                    </div>
                    <AlertTriangle className="h-8 w-8 opacity-80" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm opacity-90">Total Quantity</p>
                      <p className="text-2xl font-bold">{totalQuantity}</p>
                    </div>
                    <RefreshCw className="h-8 w-8 opacity-80" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Suggested Restock Items */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <RefreshCw className="h-5 w-5" />
                      Suggested Restock Items
                    </CardTitle>
                    <CardDescription>
                      Review and adjust quantities before submitting
                    </CardDescription>
                  </div>
                  <Button
                    onClick={handleSubmitRestock}
                    className="bg-[#E3253D] hover:bg-red-600"
                    disabled={totalItems === 0}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Submit Restock Order
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {restockItems.map((item) => (
                    <Card key={item.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-[#10294B] rounded-lg flex items-center justify-center text-white">
                            <Package className="h-6 w-6" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-[#10294B]">
                              {item.name}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {item.truck} • {item.category}
                            </p>
                            <div className="flex items-center gap-4 mt-1 text-sm">
                              <span className="text-gray-500">
                                Current: {item.currentStock}
                              </span>
                              <span className="text-gray-500">
                                Standard: {item.standardLevel}
                              </span>
                              <span className="text-blue-600 font-medium">
                                Need: {item.standardLevel - item.currentStock}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge
                            className={
                              item.priority === "high"
                                ? "bg-red-100 text-red-800"
                                : item.priority === "medium"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-green-100 text-green-800"
                            }
                          >
                            {item.priority} priority
                          </Badge>
                          <div className="flex items-center gap-2">
                            <Label
                              htmlFor={`quantity-${item.id}`}
                              className="text-sm"
                            >
                              Quantity:
                            </Label>
                            {editingItem === item.id ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  id={`quantity-${item.id}`}
                                  type="number"
                                  min="0"
                                  value={item.suggestedQuantity}
                                  onChange={(e) =>
                                    updateQuantity(
                                      item.id,
                                      Number.parseInt(e.target.value) || 0
                                    )
                                  }
                                  className="w-20"
                                />
                                <Button
                                  size="sm"
                                  onClick={() => setEditingItem(null)}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-lg min-w-[3rem] text-center">
                                  {item.suggestedQuantity}
                                </span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingItem(item.id)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Restock Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total Items:</span>
                      <span className="font-medium">{totalItems}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Quantity:</span>
                      <span className="font-medium">{totalQuantity}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>High Priority:</span>
                      <span className="font-medium text-red-600">
                        {highPriorityItems}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Medium Priority:</span>
                      <span className="font-medium text-yellow-600">
                        {
                          restockItems.filter(
                            (item) => item.priority === "medium"
                          ).length
                        }
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Order Type:</span>
                      <span className="font-medium">Auto Restock</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Generated:</span>
                      <span className="font-medium">
                        {new Date().toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Confirmation Modal */}
            {orderDetails && (
              <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Restock Order Confirmation</DialogTitle>
                    <DialogDescription>
                      Your order has been successfully created. Review the
                      details below and download the invoice or share via email.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Order ID</p>
                        <p className="font-medium">
                          {orderDetails.orderNumber}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Technician</p>
                        <p className="font-medium">{technicianName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium">{orderDetails.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Date</p>
                        <p className="font-medium">{orderDetails.date}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Truck</p>
                        <p className="font-medium">{orderDetails.truck}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Total Items</p>
                        <p className="font-medium">{orderDetails.totalItems}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Total Quantity</p>
                        <p className="font-medium">
                          {orderDetails.totalQuantity}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Items</p>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {orderDetails.items.map((item, index) => (
                          <div key={index} className="border-b pb-2">
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-gray-500">
                              Quantity: {item.suggestedQuantity} • Category:{" "}
                              {item.category} • Priority: {item.priority}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => setIsModalOpen(false)}
                      >
                        Close
                      </Button>
                      <Button
                        onClick={handleDownloadInvoice}
                        variant="outline"
                        disabled={isDownloading}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        {isDownloading ? "Downloading..." : "Download PDF"}
                      </Button>
                      <Button
                        onClick={handleEmailWithPDF}
                        className="bg-blue-600 hover:bg-blue-700"
                        disabled={isDownloading}
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        {isDownloading ? "Preparing..." : "Email with PDF"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <RotateCcw className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Restock Management
              </h3>
              <p className="text-gray-500">
                No items need restocking at this time.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </Navigation>
  );
}
