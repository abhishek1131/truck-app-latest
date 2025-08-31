"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Navigation } from "@/components/layout/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Truck,
  Search,
  Package,
  AlertTriangle,
  Grid3X3,
  ArrowLeft,
  ShoppingCart,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";
import { AddBinModal } from "@/components/add-bin-modal";
import { StandardInventoryModal } from "@/components/standard-inventory-modal";
import { useAuth } from "@/components/auth-provider";

export default function TruckDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading, token } = useAuth();
  const truckId = params.id as string;
  const [searchTerm, setSearchTerm] = useState("");
  const [truck, setTruck] = useState<any>(null);
  const [bins, setBins] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchTruck = async () => {
      if (!user || !token) return;

      try {
        const response = await fetch(`/api/technician/trucks/${truckId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (response.ok) {
          setTruck(data);
          setBins(data.binsData);
        } else {
          console.error("Failed to fetch truck:", data.error);
          router.push("/trucks");
        }
      } catch (error) {
        console.error("Error fetching truck:", error);
        router.push("/trucks");
      }
    };

    fetchTruck();
  }, [user, token, truckId, router]);

  const getBackUrl = () => {
    return user?.role === "admin" ? "/admin/trucks" : "/trucks";
  };

  const getBackLabel = () => {
    return user?.role === "admin"
      ? "Back to Fleet Management"
      : "Back to Trucks";
  };

  if (loading || !truck) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  const filteredBins = bins.filter(
    (bin: any) =>
      bin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bin.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bin.categories.some((cat: string) =>
        cat.toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

  const handleBinAdded = (newBin: any) => {
    setBins([...bins, newBin]);
  };

  const handleStandardLevelsSet = (levels: any) => {
    console.log("Standard levels set:", levels);
    // In real app, this would save to backend
  };

  return (
    <Navigation
      title={truck.name}
      subtitle={`${truck.location} • ${truck.status}`}
    >
      <div className="p-4 md:p-6 space-y-6">
        {/* Back Button */}
        <div className="flex items-center space-x-4">
          <Link href={getBackUrl()}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {getBackLabel()}
            </Button>
          </Link>
        </div>

        {/* Truck Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Items
                  </p>
                  <p className="text-2xl md:text-3xl font-bold text-gray-900">
                    {truck.totalItems}
                  </p>
                  <p className="text-xs md:text-sm text-gray-500">
                    In this truck
                  </p>
                </div>
                <div className="p-2 md:p-3 rounded-lg bg-green-500">
                  <Package className="h-5 w-5 md:h-6 md:w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Storage Bins
                  </p>
                  <p className="text-2xl md:text-3xl font-bold text-gray-900">
                    {truck.bins}
                  </p>
                  <p className="text-xs md:text-sm text-gray-500">
                    Compartments
                  </p>
                </div>
                <div className="p-2 md:p-3 rounded-lg bg-blue-500">
                  <Grid3X3 className="h-5 w-5 md:h-6 md:w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Low Stock</p>
                  <p className="text-2xl md:text-3xl font-bold text-gray-900">
                    {truck.lowStockItems}
                  </p>
                  <p className="text-xs md:text-sm text-gray-500">
                    Need restock
                  </p>
                </div>
                <div className="p-2 md:p-3 rounded-lg bg-red-500">
                  <AlertTriangle className="h-5 w-5 md:h-6 md:w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Status</p>
                  <p className="text-lg md:text-xl font-bold text-green-600">
                    {truck.status}
                  </p>
                  <p className="text-xs md:text-sm text-gray-500">
                    Updated {truck.lastUpdated}
                  </p>
                </div>
                <div className="p-2 md:p-3 rounded-lg bg-purple-500">
                  <Truck className="h-5 w-5 md:h-6 md:w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Link href={`/order?truckId=${truckId}`}>
                <Button
                  variant="outline"
                  className="h-16 flex flex-col space-y-2 w-full bg-transparent"
                >
                  <ShoppingCart className="h-5 w-5" />
                  <span className="text-xs">Order Items</span>
                </Button>
              </Link>
              <Link href="/restock">
                <Button
                  variant="outline"
                  className="h-16 flex flex-col space-y-2 w-full bg-transparent"
                >
                  <RotateCcw className="h-5 w-5" />
                  <span className="text-xs">Restock</span>
                </Button>
              </Link>
              <AddBinModal truckId={truckId} onBinAdded={handleBinAdded} />
              <StandardInventoryModal
                truckId={truckId}
                onStandardLevelsSet={handleStandardLevelsSet}
              />
            </div>
          </CardContent>
        </Card>

        {/* Search Bins */}
        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search bins by name, location, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Bins Grid */}
        <div className="grid gap-4 md:gap-6">
          {filteredBins.map((bin: any) => (
            <Card key={bin.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4 md:p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-[#10294B] rounded-lg flex items-center justify-center">
                      <Grid3X3 className="h-6 w-6 md:h-8 md:w-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg md:text-xl font-semibold text-gray-900">
                        {bin.name} ({bin.code})
                      </h3>
                      <p className="text-sm text-gray-500">{bin.location}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {bin.categories.map((category: string) => (
                          <Badge
                            key={category}
                            variant="secondary"
                            className="text-xs"
                          >
                            {category}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Updated {bin.lastUpdated}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row items-start md:items-center space-y-3 md:space-y-0 md:space-x-6">
                    <div className="flex space-x-4 md:space-x-6">
                      <div className="text-center">
                        <p className="text-lg md:text-xl font-bold text-gray-900">
                          {bin.totalItems}
                        </p>
                        <p className="text-xs text-gray-500">Items</p>
                      </div>
                      <div className="text-center">
                        <p
                          className={`text-lg md:text-xl font-bold ${
                            bin.lowStockItems > 0
                              ? "text-red-600"
                              : "text-green-600"
                          }`}
                        >
                          {bin.lowStockItems}
                        </p>
                        <p className="text-xs text-gray-500">Low Stock</p>
                      </div>
                    </div>

                    <div className="flex flex-col space-y-2">
                      {bin.lowStockItems > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          Needs Restock
                        </Badge>
                      )}
                      <Link href={`/trucks/${truckId}/bins/${bin.id}`}>
                        <Button
                          size="sm"
                          className="w-full bg-[#E3253D] hover:bg-[#E3253D]/90"
                        >
                          View Contents
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredBins.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Grid3X3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No bins found
              </h3>
              <p className="text-gray-500">
                Try adjusting your search terms or add a new bin.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </Navigation>
  );
}
