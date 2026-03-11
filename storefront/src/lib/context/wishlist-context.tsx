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
const WISHLIST_PENDING_KEY = "medusa_wishlist_pending"

type WishlistItem = {
  id: string
  handle: string
  title: string
  thumbnail: string | null
  addedAt: string
}

type PendingOp = {
  type: "add" | "remove"
  productId: string
  timestamp: number
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
  } catch {}
}

function clearLocalWishlist() {
  if (typeof window === "undefined") return
  try {
    localStorage.removeItem(WISHLIST_STORAGE_KEY)
    localStorage.removeItem(WISHLIST_PENDING_KEY)
  } catch {}
}

function savePendingOp(op: PendingOp) {
  if (typeof window === "undefined") return
  try {
    const stored = localStorage.getItem(WISHLIST_PENDING_KEY)
    const ops: PendingOp[] = stored ? JSON.parse(stored) : []
    ops.push(op)
    localStorage.setItem(WISHLIST_PENDING_KEY, JSON.stringify(ops))
  } catch {}
}

function clearPendingOp(productId: string, type: "add" | "remove") {
  if (typeof window === "undefined") return
  try {
    const stored = localStorage.getItem(WISHLIST_PENDING_KEY)
    if (!stored) return
    const ops: PendingOp[] = JSON.parse(stored)
    const filtered = ops.filter(
      (op) => !(op.productId === productId && op.type === type)
    )
    localStorage.setItem(WISHLIST_PENDING_KEY, JSON.stringify(filtered))
  } catch {}
}

function getPendingOps(): PendingOp[] {
  if (typeof window === "undefined") return []
  try {
    const stored = localStorage.getItem(WISHLIST_PENDING_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
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

/**
 * Executes a server action outside React's render cycle.
 * Uses queueMicrotask to decouple from batching/concurrent mode.
 */
function serverSync(fn: () => Promise<boolean>, productId: string, type: "add" | "remove") {
  savePendingOp({ type, productId, timestamp: Date.now() })

  queueMicrotask(async () => {
    try {
      const success = await fn()
      if (success) {
        clearPendingOp(productId, type)
      }
    } catch (e) {
      console.error(`[Wishlist] Server sync failed (${type} ${productId}):`, e)
    }
  })
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

    for (const localItem of localItems) {
      if (!serverProductIds.has(localItem.id)) {
        serverSync(
          () => addServerWishlistItem(localItem.id),
          localItem.id,
          "add"
        )
        serverConverted.push(localItem)
      } else {
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

    // Replay any pending ops that didn't complete
    const pendingOps = getPendingOps()
    for (const op of pendingOps) {
      if (op.type === "add" && !serverProductIds.has(op.productId)) {
        serverSync(
          () => addServerWishlistItem(op.productId),
          op.productId,
          "add"
        )
      }
    }

    clearLocalWishlist()
    isLoggedInRef.current = true
    setItems(serverConverted)
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

  // Listen for auth events
  useEffect(() => {
    const unsubLogin = onAuthLogin(async () => {
      await loadServerWishlistAndMerge()
    })

    const unsubLogout = onAuthLogout(() => {
      isLoggedInRef.current = false
      setItems([])
      clearLocalWishlist()
    })

    return () => {
      unsubLogin()
      unsubLogout()
    }
  }, [loadServerWishlistAndMerge])

  // Re-check auth state on navigation
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
        clearLocalWishlist()
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

    serverSync(
      () => addServerWishlistItem(product.id),
      product.id,
      "add"
    )
  }, [])

  const removeFromWishlist = useCallback((productId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== productId))

    serverSync(
      () => removeServerWishlistItem(productId),
      productId,
      "remove"
    )
  }, [])

  const toggleWishlist = useCallback((product: { id: string; handle: string; title: string; thumbnail: string | null }) => {
    const exists = itemsRef.current.some((item) => item.id === product.id)

    if (exists) {
      setItems((prev) => prev.filter((item) => item.id !== product.id))
      serverSync(
        () => removeServerWishlistItem(product.id),
        product.id,
        "remove"
      )
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
      serverSync(
        () => addServerWishlistItem(product.id),
        product.id,
        "add"
      )
    }
  }, [])

  const clearWishlist = useCallback(() => {
    const current = itemsRef.current
    setItems([])
    current.forEach((item) => {
      serverSync(
        () => removeServerWishlistItem(item.id),
        item.id,
        "remove"
      )
    })
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
