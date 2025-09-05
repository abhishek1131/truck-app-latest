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
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { jsPDF } from "jspdf";

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  partNumber: string;
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
}

interface PreviousOrder {
  id: string;
  date: string;
  truckId: string;
  truckName: string;
  items: OrderItem[];
  totalItems: number;
  status: string;
  supplyHouseId?: string;
}

interface SupplyHouse {
  id: string;
  name: string;
  location: string;
}

export default function OrderPage() {
  const { user, loading, token } = useAuth();
  const router = useRouter();
  const [selectedTruck, setSelectedTruck] = useState("");
  const [selectedSupplyHouse, setSelectedSupplyHouse] = useState("");
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showItemSelection, setShowItemSelection] = useState(false);
  const [trucks, setTrucks] = useState([]);
  const [supplyHouses, setSupplyHouses] = useState<SupplyHouse[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [truckBinItems, setTruckBinItems] = useState<TruckBinItem[]>([]);
  const [previousOrders, setPreviousOrders] = useState<PreviousOrder[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !token) return;

      // Fetch trucks
      try {
        const trucksResponse = await fetch("/api/orders/trucks", {
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

      // Fetch supply houses
      try {
        const supplyHousesResponse = await fetch("/api/orders/supply-houses", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const supplyHousesData = await supplyHousesResponse.json();
        if (supplyHousesResponse.ok) {
          setSupplyHouses(supplyHousesData.supplyHouses);
        } else {
          console.error(
            "Failed to fetch supply houses:",
            supplyHousesData.error,
            { status: supplyHousesResponse.status }
          );
        }
      } catch (error) {
        console.error("Error fetching supply houses:", error);
      }

      // Fetch previous orders
      try {
        const ordersResponse = await fetch("/api/orders/previous", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const ordersData = await ordersResponse.json();
        if (ordersResponse.ok) {
          setPreviousOrders(ordersData.previousOrders);
        } else {
          console.error("Failed to fetch previous orders:", ordersData.error, {
            status: ordersResponse.status,
          });
        }
      } catch (error) {
        console.error("Error fetching previous orders:", error);
      }
    };

    fetchData();
  }, [user, token, loading, router]);

  useEffect(() => {
    const fetchInventory = async () => {
      if (!selectedTruck || !token) return;

      try {
        const inventoryResponse = await fetch(
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (!user) {
    return null;
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
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.partNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        selectedCategory === "all" || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    }
  );

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
      truckName: selectedTruckData?.name,
      binId: truckBinItem?.binId,
      binName: truckBinItem?.binName,
      currentStock: truckBinItem?.currentQuantity ?? 0, // Default to 0 if undefined
      reason:
        truckBinItem?.currentQuantity &&
        truckBinItem.inventoryItem &&
        truckBinItem.currentQuantity <=
          truckBinItem.inventoryItem.lowStockThreshold
          ? "Low stock - below threshold"
          : "Additional stock needed",
      unitPrice: inventoryItem.unitPrice || 0,
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

  const generatePDF = (orderData: any) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("ORDER SUMMARY", 20, 20);
    doc.setFontSize(12);
    doc.text(`Order ID: ${orderData.id}`, 20, 30);
    doc.text(`Date: ${new Date(orderData.timestamp).toLocaleString()}`, 20, 38);
    doc.text(`Truck: ${orderData.truckName}`, 20, 46);
    doc.text(
      `Supply House: ${
        supplyHouses.find(
          (sh: SupplyHouse) => sh.id === orderData.supply_house_id
        )?.name || "Unknown"
      }`,
      20,
      54
    );
    doc.text(`Technician: ${user?.name || "Unknown"}`, 20, 62);
    doc.setFontSize(14);
    doc.text("ITEMS ORDERED:", 20, 74);
    let y = 82;
    orderData.items.forEach((item: OrderItem, index: number) => {
      doc.setFontSize(10);
      doc.text(
        `${index + 1}. ${item.inventoryItem.name} (${
          item.inventoryItem.partNumber
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
      y += 40;
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
      "Status",
    ];
    const rows = orders.flatMap((order) =>
      order.items.map((item) => [
        order.id,
        new Date(order.date).toLocaleDateString(),
        order.truckName,
        supplyHouses.find((sh: SupplyHouse) => sh.id === order.supplyHouseId)
          ?.name || "Unknown",
        item.inventoryItem.name,
        item.inventoryItem.partNumber,
        item.requestedQuantity.toString(),
        item.inventoryItem.unit,
        item.binName || "General",
        item.reason,
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

  const handleSubmit = async () => {
    if (!selectedTruck || !selectedSupplyHouse || orderItems.length === 0) {
      console.log(
        "Please select a truck, supply house, and add at least one item."
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const orderData = {
        timestamp: new Date().toISOString(),
        truck_id: selectedTruck,
        truckName: selectedTruckData?.name || "Unknown Truck",
        supply_house_id: selectedSupplyHouse,
        urgency: "normal",
        notes: "",
        items: orderItems.map((item) => ({
          inventory_item_id: item.inventoryItemId,
          bin_id: item.binId,
          quantity: item.requestedQuantity,
          unit_price: item.unitPrice,
          reason: item.reason,
        })),
        totalItems: orderItems.reduce(
          (sum, item) => sum + item.requestedQuantity,
          0
        ),
        technician: user?.first_name || "Unknown",
      };

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      const data = await response.json();
      const res = await fetch(`/api/invoice/${data.order.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `invoice-${data.order.order_number}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log({
        title: "Success",
        description: `Invoice for order #${data.order.order_number} downloaded`,
      });
    } catch (error) {
      console.error("Error submitting order:", error);
      // console.log("Error submitting order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalItems = orderItems.reduce(
    (sum, item) => sum + item.requestedQuantity,
    0
  );

  return (
    <Navigation title="Order" subtitle="Place new orders for inventory">
      <div className="p-4 md:p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <ShoppingCart className="h-5 w-5" />
              <span>New Order</span>
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
                  {trucks.map((truck: any) => (
                    <SelectItem key={truck.id} value={truck.id}>
                      {truck.name} - {truck.location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Supply House Selection */}
            <div className="space-y-2">
              <Label htmlFor="supply-house-select">Select Supply House *</Label>
              <Select
                value={selectedSupplyHouse}
                onValueChange={setSelectedSupplyHouse}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a supply house..." />
                </SelectTrigger>
                <SelectContent>
                  {supplyHouses.map((house: SupplyHouse) => (
                    <SelectItem key={house.id} value={house.id}>
                      {house.name} - {house.location}
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
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
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
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
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
                              {item.partNumber} • {item.brand}
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
                      className="border rounded-lg p minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr) gap-4"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="font-medium">
                            {item.inventoryItem.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {item.inventoryItem.partNumber} •{" "}
                            {item.inventoryItem.brand}
                          </div>
                          {item.binName && (
                            <div className="text-sm text-blue-600 flex items-center gap-1 mt-1">
                              <Grid3X3 className="h-3 w-3" />
                              {item.binName} • Current:{" "}
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
                  !selectedSupplyHouse ||
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

        {/* Previous Orders */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Previous Orders</span>
              </CardTitle>
              <Button onClick={downloadCSV} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {previousOrders.length > 0 ? (
              <div className="space-y-4">
                {previousOrders.map((order) => (
                  <div key={order.id} className="border rounded-lg p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-3">
                      <div>
                        <div className="font-medium">{order.id}</div>
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
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No previous orders found.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Navigation>
  );
}
