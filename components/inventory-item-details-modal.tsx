"use client";

import type React from "react";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  Truck,
  Calendar,
  AlertTriangle,
  MapPin,
  Clock,
  Grid3X3,
} from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { useRouter } from "next/navigation";

interface InventoryItem {
  internalId: string;
  id: string;
  name: string;
  category: string;
  totalQuantity: number;
  lowStockThreshold: number;
  lastOrdered: string;
  trucks: string[];
  notes: string;
  unit?: string;
  partNumber?: string;
  brand?: string;
  unitCost?: number;
  supplier?: string;
  lastRestocked?: string;
  averageUsage?: string;
  truckBinDistribution?: {
    truckId: string;
    truckName: string;
    location: string;
    bins: { binId: string; binName: string; quantity: number }[];
  }[];
  recentActivity?: {
    date: string;
    action: string;
    quantity: number;
    truck: string;
    bin: string;
  }[];
}

interface InventoryItemDetailsModalProps {
  item: InventoryItem;
  children: React.ReactNode;
}

export function InventoryItemDetailsModal({
  item,
  children,
}: InventoryItemDetailsModalProps) {
  const { token } = useAuth();
  const [open, setOpen] = useState(false);
  const [detailedItem, setDetailedItem] = useState<InventoryItem>(item);
  const router = useRouter();

  useEffect(() => {
    if (open) {
      const fetchDetails = async () => {
        try {
          const response = await fetch(
            `/api/inventory?item=${item.internalId}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          if (response.ok) {
            const data = await response.json();
            setDetailedItem({ ...item, ...data });
          } else {
            console.error("Failed to fetch item details");
          }
        } catch (error) {
          console.error("Error fetching item details:", error);
        }
      };
      fetchDetails();
    }
  }, [open, item.internalId, token]);

  const isLowStock =
    detailedItem.totalQuantity <= detailedItem.lowStockThreshold;
  const totalQuantityCalculated = detailedItem.truckBinDistribution
    ? detailedItem.truckBinDistribution.reduce(
        (total, truck) =>
          total +
          truck.bins.reduce((binTotal, bin) => binTotal + bin.quantity, 0),
        0
      )
    : detailedItem.totalQuantity;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {detailedItem.name}
            {isLowStock && (
              <Badge variant="destructive" className="bg-red-100 text-red-800">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Low Stock
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Item Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Item ID</p>
                  <p className="text-base">{detailedItem.id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Part Number
                  </p>
                  <p className="text-base">
                    {detailedItem.partNumber || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Category</p>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700">
                    {detailedItem.category}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Brand</p>
                  <p className="text-base">{detailedItem.brand || "N/A"}</p>
                </div>
                {detailedItem.unitCost && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Unit Cost
                    </p>
                    <p className="text-base">
                      ${detailedItem.unitCost}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-500">Unit</p>
                  <p className="text-base">{detailedItem.unit || "pieces"}</p>
                </div>
                {detailedItem.supplier && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Supplier
                    </p>
                    <p className="text-base">{detailedItem.supplier}</p>
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Notes</p>
                <p className="text-base">
                  {detailedItem.notes || "No notes available"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Stock Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Stock Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">
                    {totalQuantityCalculated}
                  </p>
                  <p className="text-sm text-blue-600">
                    Total Across All Trucks
                  </p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <p className="text-2xl font-bold text-orange-600">
                    {detailedItem.lowStockThreshold}
                  </p>
                  <p className="text-sm text-orange-600">Low Stock Alert</p>
                </div>
                {detailedItem.averageUsage && (
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">
                      {detailedItem.averageUsage}
                    </p>
                    <p className="text-sm text-green-600">Average Usage</p>
                  </div>
                )}
              </div>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">
                    Last Ordered: {detailedItem.lastOrdered}
                  </span>
                </div>
                {detailedItem.lastRestocked && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">
                      Last Restocked: {detailedItem.lastRestocked}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Truck & Bin Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Truck & Bin Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              {detailedItem.truckBinDistribution &&
              detailedItem.truckBinDistribution.length > 0 ? (
                <div className="space-y-4">
                  {detailedItem.truckBinDistribution.map((truck) => (
                    <div key={truck.truckId} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#10294B] rounded-lg flex items-center justify-center">
                            <Truck className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="font-medium">{truck.truckName}</p>
                            <p className="text-sm text-gray-500 flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {truck.location || "N/A"}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-[#10294B]">
                            {truck.bins.reduce(
                              (total, bin) => total + bin.quantity,
                              0
                            )}{" "}
                            {detailedItem.unit || "pieces"}
                          </p>
                          <p className="text-xs text-gray-500">
                            Total in truck
                          </p>
                        </div>
                      </div>
                      <div className="ml-13 space-y-2">
                        {truck.bins.map((bin) => (
                          <div
                            key={bin.binId}
                            className="flex items-center justify-between p-2 bg-gray-50 rounded"
                          >
                            <div className="flex items-center gap-2">
                              <Grid3X3 className="h-4 w-4 text-gray-400" />
                              <span className="text-sm font-medium">
                                {bin.binName}
                              </span>
                            </div>
                            <span className="text-sm font-semibold text-gray-700">
                              {bin.quantity} {detailedItem.unit || "pieces"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  No truck or bin distribution data available
                </p>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          {/* <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {detailedItem.recentActivity &&
              detailedItem.recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {detailedItem.recentActivity.map((activity, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border-l-4 border-l-blue-200 bg-blue-50/30"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            activity.action === "Used"
                              ? "bg-red-100 text-red-600"
                              : "bg-green-100 text-green-600"
                          }`}
                        >
                          {activity.action === "Used" ? "-" : "+"}
                        </div>
                        <div>
                          <p className="font-medium">
                            {activity.action} {activity.quantity}{" "}
                            {detailedItem.unit || "pieces"}
                          </p>
                          <p className="text-sm text-gray-500">
                            {activity.truck} • {activity.bin}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">{activity.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  No recent activity available
                </p>
              )}
            </CardContent>
          </Card> */}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Close
            </Button>
            <Button className="bg-[#E3253D] hover:bg-[#E3253D]/90" onClick={()=> router.push('/order')}>
              Order More
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
