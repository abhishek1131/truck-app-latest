"use client"

import { useAuth } from "@/components/auth-provider"
import { Header } from "@/components/layout/header"
import { Navigation } from "@/components/layout/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AddSupplyHouseModal } from "@/components/add-supply-house-modal"
import { SupplyHouseDetailsModal } from "@/components/supply-house-details-modal"
import { EditSupplyHouseModal } from "@/components/edit-supply-house-modal"
import { SupplyHouseOrdersModal } from "@/components/supply-house-orders-modal"
import {
  Building2,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Package,
  Users,
} from "lucide-react"
import { useState } from "react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const mockSupplyHouses = [
  {
    id: "SH-001",
    name: "ABC Supply Co.",
    address: "123 Industrial Blvd, Dallas, TX 75201",
    phone: "(555) 123-4567",
    email: "orders@abcsupply.com",
    status: "active",
    joinDate: "2023-06-15",
    totalOrders: 156,
    activeTechnicians: 23,
    lastOrder: "2024-01-15",
    rating: 4.8,
    specialties: ["HVAC", "Electrical", "Plumbing"],
    manager: "John Smith",
  },
  {
    id: "SH-002",
    name: "Pro Parts Plus",
    address: "456 Commerce St, Austin, TX 78701",
    phone: "(555) 234-5678",
    email: "info@propartsplus.com",
    status: "active",
    joinDate: "2023-08-22",
    totalOrders: 89,
    activeTechnicians: 15,
    lastOrder: "2024-01-14",
    rating: 4.6,
    specialties: ["HVAC", "Industrial"],
    manager: "Sarah Johnson",
  },
  {
    id: "SH-003",
    name: "Tech Supply Hub",
    address: "789 Tech Park Dr, Houston, TX 77001",
    phone: "(555) 345-6789",
    email: "orders@techsupplyhub.com",
    status: "pending",
    joinDate: "2024-01-10",
    totalOrders: 12,
    activeTechnicians: 3,
    lastOrder: "2024-01-13",
    rating: 4.2,
    specialties: ["Electrical", "Industrial"],
    manager: "Mike Rodriguez",
  },
  {
    id: "SH-004",
    name: "Quick Parts Express",
    address: "321 Express Way, San Antonio, TX 78201",
    phone: "(555) 456-7890",
    email: "support@quickparts.com",
    status: "inactive",
    joinDate: "2023-04-05",
    totalOrders: 234,
    activeTechnicians: 0,
    lastOrder: "2023-12-20",
    rating: 4.4,
    specialties: ["HVAC", "Plumbing"],
    manager: "Lisa Chen",
  },
]

const statusConfig = {
  active: { color: "bg-green-100 text-green-800", label: "Active" },
  inactive: { color: "bg-red-100 text-red-800", label: "Inactive" },
  pending: { color: "bg-yellow-100 text-yellow-800", label: "Pending" },
  suspended: { color: "bg-gray-100 text-gray-800", label: "Suspended" },
}

export default function SupplyHousesPage() {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [specialtyFilter, setSpecialtyFilter] = useState("all")
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedSupplyHouse, setSelectedSupplyHouse] = useState<(typeof mockSupplyHouses)[0] | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showOrdersModal, setShowOrdersModal] = useState(false)

  const filteredSupplyHouses = mockSupplyHouses.filter((house) => {
    const matchesSearch =
      house.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      house.manager.toLowerCase().includes(searchTerm.toLowerCase()) ||
      house.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || house.status === statusFilter
    const matchesSpecialty = specialtyFilter === "all" || house.specialties.includes(specialtyFilter)
    return matchesSearch && matchesStatus && matchesSpecialty
  })

  const totalSupplyHouses = mockSupplyHouses.length
  const activeSupplyHouses = mockSupplyHouses.filter((house) => house.status === "active").length
  const totalOrders = mockSupplyHouses.reduce((sum, house) => sum + house.totalOrders, 0)
  const totalTechnicians = mockSupplyHouses.reduce((sum, house) => sum + house.activeTechnicians, 0)

  const handleViewDetails = (house: (typeof mockSupplyHouses)[0]) => {
    setSelectedSupplyHouse(house)
    setShowDetailsModal(true)
  }

  const handleEditInformation = (house: (typeof mockSupplyHouses)[0]) => {
    setSelectedSupplyHouse(house)
    setShowEditModal(true)
  }

  const handleViewOrders = (house: (typeof mockSupplyHouses)[0]) => {
    setSelectedSupplyHouse(house)
    setShowOrdersModal(true)
  }

  const handleDeactivate = (house: (typeof mockSupplyHouses)[0]) => {
    console.log("Deactivate:", house.name)
    // Implement deactivate functionality
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Header />

      <div className="flex">
        <Navigation />

        <main className="flex-1 p-6">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-[#10294B] mb-2">Supply House Management</h1>
                <p className="text-gray-600">Manage and monitor all supply house partners</p>
              </div>
              <Button
                onClick={() => setShowAddModal(true)}
                className="bg-[#E3253D] hover:bg-[#E3253D]/90 text-white shadow-lg"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Supply House
              </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="bg-gradient-to-br from-[#10294B] to-[#006AA1] text-white border-0 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium opacity-90">Total Supply Houses</CardTitle>
                  <Building2 className="h-4 w-4 opacity-90" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalSupplyHouses}</div>
                  <p className="text-xs opacity-75">{activeSupplyHouses} active</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium opacity-90">Total Orders</CardTitle>
                  <Package className="h-4 w-4 opacity-90" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalOrders}</div>
                  <p className="text-xs opacity-75">All supply houses</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-[#E3253D] to-red-600 text-white border-0 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium opacity-90">Active Technicians</CardTitle>
                  <Users className="h-4 w-4 opacity-90" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalTechnicians}</div>
                  <p className="text-xs opacity-75">Connected technicians</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium opacity-90">Avg Rating</CardTitle>
                  <Calendar className="h-4 w-4 opacity-90" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(mockSupplyHouses.reduce((sum, house) => sum + house.rating, 0) / mockSupplyHouses.length).toFixed(
                      1,
                    )}
                  </div>
                  <p className="text-xs opacity-75">Customer satisfaction</p>
                </CardContent>
              </Card>
            </div>
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
                      placeholder="Search by name, manager, or ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Filter by specialty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Specialties</SelectItem>
                    <SelectItem value="HVAC">HVAC</SelectItem>
                    <SelectItem value="Electrical">Electrical</SelectItem>
                    <SelectItem value="Plumbing">Plumbing</SelectItem>
                    <SelectItem value="Industrial">Industrial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Supply Houses List */}
          <div className="space-y-4">
            {filteredSupplyHouses.map((house) => (
              <Card key={house.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-[#10294B] rounded-full flex items-center justify-center text-white font-bold">
                            {house.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-[#10294B]">{house.name}</h3>
                            <p className="text-sm text-gray-600">Manager: {house.manager}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {house.address}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {house.phone}
                              </span>
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {house.email}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={statusConfig[house.status as keyof typeof statusConfig]?.color}>
                            {statusConfig[house.status as keyof typeof statusConfig]?.label}
                          </Badge>
                          <Badge className="bg-blue-100 text-blue-800">⭐ {house.rating}</Badge>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {house.specialties.map((specialty) => (
                          <Badge key={specialty} variant="outline" className="text-xs">
                            {specialty}
                          </Badge>
                        ))}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-3 border-t border-gray-100">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Total Orders</div>
                          <div className="font-semibold">{house.totalOrders}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Active Technicians</div>
                          <div className="font-semibold text-blue-600">{house.activeTechnicians}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Join Date</div>
                          <div className="font-semibold">{house.joinDate}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Last Order</div>
                          <div className="font-semibold">{house.lastOrder}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">ID</div>
                          <div className="font-semibold text-xs">{house.id}</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 lg:ml-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewDetails(house)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditInformation(house)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Information
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleViewOrders(house)}>
                            <Package className="mr-2 h-4 w-4" />
                            View Orders
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600" onClick={() => handleDeactivate(house)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Deactivate
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredSupplyHouses.length === 0 && (
            <Card className="border-0 shadow-lg">
              <CardContent className="text-center py-12">
                <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No supply houses found</h3>
                <p className="text-gray-500 mb-6">Try adjusting your search or filter criteria</p>
                <Button onClick={() => setShowAddModal(true)} className="bg-[#E3253D] hover:bg-[#E3253D]/90">
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Supply House
                </Button>
              </CardContent>
            </Card>
          )}
        </main>
      </div>

      {/* Modals */}
      <AddSupplyHouseModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} />

      {selectedSupplyHouse && (
        <>
          <SupplyHouseDetailsModal
            isOpen={showDetailsModal}
            onClose={() => {
              setShowDetailsModal(false)
              setSelectedSupplyHouse(null)
            }}
            supplyHouse={selectedSupplyHouse}
          />

          <EditSupplyHouseModal
            isOpen={showEditModal}
            onClose={() => {
              setShowEditModal(false)
              setSelectedSupplyHouse(null)
            }}
            supplyHouse={selectedSupplyHouse}
          />

          <SupplyHouseOrdersModal
            isOpen={showOrdersModal}
            onClose={() => {
              setShowOrdersModal(false)
              setSelectedSupplyHouse(null)
            }}
            supplyHouse={selectedSupplyHouse}
          />
        </>
      )}
    </div>
  )
}
