"use client";

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
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  DollarSign,
  TrendingUp,
  Gift,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle,
  AlertCircle,
  Star,
  Target,
  Award,
  ShoppingCart,
} from "lucide-react";
import { useState, useEffect } from "react";

const achievements = [
  {
    title: "First Order",
    description: "Completed your first order",
    earned: true,
    icon: Star,
    color: "text-yellow-500",
  },
  {
    title: "Credit Collector",
    description: "Earned $100 in credits",
    earned: true,
    icon: DollarSign,
    color: "text-green-500",
  },
  {
    title: "High Roller",
    description: "Single order over $500",
    earned: false,
    icon: Target,
    color: "text-gray-400",
  },
  {
    title: "Monthly Champion",
    description: "Top performer this month",
    earned: true,
    icon: Award,
    color: "text-purple-500",
  },
];

export default function CreditsPage() {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [creditsData, setCreditsData] = useState({
    credits: [],
    balance: 0,
    pagination: { page: 1, limit: 20, total: 0, pages: 0 },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCredits = async () => {
      if (!user || !token) return;

      try {
        setLoading(true);
        const response = await fetch(`/api/credits?page=1&limit=20`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();

        if (response.ok) {
          setCreditsData(data);
        } else {
          console.error("Failed to fetch credits:", data.error);
        }
      } catch (error) {
        console.error("Error fetching credits:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCredits();
  }, [user, token]);

  const { credits, balance: currentBalance } = creditsData;

  // Calculate totals from API data
  const totalEarned = credits
    .filter((item: any) => item.type === "earned" || item.type === "bonus")
    .reduce((sum: number, item: any) => sum + item.amount, 0);

  const totalRedeemed = Math.abs(
    credits
      .filter(
        (item: any) => item.type === "spent" || item.status === "redeemed"
      )
      .reduce((sum: number, item: any) => sum + item.amount, 0)
  );

  // Filter redemption requests (credits with type 'spent' or status 'pending_redemption')
  const redemptionRequests = credits.filter(
    (item: any) => item.type === "spent" || item.status === "pending_redemption"
  );

  const monthlyGoal = 200; // Static for now, could be fetched from an API
  const progressToGoal = (currentBalance / monthlyGoal) * 100;

  // Calculate monthly earnings (credits from this month)
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const monthlyEarnings = credits
    .filter(
      (item: any) =>
        item.date.startsWith(currentMonth) &&
        (item.type === "earned" || item.type === "bonus")
    )
    .reduce((sum: number, item: any) => sum + item.amount, 0);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>Please log in to view your credits.</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Header />
      <div className="flex">
        <Navigation  />
        <main className="flex-1 p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#10294B] mb-2">
              Credit Management
            </h1>
            <p className="text-gray-600">
              Track your earnings, redeem credits, and view your rewards
            </p>
          </div>

          {/* Credit Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium opacity-90">
                  Current Balance
                </CardTitle>
                <DollarSign className="h-4 w-4 opacity-90" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  ${currentBalance}
                </div>
                <p className="text-xs opacity-75">Available for redemption</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-[#10294B] to-[#006AA1] text-white border-0 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium opacity-90">
                  Total Earned
                </CardTitle>
                <TrendingUp className="h-4 w-4 opacity-90" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  ${totalEarned}
                </div>
                <p className="text-xs opacity-75">All time earnings</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-[#E3253D] to-red-600 text-white border-0 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium opacity-90">
                  Total Redeemed
                </CardTitle>
                <Gift className="h-4 w-4 opacity-90" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  ${totalRedeemed}
                </div>
                <p className="text-xs opacity-75">Lifetime redemptions</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium opacity-90">
                  This Month
                </CardTitle>
                <Calendar className="h-4 w-4 opacity-90" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  ${monthlyEarnings}
                </div>
                <p className="text-xs opacity-75">Current month earnings</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-3 gap-6 mb-8">
            {/* Monthly Goal Progress */}
            <Card className="lg:col-span-2 border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-[#E3253D]" />
                  Monthly Goal Progress
                </CardTitle>
                <CardDescription>
                  Track your progress towards this month's credit goal
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Goal: ${monthlyGoal}
                  </span>
                  <span className="text-sm text-gray-600">
                    ${currentBalance} / ${monthlyGoal}
                  </span>
                </div>
                <Progress value={progressToGoal} className="h-3" />
                <div className="flex justify-between text-xs text-gray-600">
                  <span>{progressToGoal}% Complete</span>
                  <span>
                    ${(monthlyGoal - currentBalance)} to go
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Redeem your credits</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full bg-[#E3253D] hover:bg-[#E3253D]/90 text-white">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Redeem Cash
                </Button>
                <Button variant="outline" className="w-full bg-transparent">
                  <Gift className="h-4 w-4 mr-2" />
                  Gift Cards
                </Button>
                <Button variant="outline" className="w-full bg-transparent">
                  <Award className="h-4 w-4 mr-2" />
                  Rewards Store
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Tabs Navigation */}
          <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
            {[
              { id: "overview", label: "Overview" },
              { id: "history", label: "Credit History" },
              { id: "redemptions", label: "Redemptions" },
              { id: "achievements", label: "Achievements" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-white text-[#10294B] shadow-sm"
                    : "text-gray-600 hover:text-[#10294B]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === "overview" && (
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Credit Breakdown Chart */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Credit Breakdown</CardTitle>
                  <CardDescription>
                    How you've earned your credits
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <ShoppingCart className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <div className="font-medium">Order Commissions</div>
                          <div className="text-sm text-gray-600">
                            From completed orders
                          </div>
                        </div>
                      </div>
                      <div className="text-lg font-bold text-green-600">
                        $
                        {credits
                          .filter((item: any) => item.type === "earned")
                          .reduce(
                            (sum: number, item: any) => sum + item.amount,
                            0
                          )
                          }
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Award className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium">Performance Bonuses</div>
                          <div className="text-sm text-gray-600">
                            Monthly achievements
                          </div>
                        </div>
                      </div>
                      <div className="text-lg font-bold text-blue-600">
                        $
                        {credits
                          .filter((item: any) => item.type === "bonus")
                          .reduce(
                            (sum: number, item: any) => sum + item.amount,
                            0
                          )
                          }
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Credit Activity */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>
                    Your latest credit transactions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {credits.slice(0, 4).map((item: any) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              item.type === "earned" || item.type === "bonus"
                                ? "bg-green-100"
                                : "bg-red-100"
                            }`}
                          >
                            {item.type === "earned" || item.type === "bonus" ? (
                              <ArrowUpRight className="h-4 w-4 text-green-600" />
                            ) : (
                              <ArrowDownRight className="h-4 w-4 text-red-600" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-sm">
                              {item.description}
                            </div>
                            <div className="text-xs text-gray-600">
                              {item.date}
                            </div>
                          </div>
                        </div>
                        <div
                          className={`font-semibold ${
                            item.amount > 0 ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {item.amount > 0 ? "+" : ""}$
                          {Math.abs(item.amount)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "history" && (
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Credit History</CardTitle>
                <CardDescription>All your credit transactions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {credits.map((item: any) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            item.type === "earned" || item.type === "bonus"
                              ? "bg-green-100"
                              : "bg-red-100"
                          }`}
                        >
                          {item.type === "earned" || item.type === "bonus" ? (
                            <ArrowUpRight className="h-5 w-5 text-green-600" />
                          ) : (
                            <ArrowDownRight className="h-5 w-5 text-red-600" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{item.description}</div>
                          <div className="text-sm text-gray-600">
                            {item.date}
                          </div>
                        </div>
                      </div>
                      <div
                        className={`text-lg font-semibold ${
                          item.amount > 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {item.amount > 0 ? "+" : ""}$
                        {Math.abs(item.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "redemptions" && (
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Redemption Requests</CardTitle>
                <CardDescription>
                  Track your credit redemption requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {redemptionRequests.map((request: any) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Gift className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium">
                            {request.description}
                          </div>
                          <div className="text-sm text-gray-600">
                            {request.date}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-lg font-semibold">
                          ${Math.abs(request.amount)}
                        </div>
                        <Badge
                          className={
                            request.status === "redeemed"
                              ? "bg-green-100 text-green-800"
                              : request.status === "pending_redemption"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }
                        >
                          {request.status === "redeemed" && (
                            <CheckCircle className="h-3 w-3 mr-1" />
                          )}
                          {request.status === "pending_redemption" && (
                            <Clock className="h-3 w-3 mr-1" />
                          )}
                          {request.status === "rejected" && (
                            <AlertCircle className="h-3 w-3 mr-1" />
                          )}
                          {request.status === "redeemed"
                            ? "Completed"
                            : request.status.charAt(0).toUpperCase() +
                              request.status.slice(1)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "achievements" && (
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Achievements</CardTitle>
                <CardDescription>
                  Your milestones and accomplishments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {achievements.map((achievement, index) => (
                    <div
                      key={index}
                      className={`p-4 border rounded-lg ${
                        achievement.earned
                          ? "bg-green-50 border-green-200"
                          : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      <div className="flex items-center space-x-4">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center ${
                            achievement.earned ? "bg-green-100" : "bg-gray-100"
                          }`}
                        >
                          <achievement.icon
                            className={`h-6 w-6 ${achievement.color}`}
                          />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{achievement.title}</div>
                          <div className="text-sm text-gray-600">
                            {achievement.description}
                          </div>
                        </div>
                        {achievement.earned && (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}
