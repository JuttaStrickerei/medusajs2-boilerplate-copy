import { HttpTypes } from "@medusajs/types"

/**
 * Enhanced order item with return status information
 */
export type EnhancedOrderItem = HttpTypes.StoreOrderLineItem & {
  deliveredQuantity: number
  returnedQuantity: number
  returnableQuantity: number
  isReturnable: boolean
}

/**
 * Enhance order items with delivery and return status
 * This helps determine which items can be returned and how many
 */
export function enhanceItemsWithReturnStatus(
  items: HttpTypes.StoreOrderLineItem[]
): EnhancedOrderItem[] {
  return items.map((item) => {
    // Get delivered quantity from fulfillment data
    // In Medusa, fulfilled_quantity tracks what has been shipped
    const fulfilledQuantity = item.detail?.fulfilled_quantity || 0
    
    // Get returned quantity from return data
    const returnedQuantity = item.detail?.return_requested_quantity || 0
    
    // Calculate what can still be returned
    const deliveredQuantity = fulfilledQuantity
    const returnableQuantity = Math.max(0, deliveredQuantity - returnedQuantity)
    
    return {
      ...item,
      deliveredQuantity,
      returnedQuantity,
      returnableQuantity,
      isReturnable: returnableQuantity > 0,
    }
  })
}

/**
 * Check if an order has any returnable items
 */
export function orderHasReturnableItems(order: HttpTypes.StoreOrder): boolean {
  if (!order.items || order.items.length === 0) {
    return false
  }

  const enhancedItems = enhanceItemsWithReturnStatus(order.items)
  return enhancedItems.some((item) => item.isReturnable)
}

/**
 * Get the total count of returnable items in an order
 */
export function getTotalReturnableQuantity(order: HttpTypes.StoreOrder): number {
  if (!order.items || order.items.length === 0) {
    return 0
  }

  const enhancedItems = enhanceItemsWithReturnStatus(order.items)
  return enhancedItems.reduce((total, item) => total + item.returnableQuantity, 0)
}

/**
 * Format return reason for display
 */
export function formatReturnReason(reason: HttpTypes.StoreReturnReason): string {
  return reason.label || reason.value || "Unbekannt"
}

/**
 * Get return status label in German
 */
export function getReturnStatusLabel(status: string): string {
  const statusMap: Record<string, string> = {
    requested: "Angefordert",
    received: "Erhalten",
    canceled: "Storniert",
    pending: "Ausstehend",
    requires_action: "Aktion erforderlich",
  }
  
  return statusMap[status] || status
}

/**
 * Get return status color class
 */
export function getReturnStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    requested: "bg-amber-100 text-amber-700",
    received: "bg-green-100 text-green-700",
    canceled: "bg-red-100 text-red-700",
    pending: "bg-stone-100 text-stone-600",
    requires_action: "bg-blue-100 text-blue-700",
  }
  
  return colorMap[status] || "bg-stone-100 text-stone-600"
}

