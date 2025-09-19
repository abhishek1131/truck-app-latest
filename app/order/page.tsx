"use client";

import { useAuth } from "@/components/auth-provider";
import { Navigation } from "@/components/layout/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  FileText,
  Download,
  Clock,
  Package,
  Search,
  Grid3X3,
  Truck,
  AlertTriangle,
  Mail,
  Eye,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { jsPDF } from "jspdf";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PreviousOrderDetailsModal } from "@/components/previous-order-details-modal";
import toast from "react-hot-toast";
import { fetchClient } from "@/lib/fetchClient";

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  partNumber: string;
  part_number: string; // For compatibility with modal
  brand: string;
  standardLevel: number;
  lowStockThreshold: number;
  notes: string;
  unitPrice: number;
}

interface TruckBinItem {
  inventoryItemId: string;
  inventoryItem?: InventoryItem; // Optional to handle undefined
  currentQuantity: number;
  binId: string;
  binName: string;
}

interface RestockItemLocation {
  truckId: string;
  truck: string;
  binId: string;
  binName: string;
  binLocation: string;
  currentStock: number;
  suggestedQuantity: number;
}

interface RestockItem {
  id: string;
  name: string;
  currentStock: number;
  totalCurrentStock: number;
  standardLevel: number;
  suggestedQuantity: number;
  category: string;
  priority: "high" | "medium" | "low";
  locations: RestockItemLocation[];
}

interface OrderItem {
  id: string;
  inventoryItemId: string;
  inventoryItem: InventoryItem;
  requestedQuantity: number;
  truckId?: string;
  truckName?: string;
  binId?: string;
  binName?: string;
  currentStock?: number;
  reason: string;
  unitPrice: number;
  priority?: "high" | "medium" | "low";
}

interface Technician {
  id: string
  firstName: string
  lastName?: string
  email: string
  phone?: string
  role: string
}

interface PreviousOrder {
  id: string;
  orderId: string;
  date: string;
  truckId: string;
  truckName: string;
  isStockItem: boolean;
  items: OrderItem[];
  totalItems: number;
  technician: Technician;
  status: string;
  supplyHouseId?: string;
}

interface Truck {
  id: string;
  name: string;
  location: string;
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
  items: OrderItem[];
}

export default function OrderPage() {
  const { user, loading, token } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isRestock = searchParams.get("fromRestock") === "true";
  const truckId = searchParams.get("truckId");
  const itemId = searchParams.get("itemId"); // New parameter for specific item
  const [selectedTruck, setSelectedTruck] = useState("");
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showItemSelection, setShowItemSelection] = useState(isRestock);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [truckBinItems, setTruckBinItems] = useState<TruckBinItem[]>([]);
  const [previousOrders, setPreviousOrders] = useState<PreviousOrder[]>([]);
  const [isLoadingRestock, setIsLoadingRestock] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsTruckSelection, setNeedsTruckSelection] = useState(false);
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [technicianName, setTechnicianName] = useState<string>("Unknown");
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState<PreviousOrder | null>(null);
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  console.log("previousOrders", previousOrders);
  useEffect(() => {
    const fetchTechnicianName = async () => {
      if (!user || !token) return;

      try {
        const response = await fetchClient("/api/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (response.ok) {
          setTechnicianName(
            data?.data?.first_name + " " + data?.data?.last_name || "Unknown"
          );
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

  useEffect(() => {
    if (!token || !user || user.role !== "technician" || !isRestock) return;

    setIsLoadingRestock(true);
    setShowItemSelection(true);

    const fetchRestockItems = async () => {
      try {
        const response = await fetchClient("/api/technician/restock", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (response.ok) {
          if (!data.items || !Array.isArray(data.items)) {
            throw new Error("Invalid API response: items data is missing or not an array");
          }

          let filteredItems = data.items;

          if (truckId) {
            filteredItems = filteredItems.filter((item: RestockItem) =>
              item.locations.some((location) => location.truckId === truckId)
            );
          }
          if (itemId) {
            filteredItems = filteredItems.filter(
              (item: RestockItem) => item.id === itemId
            );
          }

          if (filteredItems.length === 0) {
            setError(
              itemId
                ? "No restock items found for the specified item."
                : "No items need restocking at this time."
            );
            setIsLoadingRestock(false);
            return;
          }

          const truckIds = [
            ...new Set(
              filteredItems.flatMap((item: RestockItem) =>
                item.locations.map((location) => location.truckId)
              )
            ),
          ];

          if (truckIds.length > 1 && !truckId) {
            setNeedsTruckSelection(true);
            setError("Multiple trucks detected. Please select a truck.");
            setIsLoadingRestock(false);
            return;
          }

          const inferredTruckId = truckId || truckIds[0];
          if (!inferredTruckId) {
            setError("No truck information available for restock items.");
            setIsLoadingRestock(false);
            return;
          }

          const truckExists = trucks.find((t) => t.id === inferredTruckId);
          if (!truckExists && trucks.length > 0) {
            setError("Selected truck is not available. Please choose a truck.");
            setIsLoadingRestock(false);
            return;
          }

          setSelectedTruck(inferredTruckId as string);

          // ✅ Deduplicate order items by inventoryItemId
          const orderItemsMap = new Map<string, OrderItem>();

          filteredItems.forEach((item: RestockItem) => {
            item.locations
              .filter((location) => location.truckId === inferredTruckId)
              .forEach((location) => {
                if (!orderItemsMap.has(item.id)) {
                  orderItemsMap.set(item.id, {
                    id: Date.now().toString() + Math.random(),
                    inventoryItemId: item.id,
                    inventoryItem: {
                      id: item.id,
                      name: item.name,
                      category: item.category,
                      unit: "unit",
                      partNumber: "",
                      part_number: "",
                      brand: "",
                      standardLevel: item.standardLevel,
                      lowStockThreshold: Math.round(item.standardLevel * 0.2),
                      notes: "",
                      unitPrice: 0,
                    },
                    requestedQuantity: item.suggestedQuantity,
                    truckId: location.truckId,
                    truckName: location.truck,
                    binId: location.binId,
                    binName: location.binName,
                    currentStock: item.totalCurrentStock,
                    reason: `Restock: ${item.name} (Priority: ${item.priority})`,
                    unitPrice: 0,
                    priority: item.priority,
                  });
                }
              });
          });

          const prefilledOrderItems = Array.from(orderItemsMap.values());

          setOrderItems(prefilledOrderItems);
          console.log("Restock data:", data);
        } else {
          setError(data.error || "Failed to fetch restock items");
        }
      } catch (err) {
        console.error("Error fetching restock items:", err);
        setError(
          "Failed to load restock items: " +
          (err instanceof Error ? err.message : "Unknown error")
        );
      } finally {
        setIsLoadingRestock(false);
      }
    };

    fetchRestockItems();
  }, [token, user, trucks, searchParams, truckId, itemId, isRestock]);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const fetchData = async () => {
    if (!user || !token) return;

    // Fetch trucks
    try {
      const trucksResponse = await fetchClient("/api/orders/trucks", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const trucksData = await trucksResponse.json();
      if (trucksResponse.ok) {
        setTrucks(trucksData.trucks);
      } else {
        console.error("Failed to fetch trucks:", trucksData.error, {
          status: trucksResponse.status,
        });
      }
    } catch (error) {
      console.error("Error fetching trucks:", error);
    }

    // Fetch previous orders
    fetchPreviousOrder();
  };

  useEffect(() => {
    fetchData();
  }, [user, token, loading, router]);

  const handleStockItem = async (order: any) => {
    try {
      // Build API request body from order
      const requestBody = {
        order_id: order.id,
        truck_id: order.truckId,
        items: order.items.map((item: any) => ({
          id: item.inventoryItemId,         // item_id (from inventory)
          name: item.inventoryItem.name,    // item name
          count: item.requestedQuantity     // quantity to add
        }))
      };
  
      const response = await fetchClient("/api/orders/inventory", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });
      
      const data = await response.json();
      fetchPreviousOrder();
      if (data.success) {
        toast.success(`Stock updated successfully for order ${order.orderId}`);
      } else {
        toast.error(`Failed: ${data.error || "Something went wrong"}`);
      }
    } catch (error) {
      console.error("Stock Item Error:", error);
      toast.error("Error updating stock");
    }
  };

  const fetchPreviousOrder = async (page: number = 1) => {
    if (!token) return;

    setIsLoadingOrders(true);
    try {
      const ordersResponse = await fetchClient(`/api/orders/previous?page=${page}&limit=10`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const ordersData = await ordersResponse.json();
      if (ordersResponse.ok) {
        setPreviousOrders(ordersData.previousOrders);
        setCurrentPage(ordersData.pagination.currentPage);
        setTotalPages(ordersData.pagination.totalPages);
        setTotalOrders(ordersData.pagination.totalOrders);
        setHasNextPage(ordersData.pagination.hasNextPage);
        setHasPreviousPage(ordersData.pagination.hasPreviousPage);
      } else {
        console.error("Failed to fetch previous orders:", ordersData.error, {
          status: ordersResponse.status,
        });
      }
    } catch (error) {
      console.error("Error fetching previous orders:", error);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  useEffect(() => {
    const fetchInventory = async () => {
      if (!selectedTruck || !token) return;

      try {
        const inventoryResponse = await fetchClient(
          `/api/orders/inventory?truck_id=${selectedTruck}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const inventoryData = await inventoryResponse.json();
        if (inventoryResponse.ok) {
          setInventoryItems(inventoryData.inventoryItems);
          setTruckBinItems(
            inventoryData.truckBinItems.map((item: any) => {
              const inventoryItem = inventoryData.inventoryItems.find(
                (inv: InventoryItem) => inv.id === item.inventoryItemId
              );
              return {
                ...item,
                inventoryItem: inventoryItem || null, // Handle missing inventoryItem
              };
            })
          );
        } else {
          console.error("Failed to fetch inventory:", inventoryData.error, {
            status: inventoryResponse.status,
          });
        }
      } catch (error) {
        console.error("Error fetching inventory:", error);
      }
    };

    fetchInventory();
  }, [selectedTruck, token]);

  const addItemToOrder = (
    inventoryItem: InventoryItem,
    truckBinItem?: TruckBinItem
  ) => {
    const newOrderItem: OrderItem = {
      id: Date.now().toString(),
      inventoryItemId: inventoryItem.id,
      inventoryItem,
      requestedQuantity: 1,
      truckId: selectedTruck,
      truckName: trucks.find((t) => t.id === selectedTruck)?.name,
      binId: truckBinItem?.binId,
      binName: truckBinItem?.binName,
      currentStock: truckBinItem?.currentQuantity ?? 0,
      reason:
        truckBinItem?.currentQuantity &&
          truckBinItem.inventoryItem &&
          truckBinItem.currentQuantity <=
          truckBinItem.inventoryItem.lowStockThreshold
          ? "Low stock - below threshold"
          : "Additional stock needed",
      unitPrice: inventoryItem.unitPrice || 0,
      priority: isRestock ? "medium" : undefined, // Default priority for manual items in restock mode
    };
    setOrderItems([...orderItems, newOrderItem]);
    setShowItemSelection(false);
  };

  const removeItem = (id: string) => {
    setOrderItems(orderItems.filter((item) => item.id !== id));
  };

  const updateItemQuantity = (id: string, quantity: number) => {
    if (quantity > 0) {
      setOrderItems(
        orderItems.map((item) =>
          item.id === id ? { ...item, requestedQuantity: quantity } : item
        )
      );
    }
  };

  const updateItemReason = (id: string, reason: string) => {
    setOrderItems(
      orderItems.map((item) => (item.id === id ? { ...item, reason } : item))
    );
  };

  const handleSubmit = async () => {
    if (!selectedTruck || orderItems.length === 0) {
      setError("Please select a truck and add at least one item.");
      setIsSubmitting(false);
      return;
    }

    const itemsToSubmit = orderItems.filter(
      (item) => item.requestedQuantity > 0
    );
    if (itemsToSubmit.length === 0) {
      setError("No items with valid quantities to submit.");
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      let urgency = "";
      let notes = "";
      if (isRestock) {
        urgency = itemsToSubmit.some((item) => item.priority === "high")
          ? "high"
          : itemsToSubmit.some((item) => item.priority === "medium")
            ? "medium"
            : "low";
        notes = `Restock order for ${itemsToSubmit.length
          } items, total quantity: ${itemsToSubmit.reduce(
            (sum, item) => sum + item.requestedQuantity,
            0
          )}`;
      }

      const orderData = {
        timestamp: new Date().toISOString(),
        truck_id: selectedTruck,
        truckName:
          trucks.find((t) => t.id === selectedTruck)?.name || "Unknown Truck",
        urgency,
        notes,
        items: itemsToSubmit.map((item) => ({
          inventory_item_id: item.inventoryItemId,
          inventory_item_name: item.inventoryItem.name,
          quantity: item.requestedQuantity,
          unit_price: item.unitPrice,
          reason: item.reason,
        })),
        totalItems: itemsToSubmit.reduce(
          (sum, item) => sum + item.requestedQuantity,
          0
        ),
        technician: technicianName,
      };

      const response = await fetchClient("/api/orders", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create order");
      }

      const data = await response.json();
      fetchPreviousOrder();
      setOrderDetails({
        id: data.order.id,
        orderNumber: data.order.order_number || `ORDER-${Date.now()}`,
        technician: technicianName,
        email:
          user?.email || data.order?.technician_email || "no-reply@company.com",
        date: new Date().toLocaleString(),
        truck:
          trucks.find((t) => t.id === selectedTruck)?.name || "Unknown Truck",
        totalItems: itemsToSubmit.length,
        totalQuantity: itemsToSubmit.reduce(
          (sum, item) => sum + item.requestedQuantity,
          0
        ),
        items: itemsToSubmit,
      });
      setIsModalOpen(true);
      setTimeout(() => {
        console.log("Attempting redirect to /order"); // Debug log
        router.push("/order");
      }, 500);
    } catch (error) {
      console.error("Error submitting order:", error);
      setError(error instanceof Error ? error.message : "Failed to submit order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadInvoice = async () => {
    if (!orderDetails || !token) return;

    try {
      setIsDownloading(true);
      const response = await fetchClient(`/api/invoice/${orderDetails.id}`, {
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
    } catch (err) {
      console.error("Error downloading invoice:", err);
      setError("Failed to download invoice");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleEmailWithPDF = async () => {
    if (!orderDetails) return;

    try {
      setIsDownloading(true);
      const response = await fetchClient(`/api/invoice/${orderDetails.id}`, {
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

      setTimeout(() => {
        const emailSubject = `Order - ${orderDetails.orderNumber}`;
        const emailBody = `Dear Team,

Please find the order details below:

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
                `${index + 1}. ${item.inventoryItem.name}
   Category: ${item.inventoryItem.category}
   Quantity Requested: ${item.requestedQuantity}
   Current Stock: ${item.currentStock ?? "N/A"}
   Standard Level: ${item.inventoryItem.standardLevel}
   
`
            )
            .join("")}

Please process this order at your earliest convenience.

NOTE: The invoice PDF should be downloaded separately and attached to this email.

Best regards,
${orderDetails.technician}`;

        const encodedSubject = encodeURIComponent(emailSubject);
        const encodedBody = encodeURIComponent(emailBody);
        const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=&su=${encodedSubject}&body=${encodedBody}`;
        window.open(gmailUrl, "_blank");

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
      const emailSubject = `Order - ${orderDetails.orderNumber}`;
      const emailBody = `Dear Team,

Please find the order details below:

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
              `${index + 1}. ${item.inventoryItem.name}
   Category: ${item.inventoryItem.category}
   Quantity Requested: ${item.requestedQuantity}
   Current Stock: ${item.currentStock ?? "N/A"}
   Standard Level: ${item.inventoryItem.standardLevel}
   
`
          )
          .join("")}

Please process this order at your earliest convenience.

Best regards,
${orderDetails.technician}`;

      const encodedSubject = encodeURIComponent(emailSubject);
      const encodedBody = encodeURIComponent(emailBody);
      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=&su=${encodedSubject}&body=${encodedBody}`;
      window.open(gmailUrl, "_blank");
    } finally {
      setIsDownloading(false);
    }
  };

  const generatePDF = (orderData: any) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("ORDER SUMMARY", 20, 20);
    doc.setFontSize(12);
    doc.text(`Order ID: ${orderData.id}`, 20, 30);
    doc.text(`Date: ${new Date(orderData.timestamp).toLocaleString()}`, 20, 38);
    doc.text(`Truck: ${orderData.truckName}`, 20, 46);
    doc.text(`Technician: ${technicianName || "Unknown"}`, 20, 62);
    doc.setFontSize(14);
    doc.text("ITEMS ORDERED:", 20, 74);
    let y = 82;
    orderData.items.forEach((item: OrderItem, index: number) => {
      doc.setFontSize(10);
      doc.text(
        `${index + 1}. ${item.inventoryItem.name} (${item.inventoryItem.partNumber || item.inventoryItem.part_number
        })`,
        20,
        y
      );
      doc.text(
        `Quantity: ${item.requestedQuantity} ${item.inventoryItem.unit}`,
        30,
        y + 6
      );
      doc.text(`Unit Price: $${item.unitPrice.toFixed(2)}`, 30, y + 12);
      doc.text(`Current Stock: ${item.currentStock ?? "N/A"}`, 30, y + 18);
      doc.text(`Bin: ${item.binName || "General"}`, 30, y + 24);
      doc.text(`Reason: ${item.reason}`, 30, y + 30);
      doc.text(
        `Priority: ${item.priority?.toUpperCase() ?? "Manual"}`,
        30,
        y + 36
      );
      y += 42;
    });
    doc.setFontSize(12);
    doc.text(`Total Items: ${orderData.totalItems}`, 20, y);
    doc.text("Generated by TruxtoK System", 20, y + 10);
    return doc.output("blob");
  };

  const generateCSV = (orders: PreviousOrder[]) => {
    const headers = [
      "Order ID",
      "Date",
      "Truck",
      "Supply House",
      "Item Name",
      "Part Number",
      "Quantity",
      "Unit",
      "Bin",
      "Reason",
      "Priority",
      "Status",
    ];
    const rows = orders.flatMap((order) =>
      order.items.map((item) => [
        order.id,
        new Date(order.date).toLocaleDateString(),
        order.truckName,
        item.inventoryItem.name,
        item.inventoryItem.partNumber || item.inventoryItem.part_number,
        item.requestedQuantity.toString(),
        item.inventoryItem.unit,
        item.binName || "General",
        item.reason,
        item.priority?.toUpperCase() ?? "Manual",
        order.status,
      ])
    );

    const csvContent = [headers, ...rows]
      .map((row) => row.map((field) => `"${field}"`).join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    return blob;
  };

  const downloadCSV = () => {
    const csvBlob = generateCSV(previousOrders);
    const url = URL.createObjectURL(csvBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders-archive-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Pagination handlers
  const handlePreviousPage = () => {
    if (hasPreviousPage && currentPage > 1) {
      fetchPreviousOrder(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (hasNextPage && currentPage < totalPages) {
      fetchPreviousOrder(currentPage + 1);
    }
  };

  const handlePageClick = (page: number) => {
    if (page !== currentPage && page >= 1 && page <= totalPages) {
      fetchPreviousOrder(page);
    }
  };

  const totalItems = orderItems.reduce(
    (sum, item) => sum + item.requestedQuantity,
    0
  );

  if (loading || isLoadingRestock) {
    return (
      <Navigation title="Order" subtitle="Place new orders for inventory">
        <div className="flex items-center justify-center min-h-screen">
          Loading...
        </div>
      </Navigation>
    );
  }

  if (!user) {
    return null;
  }

  if (error || needsTruckSelection) {
    return (
      <Navigation title="Order" subtitle="Place new orders for inventory">
        <div className="p-4 md:p-6">
          <Card>
            <CardContent className="p-8 text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Action Required
              </h3>
              <p className="text-gray-500">{error}</p>
              {needsTruckSelection && (
                <div className="mt-6 space-y-4">
                  <Label htmlFor="truck-select">Select Truck</Label>
                  <Select
                    value={selectedTruck}
                    onValueChange={setSelectedTruck}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a truck..." />
                    </SelectTrigger>
                    <SelectContent>
                      {trucks.map((truck: Truck) => (
                        <SelectItem key={truck.id} value={truck.id}>
                          {truck.name} - {truck.location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={() => {
                      if (selectedTruck) {
                        setError(null);
                        setNeedsTruckSelection(false);
                        const queryParams = new URLSearchParams({
                          truckId: selectedTruck,
                          fromRestock: "true",
                          ...(itemId && { itemId }),
                        }).toString();
                        router.push(`/order?${queryParams}`);
                      }
                    }}
                    disabled={!selectedTruck}
                  >
                    Continue
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </Navigation>
    );
  }

  const selectedTruckData = trucks.find((t: any) => t.id === selectedTruck);
  const categories = [
    "all",
    ...Array.from(
      new Set(inventoryItems.map((item: InventoryItem) => item.category))
    ),
  ];

  const filteredInventoryItems = inventoryItems.filter(
    (item: InventoryItem) => {
      const matchesSearch =
        item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.partNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        selectedCategory === "all" || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    }
  );

  return (
    <Navigation title="Order" subtitle="Place new orders for inventory">
      <div className="p-4 md:p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <ShoppingCart className="h-5 w-5" />
              <span>{isRestock ? "Restock Order" : "New Order"}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Truck Selection */}
            <div className="space-y-2">
              <Label htmlFor="truck-select">Select Truck *</Label>
              <Select value={selectedTruck} onValueChange={setSelectedTruck}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a truck..." />
                </SelectTrigger>
                <SelectContent>
                  {trucks.map((truck: Truck) => (
                    <SelectItem key={truck.id} value={truck.id}>
                      {truck.name} - {truck.location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Current Truck Stock */}
            {selectedTruck && truckBinItems.length > 0 && (
              <div className="border rounded-lg p-4 bg-blue-50">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  Current Stock in {selectedTruckData?.name}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {truckBinItems.map((binItem) => {
                    if (!binItem.inventoryItem) {
                      console.warn(
                        `No inventoryItem found for truckBinItem: inventoryItemId=${binItem.inventoryItemId}`
                      );
                      return null; // Skip rendering if inventoryItem is undefined
                    }
                    const isLowStock =
                      binItem.currentQuantity <=
                      binItem.inventoryItem.lowStockThreshold;
                    return (
                      <div
                        key={`${binItem.binId}-${binItem.inventoryItemId}`}
                        className="flex items-center justify-between p-3 bg-white rounded border"
                      >
                        <div className="flex-1 flex-wrap">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm">
                              {binItem.inventoryItem.name}
                            </span>
                            {isLowStock && (
                              <Badge variant="destructive" className="text-xs">
                                Low Stock
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 flex items-center gap-1">
                            <Grid3X3 className="h-3 w-3" />
                            {binItem.binName}
                          </div>
                        </div>
                        <div className="text-right mr-3">
                          <div className="font-semibold text-sm">
                            {binItem.currentQuantity}
                          </div>
                          <div className="text-xs text-gray-500">
                            {binItem.inventoryItem.unit}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant={isLowStock ? "destructive" : "outline"}
                          onClick={() =>
                            addItemToOrder(binItem.inventoryItem!, binItem)
                          }
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Order
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Add Items Section */}
            <div className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Add Items to Order</h3>
                <Button
                  variant="outline"
                  onClick={() => setShowItemSelection(!showItemSelection)}
                  disabled={!selectedTruck}
                >
                  <Package className="h-4 w-4 mr-2" />
                  {showItemSelection ? "Hide" : "Browse"} Inventory
                </Button>
              </div>

              {!selectedTruck && (
                <div className="text-center py-4 text-gray-500">
                  Please select a truck first to add items to your order.
                </div>
              )}

              {showItemSelection && selectedTruck && (
                <div className="space-y-4 border-t pt-4">
                  {/* Search and Filter */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search inventory items..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select
                      value={selectedCategory}
                      onValueChange={setSelectedCategory}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category === "all" ? "All Categories" : category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Inventory Items */}
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {filteredInventoryItems.map((item: InventoryItem) => {
                      const truckBinItem = truckBinItems.find(
                        (bi) => bi.inventoryItemId === item.id
                      );
                      const isInTruck = !!truckBinItem;
                      const isLowStock =
                        truckBinItem &&
                        truckBinItem.inventoryItem &&
                        truckBinItem.currentQuantity <=
                        truckBinItem.inventoryItem.lowStockThreshold;

                      return (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-3 border rounded hover:bg-gray-50"
                        >
                          <div className="flex-1 flex-wrap">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium">{item.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {item.category}
                              </Badge>
                              {isLowStock && (
                                <Badge
                                  variant="destructive"
                                  className="text-xs"
                                >
                                  Low Stock
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-gray-500">
                              {item.partNumber || item.part_number}
                              {isInTruck && (
                                <span className="ml-2 text-blue-600">
                                  • In {truckBinItem!.binName}:{" "}
                                  {truckBinItem!.currentQuantity} {item.unit}
                                </span>
                              )}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => addItemToOrder(item, truckBinItem)}
                            variant={isLowStock ? "destructive" : "outline"}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Order Items List */}
            {orderItems.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">
                    Order Items ({totalItems} total)
                  </h3>
                  <Badge variant="secondary">{orderItems.length} items</Badge>
                </div>
                <div className="space-y-3">
                  {orderItems.map((item) => (
                    <div
                      key={item.id}
                      className="border rounded-lg p-4 grid grid-cols-1 gap-4"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 flex-wrap">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium">
                              {item.inventoryItem.name}
                            </span>
                            {/* {item.priority && (
                              <Badge
                                className={
                                  item.priority === "high"
                                    ? "bg-red-100 text-red-800"
                                    : item.priority === "medium"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-green-100 text-green-800"
                                }
                              >
                                {item.priority.toUpperCase()} Priority
                              </Badge>
                            )}
                            {!item.priority && isRestock && (
                              <Badge variant="outline" className="text-xs">
                                Manual
                              </Badge>
                            )} */}
                          </div>
                          <div className="text-sm text-gray-500">
                            {item.inventoryItem.partNumber || item.inventoryItem.part_number}
                            {item.inventoryItem.brand}
                          </div>
                          {item.binName && (
                            <div className="text-sm text-blue-600 flex items-center gap-1 mt-1">
                              <Grid3X3 className="h-3 w-3" />
                              {item.inventoryItem.category} • Current:{" "}
                              {item.currentStock ?? "N/A"}{" "}
                              {item.inventoryItem.unit}
                            </div>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs">Quantity</Label>
                          <div className="flex items-center space-x-2 mt-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                updateItemQuantity(
                                  item.id,
                                  item.requestedQuantity - 1
                                )
                              }
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-12 text-center font-medium">
                              {item.requestedQuantity} {item.inventoryItem.unit}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                updateItemQuantity(
                                  item.id,
                                  item.requestedQuantity + 1
                                )
                              }
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs">Reason</Label>
                          <Input
                            value={item.reason}
                            onChange={(e) =>
                              updateItemReason(item.id, e.target.value)
                            }
                            placeholder="Reason for ordering..."
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex flex-col md:flex-row gap-4">
              <Button
                onClick={handleSubmit}
                disabled={
                  !selectedTruck ||
                  orderItems.length === 0 ||
                  isSubmitting
                }
                className="flex-1 bg-[#E3253D] hover:bg-[#E3253D]/90"
              >
                {isSubmitting ? (
                  "Processing..."
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Submit Order & Download PDF
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Order Confirmation Modal */}
        {orderDetails && (
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="w-full max-w-lg sm:max-w-[600px] max-h-[90vh] overflow-y-auto rounded-xl">
              <DialogHeader>
                <DialogTitle className="text-lg sm:text-xl">
                  Order Confirmation
                </DialogTitle>
                <DialogDescription className="text-sm sm:text-base">
                  Your order has been successfully created. Review the details
                  below and download the invoice or share via email.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Order Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Order ID</p>
                    <p className="font-medium">{orderDetails.orderNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Technician</p>
                    <p className="font-medium">{technicianName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium break-all">{orderDetails.email}</p>
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
                    <p className="font-medium">{orderDetails.totalQuantity}</p>
                  </div>
                </div>

                {/* Items List */}
                <div>
                  <p className="text-sm text-gray-500 mb-2">Items</p>
                  <div className="space-y-2 max-h-52 sm:max-h-60 overflow-y-auto pr-2">
                    {orderDetails.items.map((item, index) => (
                      <div key={index} className="border-b pb-2">
                        <p className="font-medium">{item.inventoryItem.name}</p>
                        {/* <p className="text-sm text-gray-500">
                          Quantity: {item.requestedQuantity} • Category:{" "}
                          {item.inventoryItem.category} • Priority:{" "}
                          {item.priority?.toUpperCase() ?? "Manual"}
                        </p> */}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsModalOpen(false);
                      setSelectedTruck("");
                      setOrderItems([]);
                      setShowItemSelection(isRestock);
                      router.push("/order");
                    }}
                    className="w-full sm:w-auto"
                  >
                    Close
                  </Button>
                  <Button
                    onClick={handleDownloadInvoice}
                    variant="outline"
                    disabled={isDownloading}
                    className="w-full sm:w-auto"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {isDownloading ? "Downloading..." : "Download PDF"}
                  </Button>
                  <Button
                    onClick={handleEmailWithPDF}
                    className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
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

        {/* Previous Orders */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Previous Orders</span>
                {totalOrders > 0 && (
                  <Badge variant="outline" className="ml-2">
                    {totalOrders} total
                  </Badge>
                )}
              </CardTitle>
              <Button onClick={downloadCSV} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingOrders ? (
              <div className="text-center py-8 text-gray-500">
                Loading orders...
              </div>
            ) : previousOrders.length > 0 ? (
              <div className="space-y-4">
                {previousOrders.map((order) => (
                  <div key={order.id} className="border rounded-lg p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-3">
                      <div>
                        <div className="font-medium">{order.orderId}</div>
                        <div className="text-sm text-gray-500">
                          {new Date(order.date).toLocaleDateString()} •{" "}
                          {order.truckName}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary">
                          {order.totalItems} items
                        </Badge>
                        <Badge
                          variant={
                            order.status === "completed"
                              ? "default"
                              : "secondary"
                          }
                          className={
                            order.status === "completed" ? "bg-green-500" : ""
                          }
                        >
                          {order.status.charAt(0).toUpperCase() +
                            order.status.slice(1)}
                        </Badge>
                        
                        <div className="flex items-center mt-3 md:mt-0 md:ml-4 space-x-2">
  {!order.isStockItem && (
    <div className="relative group">
      <Button
        size="sm"
        disabled={order.status.toLowerCase() !== "confirmed"}
        className={`cursor-pointer ${
          order.status.toLowerCase() === "confirmed"
            ? "bg-green-500 hover:bg-green-600 text-white"
            : "bg-gray-300 text-gray-600 cursor-not-allowed"
        }`}
        onClick={() =>
          order.status.toLowerCase() === "confirmed" && handleStockItem(order)
        }
      >
        <Package className="h-3 w-3 mr-1" />
        Stock Item
      </Button>

      {/* Tooltip message when disabled */}
      {order.status.toLowerCase() !== "confirmed" && (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block bg-black text-white text-xs rounded-md px-2 py-1 whitespace-nowrap shadow-lg">
          Your order needs to be confirmed before adding to stock.
        </div>
      )}
    </div>
  )}

  <Button
    variant="outline"
    size="sm"
    className="bg-transparent cursor-pointer"
    onClick={() => setSelectedOrderForDetails(order)}
  >
    <Eye className="h-3 w-3 mr-1" />
    View Details
  </Button>
</div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      <strong>Items:</strong>{" "}
                      {order.items
                        .map(
                          (item) =>
                            `${item.inventoryItem.name} (${item.requestedQuantity} ${item.inventoryItem.unit})`
                        )
                        .join(", ")}
                    </div>
                  </div>
                ))}

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePreviousPage}
                        disabled={!hasPreviousPage || isLoadingOrders}
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
                              disabled={isLoadingOrders}
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
                        disabled={!hasNextPage || isLoadingOrders}
                      >
                        Next
                      </Button>
                    </div>
                    <div className="text-sm text-gray-500">
                      Page {currentPage} of {totalPages}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No previous orders found.
              </div>
            )}
          </CardContent>
        </Card>
        {/* Order Details Modal */}
        {selectedOrderForDetails && (
          <PreviousOrderDetailsModal
            order={selectedOrderForDetails}
            isOpen={!!selectedOrderForDetails}
            onClose={() => setSelectedOrderForDetails(null)}
          />
        )}
      </div>
    </Navigation>
  );
}