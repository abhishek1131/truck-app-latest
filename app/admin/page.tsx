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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  BarChart3,
  PieChart,
  Activity,
  Download,
  Settings,
  Truck,
  UserCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Stats {
  totalTechnicians: number;
  activeTechnicians: number;
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  monthlyRevenue: number;
  totalCredits: number;
  pendingRedemptions: number;
}

interface Activity {
  id: string;
  type: "order" | "technician" | "redemption" | "supply_house";
  message: string;
  time: string;
  status: "new" | "success" | "pending" | "info";
}

interface TopPerformer {
  name: string;
  orders: number;
  credits: number;
  efficiency: number;
}

interface DashboardData {
  stats: Stats;
  recentActivity: Activity[];
  topPerformers: TopPerformer[];
}

export default function AdminDashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && user.role === "admin") {
      const fetchDashboardData = async () => {
        try {
          const token = localStorage.getItem("access_token");
          if (!token) {
            setError("No authentication token found");
            return;
          }

          const response = await fetch("/api/admin/dashboard", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          const result = await response.json();
          if (result.success && result.data) {
            setDashboardData(result.data);
          } else {
            setError(result.error || "Failed to fetch dashboard data");
          }
        } catch (err) {
          console.error("Dashboard fetch error:", err);
          setError("An error occurred while fetching dashboard data");
        }
      };

      fetchDashboardData();
    }
  }, [user]);

  if (loading || !dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return null;
  }

  const { stats, recentActivity, topPerformers } = dashboardData;

  return (
    <Navigation
      title="Admin Dashboard"
      subtitle="Comprehensive overview of your TruXtoK platform"
    >
      <div className="p-4 md:p-6 space-y-6">
        {error && (
          <div className="bg-red-100 text-red-800 p-4 rounded-lg">{error}</div>
        )}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex items-center gap-2 bg-transparent"
            >
              <Download className="h-4 w-4" />
              Export Data
            </Button>
            <Button className="bg-[#E3253D] hover:bg-[#E3253D]/90 flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <Card className="bg-gradient-to-br from-[#10294B] to-[#006AA1] text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">
                Total Technicians
              </CardTitle>
              <Users className="h-4 w-4 opacity-90" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTechnicians}</div>
              <p className="text-xs opacity-75">
                <span className="text-green-300">
                  {stats.activeTechnicians} active
                </span>
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">
                Total Orders
              </CardTitle>
              <ShoppingCart className="h-4 w-4 opacity-90" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalOrders.toLocaleString()}
              </div>
              <p className="text-xs opacity-75">
                <span className="text-yellow-300">
                  {stats.pendingOrders} pending
                </span>
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-[#E3253D] to-red-600 text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">
                Total Revenue
              </CardTitle>
              <DollarSign className="h-4 w-4 opacity-90" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${stats.totalRevenue.toLocaleString()}
              </div>
              <p className="text-xs opacity-75">
                <span className="text-green-300">
                  +${stats.monthlyRevenue.toLocaleString()} this month
                </span>
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">
                Credits Issued
              </CardTitle>
              <TrendingUp className="h-4 w-4 opacity-90" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${stats.totalCredits.toLocaleString()}
              </div>
              <p className="text-xs opacity-75">
                <span className="text-yellow-300">
                  {stats.pendingRedemptions} pending redemptions
                </span>
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <Card className="lg:col-span-2 border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-[#E3253D]" />
                Recent Activity
              </CardTitle>
              <CardDescription>
                Latest platform activities and updates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        activity.status === "success"
                          ? "bg-green-100"
                          : activity.status === "pending"
                          ? "bg-yellow-100"
                          : activity.status === "new"
                          ? "bg-blue-100"
                          : "bg-gray-100"
                      }`}
                    >
                      {activity.status === "success" && (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      )}
                      {activity.status === "pending" && (
                        <Clock className="h-4 w-4 text-yellow-600" />
                      )}
                      {activity.status === "new" && (
                        <AlertCircle className="h-4 w-4 text-blue-600" />
                      )}
                      {activity.status === "info" && (
                        <Activity className="h-4 w-4 text-gray-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.message}
                      </p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-[#006AA1]" />
                Quick Stats
              </CardTitle>
              <CardDescription>Key performance indicators</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Active Rate</span>
                <Badge className="bg-green-100 text-green-800">
                  {(
                    (stats.activeTechnicians / stats.totalTechnicians) *
                    100
                  ).toFixed(1)}
                  %
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Avg Order Value</span>
                <span className="text-sm font-semibold">
                  ${(stats.totalRevenue / stats.totalOrders).toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Credit Rate</span>
                <span className="text-sm font-semibold">
                  {((stats.totalCredits / stats.totalRevenue) * 100).toFixed(2)}
                  %
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Monthly Growth</span>
                <Badge className="bg-blue-100 text-blue-800">+12.5%</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Performers */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-[#10294B]" />
              Top Performing Technicians
            </CardTitle>
            <CardDescription>
              Leading technicians by orders and efficiency
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topPerformers.map((performer, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-10 h-10 bg-[#10294B] text-white rounded-full font-bold">
                      #{index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {performer.name}
                      </div>
                      <div className="text-sm text-gray-600">
                        {performer.orders} orders completed
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="text-right">
                      <div className="text-sm font-medium text-green-600">
                        ${performer.credits.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">
                        Credits earned
                      </div>
                    </div>
                    <Badge
                      className={`${
                        performer.efficiency >= 95
                          ? "bg-green-100 text-green-800"
                          : performer.efficiency >= 90
                          ? "bg-blue-100 text-blue-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {performer.efficiency}% efficiency
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Action Cards */}
        <div className="grid md:grid-cols-4 gap-6">
          <Link href="/admin/trucks">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
              <CardHeader className="text-center">
                <div className="w-12 h-12 bg-[#10294B] rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Truck className="h-6 w-6 text-white" />
                </div>
                <CardTitle>Fleet Management</CardTitle>
                <CardDescription>Manage trucks and assignments</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button className="w-full bg-[#10294B] hover:bg-[#006AA1]">
                  <Badge className="mr-2 bg-green-100 text-green-800 text-xs">
                    New
                  </Badge>
                  Manage Fleet
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/users">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
              <CardHeader className="text-center">
                <div className="w-12 h-12 bg-[#E3253D] rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage all system users</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button className="w-full bg-[#E3253D] hover:bg-[#E3253D]/90">
                  <Badge className="mr-2 bg-green-100 text-green-800 text-xs">
                    New
                  </Badge>
                  Manage Users
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/technicians">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
              <CardHeader className="text-center">
                <div className="w-12 h-12 bg-[#006AA1] rounded-lg flex items-center justify-center mx-auto mb-4">
                  <UserCheck className="h-6 w-6 text-white" />
                </div>
                <CardTitle>Technicians</CardTitle>
                <CardDescription>Manage technician accounts</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button className="w-full bg-[#006AA1] hover:bg-[#006AA1]/90">
                  View Technicians
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <PieChart className="h-6 w-6 text-white" />
              </div>
              <CardTitle>Analytics</CardTitle>
              <CardDescription>Detailed reports and insights</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button className="w-full bg-purple-600 hover:bg-purple-700">
                View Reports
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </Navigation>
  );
}
