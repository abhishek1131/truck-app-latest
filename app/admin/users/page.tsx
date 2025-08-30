"use client"

import { useAuth } from "@/components/auth-provider"
import { Navigation } from "@/components/layout/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CreateUserModal } from "@/components/create-user-modal"
import { EditUserModal } from "@/components/edit-user-modal"
import { UserDetailsModal } from "@/components/user-details-modal"
import {
  Users,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  UserPlus,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  Trash2,
  UserCheck,
  UserX,
  Eye,
} from "lucide-react"
import { useState } from "react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const mockUsers = [
  {
    id: "USER-001",
    name: "Mike Rodriguez",
    email: "mike.rodriguez@email.com",
    phone: "(555) 123-4567",
    location: "Dallas, TX",
    role: "technician",
    status: "active",
    joinDate: "2023-08-15",
    lastActive: "2024-01-15",
    assignedTrucks: ["TRUCK-001", "TRUCK-002"],
    totalOrders: 45,
    avatar: "MR",
  },
  {
    id: "USER-002",
    name: "Sarah Chen",
    email: "sarah.chen@email.com",
    phone: "(555) 234-5678",
    location: "Austin, TX",
    role: "technician",
    status: "active",
    joinDate: "2023-09-22",
    lastActive: "2024-01-14",
    assignedTrucks: ["TRUCK-004"],
    totalOrders: 38,
    avatar: "SC",
  },
  {
    id: "USER-003",
    name: "David Thompson",
    email: "david.thompson@email.com",
    phone: "(555) 345-6789",
    location: "Houston, TX",
    role: "technician",
    status: "inactive",
    joinDate: "2023-07-10",
    lastActive: "2024-01-10",
    assignedTrucks: ["TRUCK-003"],
    totalOrders: 52,
    avatar: "DT",
  },
  {
    id: "USER-004",
    name: "Lisa Wang",
    email: "lisa.wang@email.com",
    phone: "(555) 456-7890",
    location: "San Antonio, TX",
    role: "technician",
    status: "active",
    joinDate: "2023-10-05",
    lastActive: "2024-01-13",
    assignedTrucks: [],
    totalOrders: 29,
    avatar: "LW",
  },
  {
    id: "USER-005",
    name: "Admin User",
    email: "admin@truxtok.com",
    phone: "(555) 999-0000",
    location: "Corporate HQ",
    role: "admin",
    status: "active",
    joinDate: "2023-01-01",
    lastActive: "2024-01-15",
    assignedTrucks: [],
    totalOrders: 0,
    avatar: "AU",
  },
  {
    id: "USER-006",
    name: "John Manager",
    email: "john.manager@email.com",
    phone: "(555) 777-8888",
    location: "Regional Office",
    role: "manager",
    status: "active",
    joinDate: "2023-03-15",
    lastActive: "2024-01-14",
    assignedTrucks: [],
    totalOrders: 0,
    avatar: "JM",
  },
]

const statusConfig = {
  active: { color: "bg-green-100 text-green-800", label: "Active" },
  inactive: { color: "bg-red-100 text-red-800", label: "Inactive" },
  pending: { color: "bg-yellow-100 text-yellow-800", label: "Pending" },
  suspended: { color: "bg-gray-100 text-gray-800", label: "Suspended" },
}

const roleConfig = {
  admin: { color: "bg-purple-100 text-purple-800", label: "Admin", icon: Shield },
  manager: { color: "bg-blue-100 text-blue-800", label: "Manager", icon: UserCheck },
  technician: { color: "bg-green-100 text-green-800", label: "Technician", icon: Users },
}

export default function AdminUsersPage() {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [roleFilter, setRoleFilter] = useState("all")
  const [selectedUser, setSelectedUser] = useState<(typeof mockUsers)[0] | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showUserDetailsModal, setShowUserDetailsModal] = useState(false)

  const filteredUsers = mockUsers.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || user.status === statusFilter
    const matchesRole = roleFilter === "all" || user.role === roleFilter
    return matchesSearch && matchesStatus && matchesRole
  })

  const totalUsers = mockUsers.length
  const activeUsers = mockUsers.filter((user) => user.status === "active").length
  const technicians = mockUsers.filter((user) => user.role === "technician").length
  const admins = mockUsers.filter((user) => user.role === "admin").length

  const handleCreateUser = (userData: any) => {
    console.log("Create user:", userData)
    setShowCreateModal(false)
  }

  const handleEditUser = (user: (typeof mockUsers)[0]) => {
    setSelectedUser(user)
    setShowEditModal(true)
  }

  const handleDeactivateUser = (user: (typeof mockUsers)[0]) => {
    console.log("Deactivate user:", user.name)
  }

  const handleDeleteUser = (user: (typeof mockUsers)[0]) => {
    console.log("Delete user:", user.name)
  }

  const handleViewUserDetails = (user: (typeof mockUsers)[0]) => {
    setSelectedUser(user)
    setShowUserDetailsModal(true)
  }

  return (
    <Navigation title="User Management" subtitle="Manage all system users and their roles">
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-end mb-6">
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-[#E3253D] hover:bg-[#E3253D]/90 text-white shadow-lg"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add New User
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <Card className="bg-gradient-to-br from-[#10294B] to-[#006AA1] text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Total Users</CardTitle>
              <Users className="h-4 w-4 opacity-90" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUsers}</div>
              <p className="text-xs opacity-75">{activeUsers} active</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Technicians</CardTitle>
              <UserCheck className="h-4 w-4 opacity-90" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{technicians}</div>
              <p className="text-xs opacity-75">Field workers</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Administrators</CardTitle>
              <Shield className="h-4 w-4 opacity-90" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{admins}</div>
              <p className="text-xs opacity-75">System admins</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-[#E3253D] to-red-600 text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Active Rate</CardTitle>
              <Calendar className="h-4 w-4 opacity-90" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round((activeUsers / totalUsers) * 100)}%</div>
              <p className="text-xs opacity-75">User engagement</p>
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
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="technician">Technician</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Users List */}
        <div className="space-y-4">
          {filteredUsers.map((user) => (
            <Card key={user.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-[#10294B] rounded-full flex items-center justify-center text-white font-bold">
                          {user.avatar}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-[#10294B]">{user.name}</h3>
                          <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {user.email}
                            </span>
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {user.phone}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {user.location}
                            </span>
                            {user.assignedTrucks.length > 0 && <span>Trucks: {user.assignedTrucks.join(", ")}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={statusConfig[user.status as keyof typeof statusConfig]?.color}>
                          {statusConfig[user.status as keyof typeof statusConfig]?.label}
                        </Badge>
                        <Badge className={roleConfig[user.role as keyof typeof roleConfig]?.color}>
                          {roleConfig[user.role as keyof typeof roleConfig]?.label}
                        </Badge>
                        <Badge variant="outline">ID: {user.id}</Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t border-gray-100">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Join Date</div>
                        <div className="font-semibold">{user.joinDate}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Last Active</div>
                        <div className="font-semibold">{user.lastActive}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Total Orders</div>
                        <div className="font-semibold">{user.totalOrders}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Assigned Trucks</div>
                        <div className="font-semibold">{user.assignedTrucks.length}</div>
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
                        <DropdownMenuItem onClick={() => handleViewUserDetails(user)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditUser(user)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit User
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeactivateUser(user)}>
                          <UserX className="mr-2 h-4 w-4" />
                          {user.status === "active" ? "Deactivate" : "Activate"}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteUser(user)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredUsers.length === 0 && (
          <Card className="border-0 shadow-lg">
            <CardContent className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No users found</h3>
              <p className="text-gray-500 mb-6">Try adjusting your search or filter criteria</p>
              <Button onClick={() => setShowCreateModal(true)} className="bg-[#E3253D] hover:bg-[#E3253D]/90">
                <UserPlus className="h-4 w-4 mr-2" />
                Add New User
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modals */}
      <CreateUserModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onUserCreated={handleCreateUser}
      />

      {selectedUser && (
        <EditUserModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false)
            setSelectedUser(null)
          }}
          user={selectedUser}
        />
      )}

      {selectedUser && (
        <UserDetailsModal
          isOpen={showUserDetailsModal}
          onClose={() => {
            setShowUserDetailsModal(false)
            setSelectedUser(null)
          }}
          user={selectedUser}
        />
      )}
    </Navigation>
  )
}
