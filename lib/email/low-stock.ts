import { sendEmail } from './sender';
import pool from "@/lib/db";
import { getAllLowStockItems, getLowStockItemById } from '@/lib/utils';

interface LowStockItem {
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

/**
 * Send low stock email notification
 * @returns Promise with email sending result
 */
export async function sendLowStockEmail() {
  try {
    // Get low stock items from database
    const lowStockItems = await getAllLowStockItems();
    console.log("lowStockItems", lowStockItems);
    if (lowStockItems.length === 0) {
      return {
        success: true,
        message: "No low stock items found",
        itemsCount: 0
      };
    }

    // Prepare template data
    const templateData = {
      lowStockItems,
      alertDate: new Date(),
      companyName: "TruXtoK"
    };

    // Send email using the main sender function
    const result = await sendEmail({
      to: process.env.ADMIN_EMAIL || "truxtok@mailinator.com",
      subject: `🚨 Low Stock Alert - ${lowStockItems.length} Items Need Attention`,
      ejsTemplate: "low-stock-email.ejs",
      templateData: templateData
    });

    if (result.success) {
      return {
        success: true,
        message: `Low stock alert sent to ${process.env.ADMIN_EMAIL || "truxtok@mailinator.com"}`,
        itemsCount: lowStockItems.length,
        criticalItems: lowStockItems.filter(item => item.currentQuantity === 0).length,
        messageId: result.messageId
      };
    } else {
      return {
        success: false,
        error: result.error,
        message: "Failed to send low stock alert"
      };
    }

  } catch (error: any) {
    console.error("Low stock email error:", error);
    return {
      success: false,
      error: error.message,
      message: "Failed to send low stock alert"
    };
  }
}

/**
 * Send low stock email for a single item
 * @param itemId Item ID to send alert for
 * @returns Promise with email sending result
 */
export async function sendLowStockEmailOneItem(itemId: string) {
  try {
    // Get the specific low stock item
    console.log("itemId", itemId);
    const lowStockItem = await getLowStockItemById(itemId);
    console.log("lowStockItem", lowStockItem);
    if (!lowStockItem) {
      return {
        success: false,
        message: "Item not found or not low in stock",
        itemId: itemId
      };
    }

    // Prepare template data with single item
    const templateData = {
      lowStockItems: [lowStockItem],
      alertDate: new Date(),
      companyName: "TruXtoK"
    };

    // Send email using the main sender function
    const result = await sendEmail({
      to: process.env.ADMIN_EMAIL || "truxtok@mailinator.com",
      subject: `🚨 Low Stock Alert - ${lowStockItem.name}`,
      ejsTemplate: "low-stock-email.ejs",
      templateData: templateData
    });

    if (result.success) {
      return {
        success: true,
        message: `Low stock alert sent for ${lowStockItem.name}`,
        itemId: itemId,
        itemName: lowStockItem.name,
        currentQuantity: lowStockItem.currentQuantity,
        minQuantity: lowStockItem.minQuantity,
        messageId: result.messageId
      };
    } else {
      return {
        success: false,
        error: result.error,
        message: "Failed to send low stock alert",
        itemId: itemId
      };
    }

  } catch (error: any) {
    console.error("Low stock email error for item:", error);
    return {
      success: false,
      error: error.message,
      message: "Failed to send low stock alert",
      itemId: itemId
    };
  }
}

