"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"

const WISHLIST_STORAGE_KEY = "medusa_wishlist"

type WishlistItem = {
  id: string
  handle: string
  title: string
  thumbnail: string | null
  addedAt: string
}

type WishlistContextType = {
  items: WishlistItem[]
  isInWishlist: (productId: string) => boolean
  addToWishlist: (product: { id: string; handle: string; title: string; thumbnail: string | null }) => void
  removeFromWishlist: (productId: string) => void
  toggleWishlist: (product: { id: string; handle: string; title: string; thumbnail: string | null }) => void
  clearWishlist: () => void
  itemCount: number
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined)

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([])
  const [isInitialized, setIsInitialized] = useState(false)

  // Load wishlist from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(WISHLIST_STORAGE_KEY)
        if (stored) {
          setItems(JSON.parse(stored))
        }
      } catch (error) {
        console.error("Error loading wishlist:", error)
      }
      setIsInitialized(true)
    }
  }, [])

  // Save wishlist to localStorage whenever it changes
  useEffect(() => {
    if (isInitialized && typeof window !== "undefined") {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items))
    }
  }, [items, isInitialized])

  const isInWishlist = useCallback((productId: string) => {
    return items.some((item) => item.id === productId)
  }, [items])

  const addToWishlist = useCallback((product: { id: string; handle: string; title: string; thumbnail: string | null }) => {
    setItems((prev) => {
      if (prev.some((item) => item.id === product.id)) {
        return prev
      }
      return [
        ...prev,
        {
          id: product.id,
          handle: product.handle,
          title: product.title,
          thumbnail: product.thumbnail,
          addedAt: new Date().toISOString(),
        },
      ]
    })
  }, [])

  const removeFromWishlist = useCallback((productId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== productId))
  }, [])

  const toggleWishlist = useCallback((product: { id: string; handle: string; title: string; thumbnail: string | null }) => {
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id)
    } else {
      addToWishlist(product)
    }
  }, [isInWishlist, addToWishlist, removeFromWishlist])

  const clearWishlist = useCallback(() => {
    setItems([])
  }, [])

  return (
    <WishlistContext.Provider
      value={{
        items,
        isInWishlist,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
        clearWishlist,
        itemCount: items.length,
      }}
    >
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
  const context = useContext(WishlistContext)
  if (context === undefined) {
    throw new Error("useWishlist must be used within a WishlistProvider")
  }
  return context
}

export default WishlistContext

