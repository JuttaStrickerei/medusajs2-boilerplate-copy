"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react"
import {
  getServerWishlist,
  addServerWishlistItem,
  removeServerWishlistItem,
} from "@lib/data/wishlist"

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

// FIX: Dual-mode wishlist – localStorage for guests, server-side for logged-in users.
// On mount, we try fetching the server wishlist. If the user is logged in, the server
// returns items and we merge any localStorage leftovers into the server, then clear
// localStorage. If not logged in, we fall back to localStorage.

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([])
  const [isInitialized, setIsInitialized] = useState(false)
  const isLoggedInRef = useRef(false)

  // On mount: try to load server wishlist, fall back to localStorage for guests
  useEffect(() => {
    let cancelled = false

    async function init() {
      if (typeof window === "undefined") return

      // Try loading from server (returns [] if not logged in)
      try {
        const serverItems = await getServerWishlist()

        if (cancelled) return

        if (serverItems.length > 0) {
          // User is logged in and has server wishlist items
          isLoggedInRef.current = true

          // Convert server items to the frontend format
          const converted: WishlistItem[] = serverItems.map((si) => ({
            id: si.product_id,
            handle: "",
            title: "",
            thumbnail: null,
            addedAt: si.created_at,
          }))

          // Merge any localStorage items that are not yet on the server
          const localStored = localStorage.getItem(WISHLIST_STORAGE_KEY)
          if (localStored) {
            try {
              const localItems: WishlistItem[] = JSON.parse(localStored)
              const serverProductIds = new Set(serverItems.map((si) => si.product_id))

              for (const localItem of localItems) {
                if (!serverProductIds.has(localItem.id)) {
                  // Add missing local item to server (fire-and-forget)
                  addServerWishlistItem(localItem.id)
                  converted.push(localItem)
                } else {
                  // Server has this product – use local metadata (handle, title, thumbnail)
                  const idx = converted.findIndex((c) => c.id === localItem.id)
                  if (idx !== -1 && localItem.handle) {
                    converted[idx] = { ...converted[idx], ...localItem, addedAt: converted[idx].addedAt }
                  }
                }
              }

              // Clear localStorage since server is now source of truth
              localStorage.removeItem(WISHLIST_STORAGE_KEY)
            } catch {
              // Corrupted localStorage, ignore
              localStorage.removeItem(WISHLIST_STORAGE_KEY)
            }
          }

          setItems(converted)
          setIsInitialized(true)
          return
        }

        // Server returned empty – could be logged in with empty wishlist or guest.
        // Check if we have a JWT cookie by seeing if getServerWishlist didn't error
        // but returned []. We still try localStorage.
      } catch {
        // Not logged in or server error — use localStorage
      }

      if (cancelled) return

      // Fall back to localStorage (guest mode)
      isLoggedInRef.current = false
      try {
        const stored = localStorage.getItem(WISHLIST_STORAGE_KEY)
        if (stored) {
          setItems(JSON.parse(stored))
        }
      } catch {
        // Corrupted localStorage
      }
      setIsInitialized(true)
    }

    init()
    return () => { cancelled = true }
  }, [])

  // Save to localStorage only for guests
  useEffect(() => {
    if (isInitialized && typeof window !== "undefined" && !isLoggedInRef.current) {
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

    // Sync to server for logged-in users (fire-and-forget)
    if (isLoggedInRef.current) {
      addServerWishlistItem(product.id)
    }
  }, [])

  const removeFromWishlist = useCallback((productId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== productId))

    // Sync to server for logged-in users (fire-and-forget)
    if (isLoggedInRef.current) {
      removeServerWishlistItem(productId)
    }
  }, [])

  const toggleWishlist = useCallback((product: { id: string; handle: string; title: string; thumbnail: string | null }) => {
    setItems((prev) => {
      const isCurrentlyInWishlist = prev.some((item) => item.id === product.id)
      if (isCurrentlyInWishlist) {
        // Remove – sync to server
        if (isLoggedInRef.current) {
          removeServerWishlistItem(product.id)
        }
        return prev.filter((item) => item.id !== product.id)
      } else {
        // Add – sync to server
        if (isLoggedInRef.current) {
          addServerWishlistItem(product.id)
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
      }
    })
  }, [])

  const clearWishlist = useCallback(() => {
    // For server-side, remove each item individually (fire-and-forget)
    if (isLoggedInRef.current) {
      items.forEach((item) => {
        removeServerWishlistItem(item.id)
      })
    }
    setItems([])
  }, [items])

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
