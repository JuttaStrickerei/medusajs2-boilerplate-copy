"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react"
import { usePathname } from "next/navigation"
import { onAuthLogin, onAuthLogout } from "@lib/events/auth-events"

const WISHLIST_STORAGE_KEY = "medusa_wishlist"

type WishlistItem = {
  id: string
  handle: string
  title: string
  thumbnail: string | null
  addedAt: string
}

type ServerWishlistItem = {
  product_id: string
  product_handle: string | null
  product_title: string | null
  product_thumbnail: string | null
  created_at: string
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

// --- Client-side API calls (NOT server actions) ---

async function apiGetWishlist(): Promise<ServerWishlistItem[]> {
  try {
    const res = await fetch("/api/wishlist", { method: "GET", credentials: "include" })
    if (!res.ok) return []
    const data = await res.json()
    return data.wishlist_items ?? []
  } catch {
    return []
  }
}

function apiAddWishlistItem(productId: string) {
  fetch("/api/wishlist", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ product_id: productId }),
    keepalive: true,
  }).catch((e) => console.error("[Wishlist] add failed:", e))
}

function apiRemoveWishlistItem(productId: string) {
  fetch("/api/wishlist", {
    method: "DELETE",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ product_id: productId }),
    keepalive: true,
  }).catch((e) => console.error("[Wishlist] remove failed:", e))
}

async function apiCheckAuth(): Promise<boolean> {
  try {
    const res = await fetch("/api/wishlist", { method: "GET", credentials: "include" })
    return res.ok
  } catch {
    return false
  }
}

// --- localStorage helpers ---

function readLocal(): WishlistItem[] {
  if (typeof window === "undefined") return []
  try {
    const s = localStorage.getItem(WISHLIST_STORAGE_KEY)
    return s ? JSON.parse(s) : []
  } catch { return [] }
}

function writeLocal(items: WishlistItem[]) {
  if (typeof window === "undefined") return
  try { localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items)) } catch {}
}

function clearLocal() {
  if (typeof window === "undefined") return
  try { localStorage.removeItem(WISHLIST_STORAGE_KEY) } catch {}
}

function toLocal(item: ServerWishlistItem): WishlistItem {
  return {
    id: item.product_id,
    handle: item.product_handle ?? "",
    title: item.product_title ?? "",
    thumbnail: item.product_thumbnail ?? null,
    addedAt: item.created_at,
  }
}

// --- Provider ---

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([])
  const [isInitialized, setIsInitialized] = useState(false)
  const isLoggedInRef = useRef(false)
  const itemsRef = useRef<WishlistItem[]>([])
  const pathname = usePathname()

  const loadFromServer = useCallback(async () => {
    const serverItems = await apiGetWishlist()

    if (serverItems.length === 0 && !isLoggedInRef.current) {
      return false
    }

    const converted = serverItems.map(toLocal)
    const serverIds = new Set(serverItems.map((si) => si.product_id))

    const localItems = readLocal()
    for (const li of localItems) {
      if (!serverIds.has(li.id)) {
        apiAddWishlistItem(li.id)
        converted.push(li)
      } else {
        const idx = converted.findIndex((c) => c.id === li.id)
        if (idx !== -1 && !converted[idx].handle && li.handle) {
          converted[idx] = { ...converted[idx], handle: li.handle, title: li.title, thumbnail: li.thumbnail }
        }
      }
    }

    clearLocal()
    isLoggedInRef.current = true
    setItems(converted)
    return true
  }, [])

  // Initial load
  useEffect(() => {
    let cancelled = false
    async function init() {
      if (typeof window === "undefined") return

      const serverItems = await apiGetWishlist()
      if (cancelled) return

      if (serverItems.length > 0) {
        const converted = serverItems.map(toLocal)
        const serverIds = new Set(serverItems.map((si) => si.product_id))
        const localItems = readLocal()
        for (const li of localItems) {
          if (!serverIds.has(li.id)) {
            apiAddWishlistItem(li.id)
            converted.push(li)
          }
        }
        clearLocal()
        isLoggedInRef.current = true
        setItems(converted)
      } else {
        isLoggedInRef.current = false
        setItems(readLocal())
      }
      setIsInitialized(true)
    }
    init()
    return () => { cancelled = true }
  }, [])

  // Auth events
  useEffect(() => {
    const unsubLogin = onAuthLogin(() => { loadFromServer() })
    const unsubLogout = onAuthLogout(() => {
      isLoggedInRef.current = false
      setItems([])
      clearLocal()
    })
    return () => { unsubLogin(); unsubLogout() }
  }, [loadFromServer])

  // Re-check on navigation (catches login redirect)
  useEffect(() => {
    if (!isInitialized) return
    let cancelled = false
    async function recheck() {
      const serverItems = await apiGetWishlist()
      if (cancelled) return

      const hasItems = serverItems.length > 0
      const wasLoggedIn = isLoggedInRef.current

      if (hasItems && !wasLoggedIn) {
        isLoggedInRef.current = true
        setItems(serverItems.map(toLocal))
        clearLocal()
      } else if (!hasItems && wasLoggedIn) {
        // Might have logged out or genuinely empty — check by trying API
        isLoggedInRef.current = false
        setItems(readLocal())
      }
    }
    recheck()
    return () => { cancelled = true }
  }, [pathname, isInitialized])

  useEffect(() => { itemsRef.current = items }, [items])

  // localStorage persistence for guests
  useEffect(() => {
    if (isInitialized && !isLoggedInRef.current) {
      writeLocal(items)
    }
  }, [items, isInitialized])

  const isInWishlist = useCallback((productId: string) => {
    return items.some((item) => item.id === productId)
  }, [items])

  const addToWishlist = useCallback((product: { id: string; handle: string; title: string; thumbnail: string | null }) => {
    setItems((prev) => {
      if (prev.some((item) => item.id === product.id)) return prev
      return [...prev, {
        id: product.id,
        handle: product.handle,
        title: product.title,
        thumbnail: product.thumbnail,
        addedAt: new Date().toISOString(),
      }]
    })
    apiAddWishlistItem(product.id)
  }, [])

  const removeFromWishlist = useCallback((productId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== productId))
    apiRemoveWishlistItem(productId)
  }, [])

  const toggleWishlist = useCallback((product: { id: string; handle: string; title: string; thumbnail: string | null }) => {
    const exists = itemsRef.current.some((item) => item.id === product.id)
    if (exists) {
      setItems((prev) => prev.filter((item) => item.id !== product.id))
      apiRemoveWishlistItem(product.id)
    } else {
      setItems((prev) => {
        if (prev.some((item) => item.id === product.id)) return prev
        return [...prev, {
          id: product.id,
          handle: product.handle,
          title: product.title,
          thumbnail: product.thumbnail,
          addedAt: new Date().toISOString(),
        }]
      })
      apiAddWishlistItem(product.id)
    }
  }, [])

  const clearWishlist = useCallback(() => {
    const current = itemsRef.current
    setItems([])
    current.forEach((item) => apiRemoveWishlistItem(item.id))
  }, [])

  return (
    <WishlistContext.Provider
      value={{ items, isInWishlist, addToWishlist, removeFromWishlist, toggleWishlist, clearWishlist, itemCount: items.length }}
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
