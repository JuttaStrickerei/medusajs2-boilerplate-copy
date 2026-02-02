"use client"

import { useEffect } from "react"
import { useCart, triggerCartRefresh } from "@lib/context/cart-context"

/**
 * Client component that clears the cart state when mounted.
 * Used on the order confirmation page to immediately clear the cart
 * after a successful order, without waiting for server response.
 */
export default function ClearCartOnMount() {
  const { clearCart } = useCart()

  useEffect(() => {
    // Immediately clear the cart state in the context
    // This ensures the UI shows an empty cart without delay
    clearCart()
    
    // Also trigger a refresh to sync with server state
    // This handles edge cases where the cart cookie might still exist
    triggerCartRefresh()
  }, [clearCart])

  // This component renders nothing - it only handles the side effect
  return null
}
