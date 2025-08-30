"use client"

import { useAuth } from "@/components/auth-provider"
import { Navigation } from "@/components/layout/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CreateTruckModal } from "@/components/create-truck-modal"
import { AssignTruckModal } from "@/components/assign-truck-modal"
import { EditTruckModal } from "@/components/edit-truck-modal"
import {
  Truck,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  UserPlus,
  MapPin,
  Package,
  AlertTriangle,
  Users,
  Settings,
  Trash2,
} from "lucide-react"
import { useState } from "react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"

const mockTrucks = [
  {
    id: "1",
    name: "Truck #001",
    location: "Downtown Route",
    status: "Active",
    totalItems: 127,
    lowStockItems: 8,
    bins: 12,
    lastUpdated: "2 hours ago",
    assignedTechnician: "Mike Rodriguez",
    technicianId: "TECH-001",
    model: "Ford Transit 350",
    year: "2023",
    licensePlate: "TX-TRK-001",
    mileage: 15420,
    nextMaintenance: "2024-02-15",
    createdDate: "2023-08-15",
  },
  {
    id: "2",
    name: "Truck #002",
    location: "Suburban Route",
    status: "Active",
    totalItems: 143,
    lowStockItems: 3,
    bins: 15,
    lastUpdated: "4 hours ago",
    assignedTechnician: "Sarah Chen",
    technicianId: "TECH-002",
    model: "Chevrolet Express 3500",
    year: "2022",
    licensePlate: "TX-TRK-002",
    mileage: 28750,
    nextMaintenance: "2024-01-28",
    createdDate: "2023-09-22",
  },
  {
    id: "3",
    name: "Truck #003",
    location: "Industrial Route",
    status: "Maintenance",
    totalItems: 117,
    lowStockItems: 12,
    bins: 10,
    lastUpdated: "1 day ago",
    assignedTechnician: "David Thompson",
    technicianId: "TECH-003",
    model: "Ram ProMaster 3500",
    year: "2021",
    licensePlate: "TX-TRK-003",
    mileage: 42180,
    nextMaintenance: "2024-01-20",
    createdDate: "2023-07-10",
  },
  {
    id: "4",
    name: "Truck #004",
    location: "North Route",
    status: "Active",
    totalItems: 98,
    lowStockItems: 5,
    bins: 8,
    lastUpdated: "6 hours ago",
    assignedTechnician: "Lisa Wang",
    technicianId: "TECH-004",
    model: "Ford Transit 250",
    year: "2023",
    licensePlate: "TX-TRK-004",
    mileage: 8920,
    nextMaintenance: "2024-03-10",
    createdDate: "2023-10-05",
  },
  {
    id: "5",
    name: "Truck #005",
    location: "Unassigned",
    status: "Available",
    totalItems: 0,
    lowStockItems: 0,
    bins: 12,
    lastUpdated: "Never",
    assignedTechnician: null,
    technicianId: null,
    model: "Ford Transit 350",
    year: "2024",
    licensePlate: "TX-TRK-005",
    mileage: 450,
    nextMaintenance: "2024-06-01",
    createdDate: "2024-01-10",
  },
]

const statusConfig = {
  Active: { color: "bg-green-100 text-green-800", label: "Active" },
  Maintenance: { color: "bg-orange-100 text-orange-800", label: "Maintenance" },
  Available: { color: "bg-blue-100 text-blue-800", label: "Available" },
  "Out of Service": { color: "bg-red-100 text-red-800", label: "Out of Service" },
}

export default function AdminTrucksPage() {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [assignmentFilter, setAssignmentFilter] = useState("all")
  const [selectedTruck, setSelectedTruck] = useState<(typeof mockTrucks)[0] | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)

  const filteredTrucks = mockTrucks.filter((truck) => {
    const matchesSearch =
      truck.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      truck.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      truck.assignedTechnician?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      truck.licensePlate.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || truck.status === statusFilter
    const matchesAssignment =
      assignmentFilter === "all" ||
      (assignmentFilter === "assigned" && truck.assignedTechnician) ||
      (assignmentFilter === "unassigned" && !truck.assignedTechnician)
    return matchesSearch && matchesStatus && matchesAssignment
  })

  const totalTrucks = mockTrucks.length
  const activeTrucks = mockTrucks.filter((truck) => truck.status === "Active").length
  const availableTrucks = mockTrucks.filter((truck) => truck.status === "Available").length
  const maintenanceTrucks = mockTrucks.filter((truck) => truck.status === "Maintenance").length
  const totalItems = mockTrucks.reduce((sum, truck) => sum + truck.totalItems, 0)
  const totalLowStock = mockTrucks.reduce((sum, truck) => sum + truck.lowStockItems, 0)

  const handleCreateTruck = (truckData: any) => {
    console.log("Create truck:", truckData)
    setShowCreateModal(false)
  }

  const handleAssignTruck = (truck: (typeof mockTrucks)[0]) => {
    setSelectedTruck(truck)
    setShowAssignModal(true)
  }

  const handleEditTruck = (truck: (typeof mockTrucks)[0]) => {
    setSelectedTruck(truck)
    setShowEditModal(true)
  }

  const handleDeleteTruck = (truck: (typeof mockTrucks)[0]) => {
    console.log("Delete truck:", truck.name)
  }

  return (
    <Navigation title="Fleet Management" subtitle="Manage trucks, assignments, and fleet operations">
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-end mb-6">
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-[#E3253D] hover:bg-[#E3253D]/90 text-white shadow-lg"
          >
            <Truck className="h-4 w-4 mr-2" />
            Add New Truck
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <Card className="bg-gradient-to-br from-[#10294B] to-[#006AA1] text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Total Fleet</CardTitle>
              <Truck className="h-4 w-4 opacity-90" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalTrucks}</div>
              <p className="text-xs opacity-75">{activeTrucks} active</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Available</CardTitle>
              <Package className="h-4 w-4 opacity-90" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{availableTrucks}</div>
              <p className="text-xs opacity-75">Ready for assignment</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Maintenance</CardTitle>
              <Settings className="h-4 w-4 opacity-90" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{maintenanceTrucks}</div>
              <p className="text-xs opacity-75">In service</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-[#E3253D] to-red-600 text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Low Stock Items</CardTitle>
              <AlertTriangle className="h-4 w-4 opacity-90" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalLowStock}</div>
              <p className="text-xs opacity-75">Across all trucks</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-0 shadow-lg">
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
                    placeholder="Search by truck name, location, technician, or license plate..."
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
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Available">Available</SelectItem>
                  <SelectItem value="Maintenance">Maintenance</SelectItem>
                  <SelectItem value="Out of Service">Out of Service</SelectItem>
                </SelectContent>
              </Select>
              <Select value={assignmentFilter} onValueChange={setAssignmentFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by assignment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Trucks</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Trucks List */}
        <div className="space-y-4">
          {filteredTrucks.map((truck) => (
            <Card key={truck.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-[#10294B] rounded-full flex items-center justify-center text-white font-bold">
                          <Truck className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-[#10294B]">{truck.name}</h3>
                          <p className="text-sm text-gray-600">
                            {truck.model} ({truck.year})
                          </p>
                          <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {truck.location}
                            </span>
                            <span>{truck.licensePlate}</span>
                            <span>{truck.mileage.toLocaleString()} miles</span>
                          </div>
                          {truck.assignedTechnician && (
                            <div className="flex items-center gap-1 text-sm text-blue-600 mt-1">
                              <Users className="h-3 w-3" />
                              Assigned to: {truck.assignedTechnician}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={statusConfig[truck.status as keyof typeof statusConfig]?.color}>
                          {statusConfig[truck.status as keyof typeof statusConfig]?.label}
                        </Badge>
                        {!truck.assignedTechnician && (
                          <Badge variant="outline" className="text-orange-600 border-orange-600">
                            Unassigned
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-3 border-t border-gray-100">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Total Items</div>
                        <div className="font-semibold">{truck.totalItems}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Storage Bins</div>
                        <div className="font-semibold">{truck.bins}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Low Stock</div>
                        <div className={`font-semibold ${truck.lowStockItems > 0 ? "text-red-600" : "text-green-600"}`}>
                          {truck.lowStockItems}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Next Maintenance</div>
                        <div className="font-semibold text-xs">{truck.nextMaintenance}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Last Updated</div>
                        <div className="font-semibold text-xs">{truck.lastUpdated}</div>
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
                        <DropdownMenuItem asChild>
                          <Link href={`/trucks/${truck.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditTruck(truck)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Truck
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAssignTruck(truck)}>
                          <UserPlus className="mr-2 h-4 w-4" />
                          {truck.assignedTechnician ? "Reassign" : "Assign"} Technician
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteTruck(truck)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Truck
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredTrucks.length === 0 && (
          <Card className="border-0 shadow-lg">
            <CardContent className="text-center py-12">
              <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No trucks found</h3>
              <p className="text-gray-500 mb-6">Try adjusting your search or filter criteria</p>
              <Button onClick={() => setShowCreateModal(true)} className="bg-[#E3253D] hover:bg-[#E3253D]/90">
                <Truck className="h-4 w-4 mr-2" />
                Add New Truck
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modals */}
      <CreateTruckModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onTruckCreated={handleCreateTruck}
      />

      {selectedTruck && (
        <>
          <AssignTruckModal
            isOpen={showAssignModal}
            onClose={() => {
              setShowAssignModal(false)
              setSelectedTruck(null)
            }}
            truck={selectedTruck}
          />
          <EditTruckModal
            isOpen={showEditModal}
            onClose={() => {
              setShowEditModal(false)
              setSelectedTruck(null)
            }}
            truck={selectedTruck}
          />
        </>
      )}
    </Navigation>
  )
}
