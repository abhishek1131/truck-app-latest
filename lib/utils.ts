import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import pool from "@/lib/db"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Inventory utility functions
export interface LowStockItem {
  id: string;
  name: string;
  partNumber: string;
  category?: string;
  currentQuantity: number;
  minQuantity: number;
  location?: string;
  truckNumber?: string;
  binCode?: string;
}

export interface RestockItem {
  id: string;
  name: string;
  partNumber: string;
  category?: string;
  currentQuantity: number;
  standardLevel: number;
  suggestedQuantity: number;
  location?: string;
  priority: 'high' | 'medium' | 'low';
}

/**
 * Get all low stock items across all trucks and bins
 * @returns Promise with array of low stock items
 */
export async function getAllLowStockItems(): Promise<LowStockItem[]> {
  try {
    const [rows] = await pool.query(`
      SELECT 
        ii.id,
        ii.name,
        ii.part_number,
        COALESCE(SUM(ti.quantity), 0) AS current_quantity,
        ii.min_quantity,
        GROUP_CONCAT(DISTINCT CONCAT(t.truck_number, ' - ', tb.bin_code) SEPARATOR ', ') AS location
      FROM inventory_items ii
      LEFT JOIN truck_inventory ti ON ii.id = ti.item_id
      LEFT JOIN trucks t ON ti.truck_id = t.id
      LEFT JOIN truck_bins tb ON ti.bin_id = tb.id
      WHERE ii.min_quantity > 0
      GROUP BY ii.id, ii.name, ii.part_number, ii.min_quantity
      HAVING COALESCE(SUM(ti.quantity), 0) < ii.min_quantity
      ORDER BY 
        CASE 
          WHEN COALESCE(SUM(ti.quantity), 0) = 0 THEN 1
          WHEN COALESCE(SUM(ti.quantity), 0) <= ii.min_quantity * 0.5 THEN 2
          ELSE 3
        END,
        ii.name
    `);

    return (rows as any[]).map((row: any) => ({
      id: row.id,
      name: row.name,
      partNumber: row.part_number,
      currentQuantity: row.current_quantity,
      minQuantity: row.min_quantity,
      location: row.location
    }));

  } catch (error) {
    console.error("Error fetching low stock items:", error);
    throw error;
  }
}

/**
 * Get all items that need restocking
 * @returns Promise with array of restock items
 */
export async function getAllRestockItems(): Promise<RestockItem[]> {
  try {
    const [rows] = await pool.query(`
      SELECT 
        ii.id,
        ii.name,
        ii.part_number,
        COALESCE(SUM(ti.quantity), 0) AS current_quantity,
        COALESCE(ii.standard_level, ii.max_quantity, 10) AS standard_level,
        (COALESCE(ii.standard_level, ii.max_quantity, 10) - COALESCE(SUM(ti.quantity), 0)) AS suggested_quantity,
        GROUP_CONCAT(DISTINCT CONCAT(t.truck_number, ' - ', tb.bin_code) SEPARATOR ', ') AS location,
        CASE 
          WHEN COALESCE(SUM(ti.quantity), 0) = 0 THEN 'high'
          WHEN COALESCE(SUM(ti.quantity), 0) <= COALESCE(ii.standard_level, ii.max_quantity, 10) * 0.3 THEN 'high'
          WHEN COALESCE(SUM(ti.quantity), 0) <= COALESCE(ii.standard_level, ii.max_quantity, 10) * 0.6 THEN 'medium'
          ELSE 'low'
        END AS priority
      FROM inventory_items ii
      LEFT JOIN truck_inventory ti ON ii.id = ti.item_id
      LEFT JOIN trucks t ON ti.truck_id = t.id
      LEFT JOIN truck_bins tb ON ti.bin_id = tb.id
      WHERE COALESCE(ii.standard_level, ii.max_quantity, 10) > 0
      GROUP BY ii.id, ii.name, ii.part_number, ii.standard_level, ii.max_quantity
      HAVING COALESCE(SUM(ti.quantity), 0) < COALESCE(ii.standard_level, ii.max_quantity, 10)
      ORDER BY 
        CASE 
          WHEN COALESCE(SUM(ti.quantity), 0) = 0 THEN 1
          WHEN COALESCE(SUM(ti.quantity), 0) <= COALESCE(ii.standard_level, ii.max_quantity, 10) * 0.3 THEN 2
          WHEN COALESCE(SUM(ti.quantity), 0) <= COALESCE(ii.standard_level, ii.max_quantity, 10) * 0.6 THEN 3
          ELSE 4
        END,
        ii.name
    `);

    return (rows as any[]).map((row: any) => ({
      id: row.id,
      name: row.name,
      partNumber: row.part_number,
      currentQuantity: row.current_quantity,
      standardLevel: row.standard_level,
      suggestedQuantity: Math.max(0, row.suggested_quantity),
      location: row.location,
      priority: row.priority
    }));

  } catch (error) {
    console.error("Error fetching restock items:", error);
    throw error;
  }
}

/**
 * Get low stock item by ID
 * @param itemId Item ID to search for
 * @returns Promise with low stock item or null if not found
 */
export async function getLowStockItemById(itemId: string): Promise<LowStockItem | null> {
  try {
    const [rows] = await pool.query(`
      SELECT 
  ii.id,
  ii.name,
  ii.part_number,
  COALESCE(SUM(ti.quantity), 0) AS current_quantity,  -- Sum of all truck quantities
  ii.min_quantity,                                    -- Min quantity from inventory_items
  GROUP_CONCAT(DISTINCT CONCAT(t.truck_number, ' - ', tb.bin_code) SEPARATOR ', ') AS location
FROM inventory_items ii
LEFT JOIN truck_inventory ti ON ii.id = ti.item_id    -- Join with truck inventory
LEFT JOIN trucks t ON ti.truck_id = t.id
LEFT JOIN truck_bins tb ON ti.bin_id = tb.id
WHERE ii.id = ? AND ii.min_quantity > 0
GROUP BY ii.id, ii.name, ii.part_number, ii.min_quantity
HAVING COALESCE(SUM(ti.quantity), 0) < ii.min_quantity  -- Check if sum < min_quantity
    `, [itemId]);

    const items = (rows as any[]).map((row: any) => ({
      id: row.id,
      name: row.name,
      partNumber: row.part_number,
      currentQuantity: row.current_quantity,
      minQuantity: row.min_quantity,
      location: row.location
    }));

    return items.length > 0 ? items[0] : null;

  } catch (error) {
    console.error("Error fetching low stock item by ID:", error);
    throw error;
  }
}
