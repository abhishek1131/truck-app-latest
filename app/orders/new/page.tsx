"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth-provider";
import { Header } from "@/components/layout/header";
import { Navigation } from "@/components/layout/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Calculator, ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";

interface SupplyHouse {
  id: string;
  name: string;
  location: string;
}

export default function NewOrderPage() {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [formData, setFormData] = useState({
    partName: "",
    quantity: "",
    estimatedCost: "",
    supplyHouseId: "",
    description: "",
    urgency: "normal",
    requiresApproval: false, 
  });
  const [supplyHouses, setSupplyHouses] = useState<SupplyHouse[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchSupplyHouses = async () => {
      if (!user || !token) return;

      try {
        const response = await fetch("/api/orders/supply-houses", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();

        if (response.ok) {
          setSupplyHouses(data.supplyHouses);
        } else {
          console.error("Failed to fetch supply houses:", data.error);
          toast({
            title: "Error",
            description: "Failed to fetch supply houses.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error fetching supply houses:", error);
        toast({
          title: "Error",
          description: "Error fetching supply houses.",
          variant: "destructive",
        });
      }
    };

    fetchSupplyHouses();
  }, [user, token, toast]);

  const calculateCommission = () => {
    const cost = parseFloat(formData.estimatedCost) || 0;
    const commission = cost * 0.03; // 3% commission
    const techCredit = commission * 0.25; // 25% of commission
    return { commission, techCredit };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          truck_id: null, // New orders don't require truck_id
          supply_house_id: formData.supplyHouseId,
          urgency: formData.urgency,
          notes: formData.description,
          requires_approval: formData.requiresApproval,
          items: [
            {
              inventory_item_name: formData.partName,
              quantity: parseInt(formData.quantity) || 1,
              unit_price:
                parseFloat(formData.estimatedCost) /
                  (parseInt(formData.quantity) || 1) || 0,
              reason: "Manual order",
            },
          ],
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const { commission, techCredit } = calculateCommission();
        toast({
          title: "Order submitted successfully!",
          description: `Your order has been sent to the supply house. You'll earn $${techCredit.toFixed(
            2
          )} in credits.`,
        });
        router.push("/dashboard");
      } else {
        throw new Error(data.error || "Failed to submit order");
      }
    } catch (error) {
      console.error("Error submitting order:", error);
      toast({
        title: "Error",
        description: "Failed to submit order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const { commission, techCredit } = calculateCommission();

  return (
    <Navigation
      title="Order Management"
      subtitle="Monitor and manage all orders across technicians and trucks"
    >
      <div className="min-h-screen bg-gray-50">
        <div className="flex">
          <main className="flex-1 p-6">
            <div className="max-w-2xl mx-auto">
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-truxtok-navy mb-2">
                  Create New Order
                </h1>
                <p className="text-gray-600">
                  Submit a new parts order and earn credits
                </p>
              </div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Order Details
                  </CardTitle>
                  <CardDescription>
                    Fill out the form below to submit your parts order
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="partName">Part Name *</Label>
                        <Input
                          id="partName"
                          placeholder="e.g., HVAC Filter Set"
                          value={formData.partName}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              partName: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="quantity">Quantity *</Label>
                        <Input
                          id="quantity"
                          type="number"
                          min="1"
                          placeholder="1"
                          value={formData.quantity}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              quantity: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="estimatedCost">Estimated Cost *</Label>
                        <Input
                          id="estimatedCost"
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={formData.estimatedCost}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              estimatedCost: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="urgency">Urgency</Label>
                        <Select
                          value={formData.urgency}
                          onValueChange={(value) =>
                            setFormData({ ...formData, urgency: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="supplyHouse">Supply House *</Label>
                      <Select
                        value={formData.supplyHouseId}
                        onValueChange={(value) =>
                          setFormData({ ...formData, supplyHouseId: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a supply house" />
                        </SelectTrigger>
                        <SelectContent>
                          {supplyHouses.map((house) => (
                            <SelectItem key={house.id} value={house.id}>
                              {house.name} - {house.location}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Additional Notes 222</Label>
                      <Textarea
                        id="description"
                        placeholder="Any additional details or specifications..."
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            description: e.target.value,
                          })
                        }
                        rows={3}
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        id="requiresApproval"
                        type="checkbox"
                        checked={formData.requiresApproval}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            requiresApproval: e.target.checked,
                          })
                        }
                        className="h-4 w-4 border-gray-300 rounded"
                      />
                      <Label htmlFor="requiresApproval">
                        This order requires approval
                      </Label>
                    </div>

                    {formData.estimatedCost && (
                      <Card className="bg-green-50 border-green-200">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Calculator className="h-5 w-5" />
                            Commission Breakdown
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex justify-between">
                            <span>Order Value:</span>
                            <span className="font-medium">
                              ${parseFloat(formData.estimatedCost).toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Commission (3%):</span>
                            <span className="font-medium">
                              ${commission.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between text-green-700 font-semibold">
                            <span>Your Credit (25% of commission):</span>
                            <span>${techCredit.toFixed(2)}</span>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    <div className="flex gap-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.back()}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 bg-truxtok-red hover:bg-red-600"
                      >
                        {isSubmitting ? "Submitting..." : "Submit Order"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </Navigation>
  );
}
