import { sendEmail } from './sender';
import { getAllRestockItems } from '@/lib/utils';

interface RestockItem {
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
 * Send restock email notification
 * @returns Promise with email sending result
 */
export async function sendRestockEmail() {
  try {
    // Get restock items from database
    const restockItems = await getAllRestockItems();
    console.log("restockItems", restockItems);
    
    if (restockItems.length === 0) {
      return {
        success: true,
        message: "No restock items found",
        itemsCount: 0
      };
    }

    // Prepare template data
    const templateData = {
      restockItems,
      alertDate: new Date(),
      companyName: "TruXtoK"
    };

    // Send email using the main sender function
    const result = await sendEmail({
      to: process.env.ADMIN_EMAIL || "truxtok@mailinator.com",
      subject: `📦 Restock Alert - ${restockItems.length} Items Need Restocking`,
      ejsTemplate: "restock-email.ejs",
      templateData: templateData
    });

    if (result.success) {
      return {
        success: true,
        message: `Restock alert sent to ${process.env.ADMIN_EMAIL || "truxtok@mailinator.com"}`,
        itemsCount: restockItems.length,
        highPriorityItems: restockItems.filter(item => item.priority === 'high').length,
        messageId: result.messageId
      };
    } else {
      return {
        success: false,
        error: result.error,
        message: "Failed to send restock alert"
      };
    }

  } catch (error: any) {
    console.error("Restock email error:", error);
    return {
      success: false,
      error: error.message,
      message: "Failed to send restock alert"
    };
  }
}

/**
 * Send restock email for a single item
 * @param itemId Item ID to send alert for
 * @returns Promise with email sending result
 */
export async function sendRestockEmailOneItem(itemId: string) {
  try {
    // Get all restock items and find the specific one
    const restockItems = await getAllRestockItems();

    const restockItem = restockItems.find(item => item.id === itemId);

    if (!restockItem) {
      return {
        success: false,
        message: "Item not found or doesn't need restocking",
        itemId: itemId
      };
    }

    // Prepare template data with single item
    const templateData = {
      restockItems: [restockItem],
      alertDate: new Date(),
      companyName: "TruXtoK"
    };

    // Send email using the main sender function
    const result = await sendEmail({
      to: process.env.ADMIN_EMAIL || "truxtok@mailinator.com",
      subject: `📦 Restock Alert - ${restockItem.name}`,
      ejsTemplate: "restock-email.ejs",
      templateData: templateData
    });

    if (result.success) {
      return {
        success: true,
        message: `Restock alert sent for ${restockItem.name}`,
        itemId: itemId,
        itemName: restockItem.name,
        currentQuantity: restockItem.currentQuantity,
        standardLevel: restockItem.standardLevel,
        suggestedQuantity: restockItem.suggestedQuantity,
        priority: restockItem.priority,
        messageId: result.messageId
      };
    } else {
      return {
        success: false,
        error: result.error,
        message: "Failed to send restock alert",
        itemId: itemId
      };
    }

  } catch (error: any) {
    console.error("Restock email error for item:", error);
    return {
      success: false,
      error: error.message,
      message: "Failed to send restock alert",
      itemId: itemId
    };
  }
}
