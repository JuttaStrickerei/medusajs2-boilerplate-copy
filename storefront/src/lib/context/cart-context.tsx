"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { HttpTypes } from "@medusajs/types"
import { retrieveCart } from "@lib/data/cart"

type CartContextType = {
  cart: HttpTypes.StoreCart | null
  isLoading: boolean
  refreshCart: () => Promise<void>
  itemCount: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<HttpTypes.StoreCart | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshCart = useCallback(async () => {
    try {
      const cartData = await retrieveCart()
      setCart(cartData)
    } catch (error) {
      console.error("Error fetching cart:", error)
    } finally {
      setIsLoading(false)
    }
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

    // Custom event for cart updates
    window.addEventListener("cart-updated", handleCartUpdate)
    
    // Also refresh when window gains focus
    window.addEventListener("focus", handleCartUpdate)

    return () => {
      window.removeEventListener("cart-updated", handleCartUpdate)
      window.removeEventListener("focus", handleCartUpdate)
    }
  }, [refreshCart])

  const itemCount = cart?.items?.reduce((acc, item) => acc + item.quantity, 0) || 0

  return (
    <CartContext.Provider
      value={{
        cart,
        isLoading,
        refreshCart,
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

