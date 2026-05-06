"use client"

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react"
import {
  addServerWishlistItem,
  getServerWishlist,
  removeServerWishlistItem,
  type WishlistItem,
} from "@lib/data/wishlist"

export const WISHLIST_STORAGE_KEY = "medusa_wishlist"

// Re-export so existing callers that imported from here still resolve.
export type { WishlistItem }

type WishlistProductInput = {
  id: string
  handle: string
  title: string
  thumbnail: string | null
}

type WishlistContextType = {
  items: WishlistItem[]
  isInWishlist: (productId: string) => boolean
  addToWishlist: (product: WishlistProductInput) => void
  removeFromWishlist: (productId: string) => void
  toggleWishlist: (product: WishlistProductInput) => void
  clearWishlist: () => void
  itemCount: number
  refreshWishlist: () => Promise<void>
  clearLocalWishlist: () => void
  isAuthenticated: boolean
}

const WishlistContext = createContext<WishlistContextType | undefined>(
  undefined
)

// FIX: Dual-mode wishlist, hydrated.
//   - Logged in  → server is source of truth; localStorage is NEVER written.
//   - Guest      → localStorage only; no server calls.
// Server-sourced items are hydrated with product metadata at the data layer,
// so the frontend always gets real handle/title/thumbnail values.
// Handlers are React 19 pure-updater compliant: server actions run in the
// handler body, NOT inside `setItems(prev => ...)` callbacks.

export function WishlistProvider({
  initialAuthenticated,
  children,
}: {
  initialAuthenticated: boolean
  children: React.ReactNode
}) {
  const [items, setItems] = useState<WishlistItem[]>([])
  const [isInitialized, setIsInitialized] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(initialAuthenticated)
  const isLoggedInRef = useRef(initialAuthenticated)
  const itemsRef = useRef<WishlistItem[]>([])

  // Mirror items into a ref so handlers can read current state without
  // capturing it in deps (keeps callbacks stable).
  useEffect(() => {
    itemsRef.current = items
  }, [items])

  useEffect(() => {
    let cancelled = false

    async function init() {
      if (typeof window === "undefined") return

      if (initialAuthenticated) {
        const { authenticated, items: serverItems } = await getServerWishlist()
        if (cancelled) return

        isLoggedInRef.current = authenticated
        setIsAuthenticated(authenticated)
        setItems(serverItems)
        setIsInitialized(true)
        return
      }

      // Guest mode — localStorage only. On logout transition, wipe in-memory
      // state first so previous-user items never leak into guest mode.
      isLoggedInRef.current = false
      setIsAuthenticated(false)
      setItems([])
      try {
        const stored = localStorage.getItem(WISHLIST_STORAGE_KEY)
        if (stored) {
          setItems(JSON.parse(stored))
        }
      } catch {
        // Corrupted localStorage — ignore and start empty
      }
      setIsInitialized(true)
    }

    init()
    return () => {
      cancelled = true
    }
  }, [initialAuthenticated])

  // Persist to localStorage ONLY for guests. Logged-in users' state lives on the server.
  useEffect(() => {
    if (
      isInitialized &&
      typeof window !== "undefined" &&
      !isLoggedInRef.current
    ) {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items))
    }
  }, [items, isInitialized])

  const isInWishlist = useCallback(
    (productId: string) => items.some((item) => item.id === productId),
    [items]
  )

  const addToWishlist = useCallback((product: WishlistProductInput) => {
    const already = itemsRef.current.some((i) => i.id === product.id)
    if (already) return

    if (isLoggedInRef.current) {
      addServerWishlistItem(product.id)
    }

    setItems((prev) => {
      if (prev.some((i) => i.id === product.id)) return prev
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
    const present = itemsRef.current.some((i) => i.id === productId)
    if (!present) return

    if (isLoggedInRef.current) {
      removeServerWishlistItem(productId)
    }

    setItems((prev) => prev.filter((i) => i.id !== productId))
  }, [])

  const toggleWishlist = useCallback((product: WishlistProductInput) => {
    const already = itemsRef.current.some((i) => i.id === product.id)

    if (already) {
      if (isLoggedInRef.current) {
        removeServerWishlistItem(product.id)
      }
      setItems((prev) => prev.filter((i) => i.id !== product.id))
      return
    }

    if (isLoggedInRef.current) {
      addServerWishlistItem(product.id)
    }
    setItems((prev) => {
      if (prev.some((i) => i.id === product.id)) return prev
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

  const clearWishlist = useCallback(() => {
    const snapshot = itemsRef.current
    if (isLoggedInRef.current) {
      for (const it of snapshot) {
        removeServerWishlistItem(it.id)
      }
    }
    setItems([])
  }, [])

  const refreshWishlist = useCallback(async () => {
    const { authenticated, items: serverItems } = await getServerWishlist()
    isLoggedInRef.current = authenticated
    setIsAuthenticated(authenticated)

    if (authenticated) {
      setItems(serverItems)
    }
  }, [])

  const clearLocalWishlist = useCallback(() => {
    if (typeof window === "undefined") return
    try {
      localStorage.removeItem(WISHLIST_STORAGE_KEY)
    } catch {
      // Ignore
    }
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
        refreshWishlist,
        clearLocalWishlist,
        isAuthenticated,
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
