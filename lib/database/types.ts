// Database types for type safety and easy provider switching
export interface User {
  id: string
  email: string
  first_name?: string
  last_name?: string
  phone?: string
  role: "admin" | "technician"
  status: "active" | "inactive" | "suspended"
  created_at: string
  updated_at: string
}

export interface Truck {
  id: string
  truck_number: string
  make: string
  model: string
  year: number
  license_plate?: string
  vin?: string
  status: "active" | "maintenance" | "inactive"
  location?: string
  mileage: number
  assigned_to?: string
  created_at: string
  updated_at: string
}

export interface InventoryCategory {
  id: string
  name: string
  description?: string
  created_at: string
}

export interface InventoryItem {
  id: string
  part_number: string
  name: string
  description?: string
  category_id?: string
  unit_price: number
  cost_price: number
  supplier?: string
  created_at: string
  updated_at: string
}

export interface TruckBin {
  id: string
  truck_id: string
  bin_code: string
  name?: string
  description?: string
  max_capacity: number
  created_at: string
}

export interface TruckInventory {
  id: string
  truck_id: string
  bin_id: string
  item_id: string
  quantity: number
  min_quantity: number
  max_quantity: number
  last_restocked?: string
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  order_number: string
  technician_id: string
  truck_id: string
  status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled"
  priority: "low" | "medium" | "high" | "urgent"
  total_amount: number
  tax_amount: number
  commission_amount: number
  notes?: string
  requested_delivery_date?: string
  confirmed_by?: string
  confirmed_at?: string
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  item_id: string
  bin_id?: string
  quantity: number
  unit_price: number
  total_price: number
  notes?: string
  created_at: string
}

export interface Credit {
  id: string
  user_id: string
  order_id?: string
  type: "earned" | "spent" | "bonus" | "adjustment"
  amount: number
  balance_after: number
  description?: string
  created_at: string
}

export interface SystemSetting {
  id: string
  key: string
  value: string
  description?: string
  updated_by?: string
  updated_at: string
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Dashboard stats types
export interface DashboardStats {
  totalUsers: number
  totalTrucks: number
  totalOrders: number
  pendingOrders: number
  totalRevenue: number
  activeUsers: number
  trucksInService: number
  lowStockItems: number
}
