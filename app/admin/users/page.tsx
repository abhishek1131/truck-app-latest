"use client";

import { useAuth } from "@/components/auth-provider";
import { Navigation } from "@/components/layout/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CreateUserModal } from "@/components/create-user-modal";
import { EditUserModal } from "@/components/edit-user-modal";
import { UserDetailsModal } from "@/components/user-details-modal";
import {
  Users,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  UserPlus,
  Mail,
  Phone,
  Calendar,
  Shield,
  Trash2,
  UserCheck,
  UserX,
  Eye,
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  role: "admin" | "manager" | "technician";
  status: "active" | "inactive" | "pending" | "suspended";
  created_at: string;
  updated_at: string | null;
  assigned_trucks: {
    id: string;
    truck_number: string;
    make: string;
    model: string;
  }[];
}

const statusConfig = {
  active: { color: "bg-green-100 text-green-800", label: "Active" },
  inactive: { color: "bg-red-100 text-red-800", label: "Inactive" },
  pending: { color: "bg-yellow-100 text-yellow-800", label: "Pending" },
  suspended: { color: "bg-gray-100 text-gray-800", label: "Suspended" },
};

const roleConfig = {
  admin: {
    color: "bg-purple-100 text-purple-800",
    label: "Admin",
    icon: Shield,
  },
  manager: {
    color: "bg-blue-100 text-blue-800",
    label: "Manager",
    icon: UserCheck,
  },
  technician: {
    color: "bg-green-100 text-green-800",
    label: "Technician",
    icon: Users,
  },
};

export default function AdminUsersPage() {
  const { user, token } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showUserDetailsModal, setShowUserDetailsModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dropdownKey, setDropdownKey] = useState(0); // To force re-render of DropdownMenu
  const triggerRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  useEffect(() => {
    const fetchUsers = async () => {
      if (!token) {
        setError("Please log in to view users");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/admin/users", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const result = await response.json();
        if (result.success && result.data?.users) {
          setUsers(result.data.users);
        } else {
          setError(result.error || "Failed to fetch users");
        }
      } catch (error) {
        setError("Error fetching users");
        console.error("Error fetching users:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [token]);

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      `${user.first_name} ${user.last_name}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || user.status === statusFilter;
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesStatus && matchesRole;
  });

  const totalUsers = users.length;
  const activeUsers = users.filter((user) => user.status === "active").length;
  const technicians = users.filter((user) => user.role === "technician").length;
  const admins = users.filter((user) => user.role === "admin").length;

  const handleCreateUser = useCallback(
    async (userData: any) => {
      try {
        const response = await fetch("/api/admin/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(userData),
        });
        const result = await response.json();
        if (result.success && result.data) {
          setUsers([...users, result.data]);
          setShowCreateModal(false);
          setDropdownKey((prev) => prev + 1); // Reset DropdownMenu
        } else {
          alert(`Failed to create user: ${result.error}`);
        }
      } catch (error) {
        console.error("Error creating user:", error);
        alert("Error creating user. Please try again.");
      }
    },
    [token, users]
  );

  const handleEditUser = useCallback((user: User) => {
    setSelectedUser(user);
    setShowEditModal(true);
    setDropdownKey((prev) => prev + 1); // Reset DropdownMenu
  }, []);

const handleDeactivateUser = useCallback(
  async (user: User, onClose: () => void) => {
    try {
      const action = user.status === "active" ? "deactivate" : "activate";
      const response = await fetch(`/api/admin/users/${user.id}/${action}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const result = await response.json();
      if (result.success && result.data) {
        setUsers(users.map((u) => (u.id === user.id ? result.data : u)));
        onClose();
        setDropdownKey((prev) => prev + 1); // Reset DropdownMenu
      } else {
        alert(`Failed to ${action} user: ${result.error}`);
      }
    } catch (error) {
      console.error(`Error ${user.status === "active" ? "deactivating" : "activating"} user:`, error);
      alert(`Error ${user.status === "active" ? "deactivating" : "activating"} user. Please try again.`);
    }
  },
  [token, users]
);
  const handleDeleteUser = useCallback(
    async (user: User, onClose: () => void) => {
      try {
        const response = await fetch(`/api/admin/users/${user.id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const result = await response.json();
        if (result.success) {
          setUsers(users.filter((u) => u.id !== user.id));
          onClose();
          setDropdownKey((prev) => prev + 1); // Reset DropdownMenu
        } else {
          alert(`Failed to delete user: ${result.error}`);
        }
      } catch (error) {
        console.error("Error deleting user:", error);
        alert("Error deleting user. Please try again.");
      }
    },
    [token, users]
  );

  const handleViewUserDetails = useCallback((user: User) => {
    setSelectedUser(user);
    setShowUserDetailsModal(true);
    setDropdownKey((prev) => prev + 1); // Reset DropdownMenu
  }, []);

  const handleModalClose = useCallback(() => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setShowUserDetailsModal(false);
    setSelectedUser(null);
    setDropdownKey((prev) => prev + 1); // Reset DropdownMenu
  }, []);

  return (
    <Navigation
      title="User Management"
      subtitle="Manage all system users and their roles"
    >
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-end mb-6">
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-[#E3253D] hover:bg-[#E3253D]/90 text-white shadow-lg"
            disabled={isLoading}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add New User
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <Card className="bg-gradient-to-br from-[#10294B] to-[#006AA1] text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">
                Total Users
              </CardTitle>
              <Users className="h-4 w-4 opacity-90" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUsers}</div>
              <p className="text-xs opacity-75">{activeUsers} active</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">
                Technicians
              </CardTitle>
              <UserCheck className="h-4 w-4 opacity-90" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{technicians}</div>
              <p className="text-xs opacity-75">Field workers</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">
                Administrators
              </CardTitle>
              <Shield className="h-4 w-4 opacity-90" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{admins}</div>
              <p className="text-xs opacity-75">System admins</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-[#E3253D] to-red-600 text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">
                Active Rate
              </CardTitle>
              <Calendar className="h-4 w-4 opacity-90" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalUsers ? Math.round((activeUsers / totalUsers) * 100) : 0}%
              </div>
              <p className="text-xs opacity-75">User engagement</p>
            </CardContent>
          </Card>
        </div>

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4 text-red-600">{error}</CardContent>
          </Card>
        )}

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
                    disabled={isLoading}
                  />
                </div>
              </div>
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
                disabled={isLoading}
              >
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
              <Select
                value={roleFilter}
                onValueChange={setRoleFilter}
                disabled={isLoading}
              >
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

        {isLoading ? (
          <Card className="border-0 shadow-lg">
            <CardContent className="text-center py-12">
              <p className="text-gray-500">Loading users...</p>
            </CardContent>
          </Card>
        ) : error ? (
          <Card className="border-0 shadow-lg">
            <CardContent className="text-center py-12">
              <p className="text-red-500">{error}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <Card
                key={user.id}
                className="border-0 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-[#10294B] rounded-full flex items-center justify-center text-white font-bold">
                            {`${user.first_name[0]}${user.last_name[0]}`.toUpperCase()}
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-[#10294B]">{`${user.first_name} ${user.last_name}`}</h3>
                            <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {user.email}
                              </span>
                              {user.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {user.phone}
                                </span>
                              )}
                            </div>
                            {user.assigned_trucks.length > 0 && (
                              <div className="text-sm text-gray-500 mt-1">
                                <span>
                                  Trucks:{" "}
                                  {user.assigned_trucks
                                    .map((t) => t.truck_number)
                                    .join(", ")}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            className={
                              statusConfig[
                                user.status as keyof typeof statusConfig
                              ]?.color
                            }
                          >
                            {
                              statusConfig[
                                user.status as keyof typeof statusConfig
                              ]?.label
                            }
                          </Badge>
                          <Badge
                            className={
                              roleConfig[user.role as keyof typeof roleConfig]
                                ?.color
                            }
                          >
                            {
                              roleConfig[user.role as keyof typeof roleConfig]
                                ?.label
                            }
                          </Badge>
                          <Badge variant="outline">ID: {user.id}</Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t border-gray-100">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">
                            Join Date
                          </div>
                          <div className="font-semibold">
                            {new Date(user.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">
                            Last Active
                          </div>
                          <div className="font-semibold">
                            {user.updated_at
                              ? new Date(user.updated_at).toLocaleDateString()
                              : "Never"}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">
                            Total Orders
                          </div>
                          <div className="font-semibold">
                            {user.assigned_trucks.length ? "N/A" : 0}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">
                            Assigned Trucks
                          </div>
                          <div className="font-semibold">
                            {user.assigned_trucks.length}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 lg:ml-6">
                      <DropdownMenu
                        key={`dropdown-${user.id}-${dropdownKey}`}
                        onOpenChange={(open) => {
                          if (!open && triggerRefs.current.get(user.id)) {
                            triggerRefs.current.get(user.id)!.focus();
                          }
                        }}
                      >
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isLoading}
                            ref={(el) => {
                              if (el) {
                                triggerRefs.current.set(user.id, el);
                              } else {
                                triggerRefs.current.delete(user.id);
                              }
                            }}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewUserDetails(user);
                              document.activeElement?.blur();
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditUser(user);
                              document.activeElement?.blur();
                            }}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit User
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeactivateUser(user, () => {
                                document.activeElement?.blur();
                                triggerRefs.current.get(user.id)?.focus();
                              });
                            }}
                          >
                            <UserX className="mr-2 h-4 w-4" />
                            {user.status === "active"
                              ? "Deactivate"
                              : "Activate"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteUser(user, () => {
                                document.activeElement?.blur();
                                triggerRefs.current.get(user.id)?.focus();
                              });
                            }}
                          >
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
        )}

        {filteredUsers.length === 0 && !isLoading && !error && (
          <Card className="border-0 shadow-lg">
            <CardContent className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                No users found
              </h3>
              <p className="text-gray-500 mb-6">
                Try adjusting your search or filter criteria
              </p>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-[#E3253D] hover:bg-[#E3253D]/90"
                disabled={isLoading}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add New User
              </Button>
            </CardContent>
          </Card>
        )}

        <CreateUserModal
          isOpen={showCreateModal}
          onClose={handleModalClose}
          onUserCreated={handleCreateUser}
        />

        {selectedUser && (
          <EditUserModal
            isOpen={showEditModal}
            onClose={handleModalClose}
            user={selectedUser}
            onUserUpdated={(updatedUser) => {
              setUsers(
                users.map((u) => (u.id === updatedUser.id ? updatedUser : u))
              );
              handleModalClose();
            }}
          />
        )}

        {selectedUser && (
          <UserDetailsModal
            isOpen={showUserDetailsModal}
            onClose={handleModalClose}
            user={selectedUser}
          />
        )}
      </div>
    </Navigation>
  );
}
