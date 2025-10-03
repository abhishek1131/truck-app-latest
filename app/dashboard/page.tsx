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
import {
  Truck,
  Package,
  AlertTriangle,
  ShoppingCart,
  TrendingUp,
  Calendar,
  Eye,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchClient } from "@/lib/fetchClient";

export default function DashboardPage() {
  const { user, loading, token } = useAuth();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState({
    trucks: [],
    recentOrders: [],
    stats: {
      totalTrucks: 0,
      totalItems: 0,
      totalLowStock: 0,
      totalOrders: 0,
      activeTrucks: 0,
    },
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
    if (!loading && user && (user.role === "super_admin" || user.role === "company_admin")) {
      router.push("/admin");
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user || !token) return;

      try {
        const response = await fetchClient("/api/dashboard", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();
        if (response.ok) {
          setDashboardData(data);
        } else {
          console.error("Failed to fetch dashboard data:", data.error);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };

    fetchDashboardData();
  }, [user, token]);

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

  const { trucks, recentOrders, stats } = dashboardData;
  const { totalTrucks, totalItems, totalLowStock, totalOrders, activeTrucks } = stats;

  return (
    <Navigation
      title="Dashboard"
      subtitle={`Welcome back, ${user.first_name} ${user.last_name}!`}
    >
      <div className="p-4 md:p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <Card className="bg-gradient-to-br from-[#10294B] to-[#006AA1] text-white border-0" onClick={()=> router.push('/trucks')}>
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">My Trucks</p>
                  <p className="text-2xl font-bold">{totalTrucks}</p>
                  <p className="text-xs opacity-75">
                    {activeTrucks } active
                  </p>
                </div>
                <Truck className="h-6 w-6 md:h-8 md:w-8 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0" onClick={()=> router.push('/inventory')}>
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Total Items</p>
                  <p className="text-2xl font-bold">{totalItems}</p>
                  <p className="text-xs opacity-75">Across all trucks</p>
                </div>
                <Package className="h-6 w-6 md:h-8 md:w-8 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-[#E3253D] to-red-600 text-white border-0" onClick={()=> router.push('/restock')}>
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Low Stock</p>
                  <p className="text-2xl font-bold">{totalLowStock}</p>
                  <p className="text-xs opacity-75">Items need restock</p>
                </div>
                <AlertTriangle className="h-6 w-6 md:h-8 md:w-8 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0" onClick={()=> router.push('/order')}>
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Orders</p>
                  <p className="text-2xl font-bold">{totalOrders}</p>
                  <p className="text-xs opacity-75">Total order</p>
                </div>
                <ShoppingCart className="h-6 w-6 md:h-8 md:w-8 opacity-80" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* My Trucks */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5 text-[#E3253D]" />
                    My Trucks
                  </CardTitle>
                  <CardDescription>Trucks assigned to you</CardDescription>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href="/trucks">View All</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {trucks.map((truck: any) => (
                <div
                  key={truck.id}
                  className="flex items-center justify-between p-3 md:p-4 border rounded-lg"
                >
                  <div className="flex items-center space-x-3 md:space-x-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-[#10294B] rounded-lg flex items-center justify-center text-white font-bold text-sm">
                      {truck.id.split("-")[1]}
                    </div>
                    <div>
                      <h4 className="font-semibold text-[#10294B] text-sm md:text-base">
                        {truck.name}
                      </h4>
                      <p className="text-xs md:text-sm text-gray-600">
                        {truck.items} items
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    {/* {truck.lowStock > 0 && (
                      <Badge
                        variant="destructive"
                        className="bg-red-100 text-red-800 text-xs"
                      >
                        {truck.lowStock} low stock
                      </Badge>
                    )} */}
                    <Badge
                      className={
                        truck.status === "active"
                          ? "bg-green-100 text-green-800 text-xs"
                          : "bg-yellow-100 text-yellow-800 text-xs"
                      }
                    >
                      {truck.status === "active" ? "Active" : "Needs Attention"}
                    </Badge>
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0 bg-transparent"
                    >
                      <Link href={`/trucks/${truck.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent Orders */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                    <ShoppingCart className="h-4 w-4 md:h-5 md:w-5 text-[#E3253D]" />
                    Recent Orders
                  </CardTitle>
                  <CardDescription className="text-xs md:text-sm">
                    Your latest inventory orders
                  </CardDescription>
                </div>
                <Button asChild variant="outline" size="sm" className="text-xs md:text-sm flex-shrink-0">
                  <Link href="/orders">View All</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 md:space-y-4">
              {recentOrders.map((order: any) => (
                <div
                  key={order.id}
                  className="border rounded-lg p-3 md:p-4"
                >
                  {/* Mobile Layout */}
                  <div className="block md:hidden space-y-3">
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-[#10294B] text-sm truncate">
                          Order {order.id}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {order.type}
                          </Badge>
                          <Badge
                            className={
                              order.status === "completed"
                                ? "bg-green-100 text-green-800 text-xs"
                                : "bg-yellow-100 text-yellow-800 text-xs"
                            }
                          >
                            {order.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-semibold text-green-600">
                          +${order.commission}
                        </p>
                      </div>
                    </div>
                    
                    {/* Details Row */}
                    <div className="space-y-1">
                      <p className="text-xs text-gray-600">
                        {order.items} items • {order.truck}
                      </p>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Calendar className="h-3 w-3 flex-shrink-0" />
                        {order.date}
                      </p>
                    </div>
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden md:flex md:items-center md:justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-[#10294B] text-base">
                          Order {order.id}
                        </h4>
                        <Badge variant="outline" className="text-xs">
                          {order.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        {order.items} items • {order.truck}
                      </p>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <Calendar className="h-3 w-3" />
                        {order.date}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge
                        className={
                          order.status === "completed"
                            ? "bg-green-100 text-green-800 mb-2 text-xs"
                            : "bg-yellow-100 text-yellow-800 mb-2 text-xs"
                        }
                      >
                        {order.status}
                      </Badge>
                      <p className="text-sm font-semibold text-green-600">
                        +${order.commission}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push("/order")}>
            <CardContent className="p-4 md:p-6 text-center">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-[#E3253D] rounded-lg flex items-center justify-center mx-auto mb-4">
                <ShoppingCart className="h-5 w-5 md:h-6 md:w-6 text-white" />
              </div>
              <h3 className="font-semibold text-[#10294B] mb-2">
                Manual Order
              </h3>
              <p className="text-sm text-gray-600 mb-4">Place a custom order</p>
              <Button asChild className="w-full bg-[#E3253D] hover:bg-red-600">
                <Link href="/order" onClick={(e) => e.stopPropagation()}>Create Order</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={()=> router.push('/inventory')}>
            <CardContent className="p-4 md:p-6 text-center">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-[#10294B] rounded-lg flex items-center justify-center mx-auto mb-4">
                <Package className="h-5 w-5 md:h-6 md:w-6 text-white" />
              </div>
              <h3 className="font-semibold text-[#10294B] mb-2">
                View Inventory
              </h3>
              <p className="text-sm text-gray-600 mb-4">Browse all items</p>
              <Button
                asChild
                variant="outline"
                className="w-full bg-transparent"
              >
                <Link href="/inventory" onClick={(e) => e.stopPropagation()}>View Inventory</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={()=> router.push('/restock')}>
            <CardContent className="p-4 md:p-6 text-center">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-green-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-white" />
              </div>
              <h3 className="font-semibold text-[#10294B] mb-2">
                Auto Restock
              </h3>
              <p className="text-sm text-gray-600 mb-4">Review suggestions</p>
              <Button
                asChild
                variant="outline"
                className="w-full bg-transparent"
              >
                <Link href="/restock" onClick={(e) => e.stopPropagation()}>View Restock</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </Navigation>
  );
}
