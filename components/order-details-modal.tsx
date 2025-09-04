"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Eye,
  Calendar,
  MapPin,
  Package,
  DollarSign,
  Building2,
  Clock,
  CheckCircle,
  AlertCircle,
  Download,
  MessageSquare,
  Truck,
} from "lucide-react";

interface OrderDetailsModalProps {
  order: {
    id: string;
    partName: string;
    quantity: number;
    cost: number;
    status: string;
    date: string;
    commission: number;
    credit: number;
    supplyHouse: string;
    urgency: string;
    description: string;
    orderItems: {
      id: string;
      inventoryItemId: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
      reason: string;
      inventoryItem: {
        id: string;
        partNumber: string;
        name: string;
        description: string;
        unit: string;
        supplier: string;
        category: string;
      };
      bin: {
        id: string;
        binCode: string;
        name: string;
      };
    }[];
    truck: {
      id: string;
      truckNumber: string;
      make: string;
      model: string;
    };
  };
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

export function OrderDetailsModal({ order }: OrderDetailsModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const StatusIcon =
    statusConfig[order.status as keyof typeof statusConfig]?.icon || Clock;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="w-full lg:w-auto bg-transparent"
        >
          <Eye className="h-4 w-4 mr-2" />
          View Details
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[#10294B]">
            Order Details - {order.id}
          </DialogTitle>
          <DialogDescription>
            Complete information about your parts order
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Urgency */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge
                className={
                  statusConfig[order.status as keyof typeof statusConfig]?.color
                }
              >
                <StatusIcon className="h-3 w-3 mr-1" />
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </Badge>
              <Badge
                className={
                  urgencyConfig[order.urgency as keyof typeof urgencyConfig]
                    ?.color
                }
              >
                {order.urgency.charAt(0).toUpperCase() + order.urgency.slice(1)}{" "}
                Priority
              </Badge>
            </div>
            <div className="text-sm text-gray-500 flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {order.date}
            </div>
          </div>

          {/* Part Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-[#10294B] mb-3 flex items-center gap-2">
              <Package className="h-5 w-5" />
              Part Information
            </h3>
            <div className="space-y-2">
              <div>
                <span className="text-sm font-medium text-gray-600">
                  Items:
                </span>
                <ul className="list-disc pl-5">
                  {order.orderItems.map((item) => (
                    <li key={item.id} className="text-lg font-semibold">
                      {item.inventoryItem?.name} ({item?.quantity}{" "}
                      {item.inventoryItem?.unit})
                    </li>
                  ))}
                </ul>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-600">
                    Total Quantity:
                  </span>
                  <p className="font-semibold">{order.quantity} units</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">
                    Total Cost:
                  </span>
                  <p className="font-semibold text-lg">
                    ${order.cost.toFixed(2)}
                  </p>
                </div>
              </div>
              {order.description && (
                <div>
                  <span className="text-sm font-medium text-gray-600">
                    Description:
                  </span>
                  <p className="text-gray-800">{order.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Supply House Information */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold text-[#10294B] mb-3 flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Supply House
            </h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{order.supplyHouse}</p>
                <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                  <MapPin className="h-3 w-3" />
                  {order.supplyHouse} Location
                </p>
              </div>
              <Button variant="outline" size="sm">
                <MessageSquare className="h-4 w-4 mr-2" />
                Contact
              </Button>
            </div>
          </div>

          {/* Truck Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-[#10294B] mb-3 flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Truck Information
            </h3>
            <div className="space-y-2">
              <div>
                <span className="text-sm font-medium text-gray-600">
                  Truck:
                </span>
                <p className="font-semibold">{order.truck.truckNumber}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-600">
                    Make:
                  </span>
                  <p className="font-semibold">{order.truck.make}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">
                    Model:
                  </span>
                  <p className="font-semibold">{order.truck.model}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Financial Information */}
          <div className="bg-green-50 rounded-lg p-4">
            <h3 className="font-semibold text-[#10294B] mb-3 flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Financial Breakdown
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Order Value:</span>
                  <span className="font-medium">${order.cost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">
                    Commission (3%):
                  </span>
                  <span className="font-medium text-blue-600">
                    ${order.commission.toFixed(2)}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-800">
                    Your Credit (25%):
                  </span>
                  <span className="font-bold text-green-600">
                    ${order.credit.toFixed(2)}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    +${order.credit.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600">Credits Earned</div>
                </div>
              </div>
            </div>
          </div>

          {/* Order Timeline */}
          <div>
            <h3 className="font-semibold text-[#10294B] mb-3 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Order Timeline
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">Order Placed</p>
                  <p className="text-sm text-gray-600">
                    {order.date} at 10:30 AM
                  </p>
                </div>
              </div>
              {order.status !== "pending" && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Package className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Order Confirmed</p>
                    <p className="text-sm text-gray-600">
                      {order.date} at 11:15 AM
                    </p>
                  </div>
                </div>
              )}
              {(order.status === "shipped" || order.status === "completed") && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <Package className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium">Order Shipped</p>
                    <p className="text-sm text-gray-600">
                      {order.date} at 2:45 PM
                    </p>
                  </div>
                </div>
              )}
              {order.status === "completed" && (
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Order Completed</p>
                    <p className="text-sm text-gray-600">
                      {order.date} at 4:20 PM
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button className="flex-1 bg-[#E3253D] hover:bg-[#E3253D]/90">
              <Download className="h-4 w-4 mr-2" />
              Download Invoice
            </Button>
            <Button variant="outline" className="flex-1 bg-transparent">
              <MessageSquare className="h-4 w-4 mr-2" />
              Contact Support
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
