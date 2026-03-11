"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react"
import { usePathname } from "next/navigation"
import {
  getServerWishlist,
  addServerWishlistItem,
  removeServerWishlistItem,
  checkIsAuthenticated,
  type WishlistItemResponse,
} from "@lib/data/wishlist"
import { onAuthLogin, onAuthLogout } from "@lib/events/auth-events"

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

function readLocalStorage(): WishlistItem[] {
  if (typeof window === "undefined") return []
  try {
    const stored = localStorage.getItem(WISHLIST_STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function writeLocalStorage(items: WishlistItem[]) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items))
  } catch {
    // quota exceeded or blocked
  }
}

function clearLocalStorage() {
  if (typeof window === "undefined") return
  try {
    localStorage.removeItem(WISHLIST_STORAGE_KEY)
  } catch {
    // blocked
  }
}

function serverItemToLocal(item: WishlistItemResponse): WishlistItem {
  return {
    id: item.product_id,
    handle: item.product_handle ?? "",
    title: item.product_title ?? "",
    thumbnail: item.product_thumbnail ?? null,
    addedAt: item.created_at,
  }
}

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([])
  const [isInitialized, setIsInitialized] = useState(false)
  const isLoggedInRef = useRef(false)
  const itemsRef = useRef<WishlistItem[]>([])
  const pathname = usePathname()

  const loadServerWishlistAndMerge = useCallback(async () => {
    const serverItems = await getServerWishlist()

    const serverConverted = serverItems.map(serverItemToLocal)
    const serverProductIds = new Set(serverItems.map((si) => si.product_id))

    const localItems = readLocalStorage()
    const itemsToAdd: WishlistItem[] = []

    for (const localItem of localItems) {
      if (!serverProductIds.has(localItem.id)) {
        addServerWishlistItem(localItem.id)
        itemsToAdd.push(localItem)
      } else {
        // Server has this product -- enrich with local metadata if server data is missing
        const idx = serverConverted.findIndex((c) => c.id === localItem.id)
        if (idx !== -1 && !serverConverted[idx].handle && localItem.handle) {
          serverConverted[idx] = {
            ...serverConverted[idx],
            handle: localItem.handle,
            title: localItem.title,
            thumbnail: localItem.thumbnail,
          }
        }
      }
    }

    clearLocalStorage()
    isLoggedInRef.current = true

    const merged = [...serverConverted, ...itemsToAdd]
    setItems(merged)
  }, [])

  const loadGuestWishlist = useCallback(() => {
    isLoggedInRef.current = false
    setItems(readLocalStorage())
  }, [])

  // Initial load
  useEffect(() => {
    let cancelled = false

    async function init() {
      if (typeof window === "undefined") return

      const isAuth = await checkIsAuthenticated()

      if (cancelled) return

      if (isAuth) {
        await loadServerWishlistAndMerge()
      } else {
        loadGuestWishlist()
      }

      if (!cancelled) {
        setIsInitialized(true)
      }
    }

    init()
    return () => { cancelled = true }
  }, [loadServerWishlistAndMerge, loadGuestWishlist])

  // Listen for auth events (fast path for explicit login/logout actions)
  useEffect(() => {
    const unsubLogin = onAuthLogin(async () => {
      await loadServerWishlistAndMerge()
    })

    const unsubLogout = onAuthLogout(() => {
      isLoggedInRef.current = false
      setItems([])
      clearLocalStorage()
    })

    return () => {
      unsubLogin()
      unsubLogout()
    }
  }, [loadServerWishlistAndMerge])

  // Re-check auth state on navigation (catches login redirect, page transitions)
  useEffect(() => {
    if (!isInitialized) return

    let cancelled = false

    async function recheckAuth() {
      const isAuth = await checkIsAuthenticated()
      if (cancelled) return

      if (isAuth && !isLoggedInRef.current) {
        await loadServerWishlistAndMerge()
      } else if (!isAuth && isLoggedInRef.current) {
        isLoggedInRef.current = false
        setItems([])
        clearLocalStorage()
      }
    }

    recheckAuth()
    return () => { cancelled = true }
  }, [pathname, isInitialized, loadServerWishlistAndMerge])

  // Keep ref in sync
  useEffect(() => {
    itemsRef.current = items
  }, [items])

  // Persist to localStorage for guests only
  useEffect(() => {
    if (isInitialized && !isLoggedInRef.current) {
      writeLocalStorage(items)
    }
  }, [items, isInitialized])

  const isInWishlist = useCallback((productId: string) => {
    return items.some((item) => item.id === productId)
  }, [items])

  const addToWishlist = useCallback((product: { id: string; handle: string; title: string; thumbnail: string | null }) => {
    setItems((prev) => {
      if (prev.some((item) => item.id === product.id)) return prev
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

    if (isLoggedInRef.current) {
      addServerWishlistItem(product.id)
    }
  }, [])

  const removeFromWishlist = useCallback((productId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== productId))

    if (isLoggedInRef.current) {
      removeServerWishlistItem(productId)
    }
  }, [])

  const toggleWishlist = useCallback((product: { id: string; handle: string; title: string; thumbnail: string | null }) => {
    const exists = itemsRef.current.some((item) => item.id === product.id)

    if (exists) {
      setItems((prev) => prev.filter((item) => item.id !== product.id))
      if (isLoggedInRef.current) {
        removeServerWishlistItem(product.id)
      }
    } else {
      setItems((prev) => {
        if (prev.some((item) => item.id === product.id)) return prev
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
      if (isLoggedInRef.current) {
        addServerWishlistItem(product.id)
      }
    }
  }, [])

  const clearWishlist = useCallback(() => {
    if (isLoggedInRef.current) {
      items.forEach((item) => removeServerWishlistItem(item.id))
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
