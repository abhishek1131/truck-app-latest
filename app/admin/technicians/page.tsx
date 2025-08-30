"use client"

import { useAuth } from "@/components/auth-provider"
import { Header } from "@/components/layout/header"
import { Navigation } from "@/components/layout/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TechnicianDetailsModal } from "@/components/technician-details-modal"
import { EditTechnicianModal } from "@/components/edit-technician-modal"
import { AdjustCreditsModal } from "@/components/adjust-credits-modal"
import {
  Users,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  DollarSign,
  Trash2,
  UserPlus,
  Calendar,
  ShoppingCart,
  MapPin,
  Phone,
  Mail,
} from "lucide-react"
import { useState } from "react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const mockTechnicians = [
  {
    id: "TECH-001",
    name: "Mike Rodriguez",
    email: "mike.rodriguez@email.com",
    phone: "(555) 123-4567",
    location: "Dallas, TX",
    status: "active",
    joinDate: "2023-08-15",
    totalOrders: 45,
    creditBalance: 234.5,
    lastActive: "2024-01-15",
    specialization: "HVAC",
    rating: 4.8,
    completedJobs: 42,
    avatar: "MR",
  },
  {
    id: "TECH-002",
    name: "Sarah Chen",
    email: "sarah.chen@email.com",
    phone: "(555) 234-5678",
    location: "Austin, TX",
    status: "active",
    joinDate: "2023-09-22",
    totalOrders: 38,
    creditBalance: 189.25,
    lastActive: "2024-01-14",
    specialization: "Electrical",
    rating: 4.9,
    completedJobs: 36,
    avatar: "SC",
  },
  {
    id: "TECH-003",
    name: "David Thompson",
    email: "david.thompson@email.com",
    phone: "(555) 345-6789",
    location: "Houston, TX",
    status: "inactive",
    joinDate: "2023-07-10",
    totalOrders: 52,
    creditBalance: 156.75,
    lastActive: "2024-01-10",
    specialization: "Plumbing",
    rating: 4.7,
    completedJobs: 48,
    avatar: "DT",
  },
  {
    id: "TECH-004",
    name: "Lisa Wang",
    email: "lisa.wang@email.com",
    phone: "(555) 456-7890",
    location: "San Antonio, TX",
    status: "active",
    joinDate: "2023-10-05",
    totalOrders: 29,
    creditBalance: 298.0,
    lastActive: "2024-01-13",
    specialization: "Industrial",
    rating: 4.6,
    completedJobs: 21,
    avatar: "LW",
  },
]

const statusConfig = {
  active: { color: "bg-green-100 text-green-800", label: "Active" },
  inactive: { color: "bg-red-100 text-red-800", label: "Inactive" },
  pending: { color: "bg-yellow-100 text-yellow-800", label: "Pending" },
  suspended: { color: "bg-gray-100 text-gray-800", label: "Suspended" },
}

export default function TechniciansPage() {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [specializationFilter, setSpecializationFilter] = useState("all")
  const [selectedTechnician, setSelectedTechnician] = useState<(typeof mockTechnicians)[0] | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showCreditsModal, setShowCreditsModal] = useState(false)

  const filteredTechnicians = mockTechnicians.filter((tech) => {
    const matchesSearch =
      tech.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tech.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tech.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || tech.status === statusFilter
    const matchesSpecialization = specializationFilter === "all" || tech.specialization === specializationFilter
    return matchesSearch && matchesStatus && matchesSpecialization
  })

  const totalTechnicians = mockTechnicians.length
  const activeTechnicians = mockTechnicians.filter((tech) => tech.status === "active").length
  const totalOrders = mockTechnicians.reduce((sum, tech) => sum + tech.totalOrders, 0)
  const totalCredits = mockTechnicians.reduce((sum, tech) => sum + tech.creditBalance, 0)

  const handleViewDetails = (technician: (typeof mockTechnicians)[0]) => {
    setSelectedTechnician(technician)
    setShowDetailsModal(true)
  }

  const handleEditProfile = (technician: (typeof mockTechnicians)[0]) => {
    setSelectedTechnician(technician)
    setShowEditModal(true)
  }

  const handleAdjustCredits = (technician: (typeof mockTechnicians)[0]) => {
    setSelectedTechnician(technician)
    setShowCreditsModal(true)
  }

  const handleDeactivate = (technician: (typeof mockTechnicians)[0]) => {
    console.log("Deactivate technician:", technician.name)
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
                <h1 className="text-3xl font-bold text-[#10294B] mb-2">Technician Management</h1>
                <p className="text-gray-600">Manage and monitor all registered technicians</p>
              </div>
              <Button className="bg-[#E3253D] hover:bg-[#E3253D]/90 text-white shadow-lg">
                <UserPlus className="h-4 w-4 mr-2" />
                Add Technician
              </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="bg-gradient-to-br from-[#10294B] to-[#006AA1] text-white border-0 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium opacity-90">Total Technicians</CardTitle>
                  <Users className="h-4 w-4 opacity-90" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalTechnicians}</div>
                  <p className="text-xs opacity-75">{activeTechnicians} active</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium opacity-90">Total Orders</CardTitle>
                  <ShoppingCart className="h-4 w-4 opacity-90" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalOrders}</div>
                  <p className="text-xs opacity-75">All technicians</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-[#E3253D] to-red-600 text-white border-0 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium opacity-90">Total Credits</CardTitle>
                  <DollarSign className="h-4 w-4 opacity-90" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${totalCredits.toFixed(2)}</div>
                  <p className="text-xs opacity-75">Outstanding balance</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium opacity-90">Avg Orders</CardTitle>
                  <Calendar className="h-4 w-4 opacity-90" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{Math.round(totalOrders / totalTechnicians)}</div>
                  <p className="text-xs opacity-75">Per technician</p>
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
                      placeholder="Search by name, email, or ID..."
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
                <Select value={specializationFilter} onValueChange={setSpecializationFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Filter by specialization" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Specializations</SelectItem>
                    <SelectItem value="HVAC">HVAC</SelectItem>
                    <SelectItem value="Electrical">Electrical</SelectItem>
                    <SelectItem value="Plumbing">Plumbing</SelectItem>
                    <SelectItem value="Industrial">Industrial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Technicians List */}
          <div className="space-y-4">
            {filteredTechnicians.map((technician) => (
              <Card key={technician.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-[#10294B] rounded-full flex items-center justify-center text-white font-bold">
                            {technician.avatar}
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-[#10294B]">{technician.name}</h3>
                            <p className="text-sm text-gray-600">{technician.specialization} Specialist</p>
                            <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {technician.location}
                              </span>
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {technician.phone}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {technician.email}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={statusConfig[technician.status as keyof typeof statusConfig]?.color}>
                            {statusConfig[technician.status as keyof typeof statusConfig]?.label}
                          </Badge>
                          <Badge variant="outline">ID: {technician.id}</Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t border-gray-100">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Total Orders</div>
                          <div className="font-semibold">{technician.totalOrders}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Credit Balance</div>
                          <div className="font-semibold text-green-600">${technician.creditBalance.toFixed(2)}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Join Date</div>
                          <div className="font-semibold">{technician.joinDate}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Last Active</div>
                          <div className="font-semibold">{technician.lastActive}</div>
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
                          <DropdownMenuItem onClick={() => handleViewDetails(technician)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditProfile(technician)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleAdjustCredits(technician)}>
                            <DollarSign className="mr-2 h-4 w-4" />
                            Adjust Credits
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600" onClick={() => handleDeactivate(technician)}>
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

          {filteredTechnicians.length === 0 && (
            <Card className="border-0 shadow-lg">
              <CardContent className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No technicians found</h3>
                <p className="text-gray-500 mb-6">Try adjusting your search or filter criteria</p>
                <Button className="bg-[#E3253D] hover:bg-[#E3253D]/90">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add New Technician
                </Button>
              </CardContent>
            </Card>
          )}
        </main>
      </div>

      {/* Modals */}
      {selectedTechnician && (
        <>
          <TechnicianDetailsModal
            isOpen={showDetailsModal}
            onClose={() => {
              setShowDetailsModal(false)
              setSelectedTechnician(null)
            }}
            technician={selectedTechnician}
          />
          <EditTechnicianModal
            isOpen={showEditModal}
            onClose={() => {
              setShowEditModal(false)
              setSelectedTechnician(null)
            }}
            technician={selectedTechnician}
          />
          <AdjustCreditsModal
            isOpen={showCreditsModal}
            onClose={() => {
              setShowCreditsModal(false)
              setSelectedTechnician(null)
            }}
            technician={selectedTechnician}
          />
        </>
      )}
    </div>
  )
}
