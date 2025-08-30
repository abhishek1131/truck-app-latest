// Database abstraction layer for easy provider switching
import { createClient } from "@/lib/supabase/server"
import type {
  User,
  Truck,
  Order,
  OrderItem,
  TruckInventory,
  DashboardStats,
  ApiResponse,
  PaginatedResponse,
} from "./types"

export class DatabaseService {
  private async getClient() {
    return await createClient()
  }

  // User operations
  async getUsers(page = 1, limit = 10, role?: string): Promise<PaginatedResponse<User>> {
    try {
      const supabase = await this.getClient()
      let query = supabase.from("users").select("*", { count: "exact" }).order("created_at", { ascending: false })

      if (role) {
        query = query.eq("role", role)
      }

      const { data, error, count } = await query.range((page - 1) * limit, page * limit - 1)

      if (error) throw error

      return {
        success: true,
        data: data || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch users",
      }
    }
  }

  async createUser(userData: Partial<User>): Promise<ApiResponse<User>> {
    try {
      const supabase = await this.getClient()
      const { data, error } = await supabase.from("users").insert(userData).select().single()

      if (error) throw error

      return { success: true, data }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create user",
      }
    }
  }

  async updateUser(id: string, userData: Partial<User>): Promise<ApiResponse<User>> {
    try {
      const supabase = await this.getClient()
      const { data, error } = await supabase.from("users").update(userData).eq("id", id).select().single()

      if (error) throw error

      return { success: true, data }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update user",
      }
    }
  }

  // Truck operations
  async getTrucks(page = 1, limit = 10, status?: string): Promise<PaginatedResponse<Truck>> {
    try {
      const supabase = await this.getClient()
      let query = supabase
        .from("trucks")
        .select(
          `
          *,
          assigned_user:assigned_to(first_name, last_name, email)
        `,
          { count: "exact" },
        )
        .order("created_at", { ascending: false })

      if (status) {
        query = query.eq("status", status)
      }

      const { data, error, count } = await query.range((page - 1) * limit, page * limit - 1)

      if (error) throw error

      return {
        success: true,
        data: data || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch trucks",
      }
    }
  }

  async createTruck(truckData: Partial<Truck>): Promise<ApiResponse<Truck>> {
    try {
      const supabase = await this.getClient()
      const { data, error } = await supabase.from("trucks").insert(truckData).select().single()

      if (error) throw error

      return { success: true, data }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create truck",
      }
    }
  }

  async assignTruck(truckId: string, userId: string): Promise<ApiResponse<Truck>> {
    try {
      const supabase = await this.getClient()
      const { data, error } = await supabase
        .from("trucks")
        .update({ assigned_to: userId })
        .eq("id", truckId)
        .select()
        .single()

      if (error) throw error

      return { success: true, data }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to assign truck",
      }
    }
  }

  // Order operations
  async getOrders(page = 1, limit = 10, technicianId?: string, status?: string): Promise<PaginatedResponse<Order>> {
    try {
      const supabase = await this.getClient()
      let query = supabase
        .from("orders")
        .select(
          `
          *,
          technician:technician_id(first_name, last_name, email),
          truck:truck_id(truck_number, make, model),
          order_items(
            *,
            item:item_id(name, part_number, unit_price),
            bin:bin_id(bin_code, name)
          )
        `,
          { count: "exact" },
        )
        .order("created_at", { ascending: false })

      if (technicianId) {
        query = query.eq("technician_id", technicianId)
      }

      if (status) {
        query = query.eq("status", status)
      }

      const { data, error, count } = await query.range((page - 1) * limit, page * limit - 1)

      if (error) throw error

      return {
        success: true,
        data: data || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch orders",
      }
    }
  }

  async createOrder(orderData: Partial<Order>, items: Partial<OrderItem>[]): Promise<ApiResponse<Order>> {
    try {
      const supabase = await this.getClient()

      // Generate order number
      const { data: orderNumber } = await supabase.rpc("generate_order_number")

      // Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({ ...orderData, order_number: orderNumber })
        .select()
        .single()

      if (orderError) throw orderError

      // Create order items
      const orderItems = items.map((item) => ({
        ...item,
        order_id: order.id,
        total_price: (item.quantity || 0) * (item.unit_price || 0),
      }))

      const { error: itemsError } = await supabase.from("order_items").insert(orderItems)

      if (itemsError) throw itemsError

      return { success: true, data: order }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create order",
      }
    }
  }

  async updateOrderStatus(orderId: string, status: string, confirmedBy?: string): Promise<ApiResponse<Order>> {
    try {
      const supabase = await this.getClient()
      const updateData: any = { status }

      if (status === "confirmed" && confirmedBy) {
        updateData.confirmed_by = confirmedBy
        updateData.confirmed_at = new Date().toISOString()
      }

      const { data, error } = await supabase.from("orders").update(updateData).eq("id", orderId).select().single()

      if (error) throw error

      return { success: true, data }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update order status",
      }
    }
  }

  // Dashboard stats
  async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    try {
      const supabase = await this.getClient()

      const [
        { count: totalUsers },
        { count: totalTrucks },
        { count: totalOrders },
        { count: pendingOrders },
        { count: activeUsers },
        { count: trucksInService },
        { data: revenueData },
        { count: lowStockItems },
      ] = await Promise.all([
        supabase.from("users").select("*", { count: "exact", head: true }),
        supabase.from("trucks").select("*", { count: "exact", head: true }),
        supabase.from("orders").select("*", { count: "exact", head: true }),
        supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("users").select("*", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("trucks").select("*", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("orders").select("total_amount").eq("status", "delivered"),
        supabase.from("truck_inventory").select("*", { count: "exact", head: true }).lt("quantity", 5),
      ])

      const totalRevenue = revenueData?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0

      const stats: DashboardStats = {
        totalUsers: totalUsers || 0,
        totalTrucks: totalTrucks || 0,
        totalOrders: totalOrders || 0,
        pendingOrders: pendingOrders || 0,
        totalRevenue,
        activeUsers: activeUsers || 0,
        trucksInService: trucksInService || 0,
        lowStockItems: lowStockItems || 0,
      }

      return { success: true, data: stats }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch dashboard stats",
      }
    }
  }

  // Inventory operations
  async getTruckInventory(truckId: string): Promise<ApiResponse<TruckInventory[]>> {
    try {
      const supabase = await this.getClient()
      const { data, error } = await supabase
        .from("truck_inventory")
        .select(`
          *,
          item:item_id(name, part_number, unit_price),
          bin:bin_id(bin_code, name)
        `)
        .eq("truck_id", truckId)

      if (error) throw error

      return { success: true, data: data || [] }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch truck inventory",
      }
    }
  }

  async updateInventoryQuantity(inventoryId: string, quantity: number): Promise<ApiResponse<TruckInventory>> {
    try {
      const supabase = await this.getClient()
      const { data, error } = await supabase
        .from("truck_inventory")
        .update({ quantity })
        .eq("id", inventoryId)
        .select()
        .single()

      if (error) throw error

      return { success: true, data }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update inventory quantity",
      }
    }
  }
}

// Export singleton instance
export const db = new DatabaseService()
