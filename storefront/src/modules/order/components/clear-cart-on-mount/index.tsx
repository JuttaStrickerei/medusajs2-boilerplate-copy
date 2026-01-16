"use client"

import { useEffect } from "react"
import { triggerCartRefresh } from "@lib/context/cart-context"

/**
 * Client component that triggers a cart refresh when mounted.
 * Used on the order confirmation page to clear the cart state
 * after a successful order.
 */
export default function ClearCartOnMount() {
  useEffect(() => {
    // Trigger cart refresh to sync client state with server
    // The cart cookie has been deleted, so this will result in an empty cart
    triggerCartRefresh()
  }, [])

  // This component renders nothing - it only handles the side effect
  return null
}
