"use client"

import { useAuth } from "@/components/auth-provider"
import { Header } from "@/components/layout/header"
import { Navigation } from "@/components/layout/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DollarSign,
  Search,
  Filter,
  Calendar,
  TrendingUp,
  Gift,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  Download,
  MoreHorizontal,
  User,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react"
import { useState } from "react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const mockCreditTransactions = [
  {
    id: "CR-001",
    technician: "Mike Rodriguez",
    type: "earned",
    amount: 2.55,
    description: "Order #ORD-004 - Industrial Valve Assembly",
    date: "2024-01-12",
    orderId: "ORD-004",
    status: "completed",
  },
  {
    id: "CR-002",
    technician: "Sarah Chen",
    type: "earned",
    amount: 1.17,
    description: "Order #ORD-003 - Electrical Conduit",
    date: "2024-01-13",
    orderId: "ORD-003",
    status: "completed",
  },
  {
    id: "CR-003",
    technician: "David Thompson",
    type: "redeemed",
    amount: -50.0,
    description: "Cash redemption request",
    date: "2024-01-10",
    status: "completed",
  },
  {
    id: "CR-004",
    technician: "Lisa Wang",
    type: "earned",
    amount: 0.94,
    description: "Order #ORD-001 - HVAC Filter Set",
    date: "2024-01-15",
    orderId: "ORD-001",
    status: "completed",
  },
  {
    id: "CR-005",
    technician: "James Wilson",
    type: "bonus",
    amount: 25.0,
    description: "Monthly performance bonus",
    date: "2024-01-01",
    status: "completed",
  },
  {
    id: "CR-006",
    technician: "Mike Rodriguez",
    type: "redeemed",
    amount: -75.0,
    description: "Gift card redemption",
    date: "2024-01-08",
    status: "pending",
  },
]

const mockRedemptionRequests = [
  {
    id: "RR-001",
    technician: "David Thompson",
    amount: 100.0,
    type: "cash",
    status: "pending",
    date: "2024-01-14",
    description: "Cash withdrawal request",
    requestedDate: "2024-01-14",
  },
  {
    id: "RR-002",
    technician: "Sarah Chen",
    amount: 75.0,
    type: "gift_card",
    status: "approved",
    date: "2024-01-10",
    description: "Amazon Gift Card",
    requestedDate: "2024-01-10",
  },
  {
    id: "RR-003",
    technician: "Mike Rodriguez",
    amount: 125.0,
    type: "cash",
    status: "completed",
    date: "2024-01-05",
    description: "Cash withdrawal request",
    requestedDate: "2024-01-05",
  },
]

const statusConfig = {
  pending: { color: "bg-yellow-100 text-yellow-800", icon: Clock },
  approved: { color: "bg-blue-100 text-blue-800", icon: CheckCircle },
  completed: { color: "bg-green-100 text-green-800", icon: CheckCircle },
  rejected: { color: "bg-red-100 text-red-800", icon: AlertCircle },
}

export default function AdminCreditsPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState("transactions")
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  const filteredTransactions = mockCreditTransactions.filter((transaction) => {
    const matchesSearch =
      transaction.technician.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === "all" || transaction.type === typeFilter
    const matchesStatus = statusFilter === "all" || transaction.status === statusFilter
    return matchesSearch && matchesType && matchesStatus
  })

  const filteredRedemptions = mockRedemptionRequests.filter((request) => {
    const matchesSearch =
      request.technician.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || request.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const totalCreditsIssued = mockCreditTransactions
    .filter((t) => t.type === "earned" || t.type === "bonus")
    .reduce((sum, t) => sum + t.amount, 0)

  const totalRedeemed = Math.abs(
    mockCreditTransactions
      .filter((t) => t.type === "redeemed" && t.status === "completed")
      .reduce((sum, t) => sum + t.amount, 0),
  )

  const pendingRedemptions = mockRedemptionRequests
    .filter((r) => r.status === "pending")
    .reduce((sum, r) => sum + r.amount, 0)

  const outstandingBalance = totalCreditsIssued - totalRedeemed

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Header />

      <div className="flex">
        <Navigation />

        <main className="flex-1 p-6">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-[#10294B] mb-2">Credits & Redemptions</h1>
                <p className="text-gray-600">Manage credit transactions and redemption requests</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                  <Download className="h-4 w-4" />
                  Export Report
                </Button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium opacity-90">Credits Issued</CardTitle>
                  <TrendingUp className="h-4 w-4 opacity-90" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${totalCreditsIssued.toFixed(2)}</div>
                  <p className="text-xs opacity-75">Total earned by technicians</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-[#E3253D] to-red-600 text-white border-0 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium opacity-90">Total Redeemed</CardTitle>
                  <Gift className="h-4 w-4 opacity-90" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${totalRedeemed.toFixed(2)}</div>
                  <p className="text-xs opacity-75">Completed redemptions</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white border-0 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium opacity-90">Pending Redemptions</CardTitle>
                  <Clock className="h-4 w-4 opacity-90" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${pendingRedemptions.toFixed(2)}</div>
                  <p className="text-xs opacity-75">Awaiting approval</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-[#10294B] to-[#006AA1] text-white border-0 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium opacity-90">Outstanding Balance</CardTitle>
                  <DollarSign className="h-4 w-4 opacity-90" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${outstandingBalance.toFixed(2)}</div>
                  <p className="text-xs opacity-75">Available for redemption</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
            {[
              { id: "transactions", label: "Credit Transactions" },
              { id: "redemptions", label: "Redemption Requests" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id ? "bg-white text-[#10294B] shadow-sm" : "text-gray-600 hover:text-[#10294B]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Filters */}
          <Card className="mb-6 border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters & Search
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search by technician, description, or ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                {activeTab === "transactions" && (
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="earned">Earned</SelectItem>
                      <SelectItem value="bonus">Bonus</SelectItem>
                      <SelectItem value="redeemed">Redeemed</SelectItem>
                    </SelectContent>
                  </Select>
                )}
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Tab Content */}
          {activeTab === "transactions" && (
            <div className="space-y-4">
              {filteredTransactions.map((transaction) => (
                <Card key={transaction.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center ${
                            transaction.type === "earned" || transaction.type === "bonus"
                              ? "bg-green-100"
                              : "bg-red-100"
                          }`}
                        >
                          {transaction.type === "earned" || transaction.type === "bonus" ? (
                            <ArrowUpRight className="h-6 w-6 text-green-600" />
                          ) : (
                            <ArrowDownRight className="h-6 w-6 text-red-600" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-[#10294B]">{transaction.description}</h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {transaction.technician}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {transaction.date}
                            </span>
                            <span>ID: {transaction.id}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div
                            className={`text-xl font-bold ${transaction.amount > 0 ? "text-green-600" : "text-red-600"}`}
                          >
                            {transaction.amount > 0 ? "+" : ""}${Math.abs(transaction.amount).toFixed(2)}
                          </div>
                          <Badge className={statusConfig[transaction.status as keyof typeof statusConfig]?.color}>
                            {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                          </Badge>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <User className="mr-2 h-4 w-4" />
                              Contact Technician
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Download className="mr-2 h-4 w-4" />
                              Download Receipt
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {activeTab === "redemptions" && (
            <div className="space-y-4">
              {filteredRedemptions.map((request) => {
                const StatusIcon = statusConfig[request.status as keyof typeof statusConfig]?.icon || Clock

                return (
                  <Card key={request.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <Gift className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-[#10294B]">{request.description}</h3>
                            <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {request.technician}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Requested: {request.requestedDate}
                              </span>
                              <span>ID: {request.id}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <div className="text-xl font-bold text-blue-600">${request.amount.toFixed(2)}</div>
                            <Badge className={statusConfig[request.status as keyof typeof statusConfig]?.color}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                            </Badge>
                          </div>
                          <div className="flex gap-2">
                            {request.status === "pending" && (
                              <>
                                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 border-red-300 hover:bg-red-50 bg-transparent"
                                >
                                  <AlertCircle className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                              </>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <User className="mr-2 h-4 w-4" />
                                  Contact Technician
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Download className="mr-2 h-4 w-4" />
                                  Download Request
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {((activeTab === "transactions" && filteredTransactions.length === 0) ||
            (activeTab === "redemptions" && filteredRedemptions.length === 0)) && (
            <Card className="border-0 shadow-lg">
              <CardContent className="text-center py-12">
                <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No records found</h3>
                <p className="text-gray-500 mb-6">Try adjusting your search or filter criteria</p>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  )
}
