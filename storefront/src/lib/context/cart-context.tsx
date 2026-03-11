"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react"
import { HttpTypes } from "@medusajs/types"
import { retrieveCart } from "@lib/data/cart"

type CartContextType = {
  cart: HttpTypes.StoreCart | null
  isLoading: boolean
  refreshCart: () => Promise<void>
  clearCart: () => void
  itemCount: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

// Debounce delay for focus event (ms)
const FOCUS_DEBOUNCE_MS = 1000

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<HttpTypes.StoreCart | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  // Request deduplication: track if a refresh is in progress
  const refreshInProgressRef = useRef(false)
  // Track pending refresh request during in-flight request
  const pendingRefreshRef = useRef(false)
  // Debounce timer for focus event
  const focusDebounceRef = useRef<NodeJS.Timeout | null>(null)
  // Track last focus time to prevent rapid refreshes
  const lastFocusTimeRef = useRef(0)

  const refreshCart = useCallback(async () => {
    // If a refresh is already in progress, mark that we need another refresh
    if (refreshInProgressRef.current) {
      pendingRefreshRef.current = true
      return
    }

    refreshInProgressRef.current = true
    
    try {
      const cartData = await retrieveCart()
      setCart(cartData)
    } catch (error) {
      console.error("Error fetching cart:", error)
    } finally {
      setIsLoading(false)
      refreshInProgressRef.current = false
      
      // If a refresh was requested while we were fetching, do another refresh
      if (pendingRefreshRef.current) {
        pendingRefreshRef.current = false
        // Use setTimeout to prevent potential stack overflow with rapid updates
        setTimeout(() => refreshCart(), 0)
      }
    }
  }, [])

  // Explicit cart clearing for checkout completion
  const clearCart = useCallback(() => {
    setCart(null)
  }, [])

  // Initial load
  useEffect(() => {
    refreshCart()
  }, [refreshCart])

  // Listen for cart update events (from addToCart actions)
  useEffect(() => {
    const handleCartUpdate = () => {
      refreshCart()
    }

    // Debounced focus handler to prevent unnecessary requests
    const handleFocus = () => {
      const now = Date.now()
      
      // Skip if we refreshed recently (within debounce window)
      if (now - lastFocusTimeRef.current < FOCUS_DEBOUNCE_MS) {
        return
      }
      
      // Clear any pending debounce
      if (focusDebounceRef.current) {
        clearTimeout(focusDebounceRef.current)
      }
      
      // Debounce the focus refresh
      focusDebounceRef.current = setTimeout(() => {
        lastFocusTimeRef.current = Date.now()
        refreshCart()
      }, 100) // Small delay to batch rapid focus events
    }

    // Custom event for cart updates (immediate)
    window.addEventListener("cart-updated", handleCartUpdate)
    
    // Focus event with debouncing
    window.addEventListener("focus", handleFocus)

    return () => {
      window.removeEventListener("cart-updated", handleCartUpdate)
      window.removeEventListener("focus", handleFocus)
      if (focusDebounceRef.current) {
        clearTimeout(focusDebounceRef.current)
      }
    }
  }, [refreshCart])

  const itemCount = cart?.items?.reduce((acc, item) => acc + item.quantity, 0) || 0

  return (
    <CartContext.Provider
      value={{
        cart,
        isLoading,
        refreshCart,
        clearCart,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}

// Helper function to trigger cart update from anywhere
export function triggerCartRefresh() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("cart-updated"))
  }
}

export default CartContext

