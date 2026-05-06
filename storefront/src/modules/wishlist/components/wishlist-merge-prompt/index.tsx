"use client"

import { useCallback, useEffect, useState } from "react"
import {
  WISHLIST_STORAGE_KEY,
  useWishlist,
  type WishlistItem,
} from "@lib/context/wishlist-context"
import {
  dismissWishlistMergePending,
  mergeServerWishlistItems,
  readWishlistMergePending,
} from "@lib/data/wishlist"
import { Button } from "@components/ui"
import { Heart, Close } from "@components/icons"

type Stage =
  | { kind: "idle" }
  | { kind: "ready"; items: WishlistItem[] }
  | { kind: "submitting" }
  | { kind: "error" }

export default function WishlistMergePrompt() {
  const { refreshWishlist, clearLocalWishlist, isAuthenticated } = useWishlist()
  const [stage, setStage] = useState<Stage>({ kind: "idle" })

  const readLocalItems = useCallback((): WishlistItem[] => {
    if (typeof window === "undefined") return []
    try {
      const raw = localStorage.getItem(WISHLIST_STORAGE_KEY)
      if (!raw) return []
      const parsed = JSON.parse(raw) as WishlistItem[]
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }, [])

  const performMerge = useCallback(
    async (items: WishlistItem[]) => {
      setStage({ kind: "submitting" })
      const payload = items.map((it) => ({ product_id: it.id }))
      const result = await mergeServerWishlistItems(payload)

      if (result === null) {
        setStage({ kind: "error" })
        return
      }

      clearLocalWishlist()
      await dismissWishlistMergePending()
      await refreshWishlist()
      setStage({ kind: "idle" })
    },
    [clearLocalWishlist, refreshWishlist]
  )

  // Re-fire on auth change. The cookie-clearing inside `decide()` is the
  // idempotency source: a second fire finds no pending flag and early-returns.
  useEffect(() => {
    let cancelled = false

    async function decide() {
      const mode = await readWishlistMergePending()
      if (cancelled || mode === null) return

      const localItems = readLocalItems()

      if (localItems.length === 0) {
        // Auth flag set but no guest items to merge — still refresh so the
        // provider picks up server state even if the layout revalidation
        // hasn't propagated yet.
        await dismissWishlistMergePending()
        await refreshWishlist()
        return
      }

      if (mode === "auto") {
        await performMerge(localItems)
        return
      }

      // mode === "prompt" — show the banner
      if (!cancelled) setStage({ kind: "ready", items: localItems })
    }

    decide()
    return () => {
      cancelled = true
    }
  }, [isAuthenticated, performMerge, readLocalItems, refreshWishlist])

  const handleAccept = useCallback(async () => {
    if (stage.kind !== "ready") return
    await performMerge(stage.items)
  }, [performMerge, stage])

  const handleDiscard = useCallback(async () => {
    clearLocalWishlist()
    await dismissWishlistMergePending()
    setStage({ kind: "idle" })
  }, [clearLocalWishlist])

  const handleDismiss = useCallback(async () => {
    await dismissWishlistMergePending()
    setStage({ kind: "idle" })
  }, [])

  if (
    stage.kind !== "ready" &&
    stage.kind !== "submitting" &&
    stage.kind !== "error"
  ) {
    return null
  }

  const itemCount = stage.kind === "ready" ? stage.items.length : 0

  return (
    <div
      className="fixed bottom-4 right-4 z-50 max-w-sm bg-white rounded-2xl border border-stone-200 shadow-lg p-5"
      role="dialog"
      aria-live="polite"
      aria-labelledby="wishlist-merge-heading"
    >
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
        aria-label="Schließen"
        type="button"
      >
        <Close size={16} />
      </button>

      <div className="flex items-start gap-3 pr-6">
        <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center flex-shrink-0">
          <Heart size={18} className="text-stone-600" filled />
        </div>
        <div>
          <h2
            id="wishlist-merge-heading"
            className="font-serif text-base font-medium text-stone-800 mb-1"
          >
            {stage.kind === "ready"
              ? `${itemCount} ${
                  itemCount === 1 ? "Artikel" : "Artikel"
                } aus Ihrer Sitzung gefunden`
              : stage.kind === "submitting"
              ? "Wird hinzugefügt …"
              : "Fehler beim Hinzufügen"}
          </h2>
          <p className="text-sm text-stone-600">
            {stage.kind === "ready"
              ? "Sollen wir sie zu Ihrer Wunschliste hinzufügen?"
              : stage.kind === "submitting"
              ? "Bitte einen Moment Geduld."
              : "Bitte versuchen Sie es erneut."}
          </p>
        </div>
      </div>

      {stage.kind === "ready" && (
        <div className="mt-4 flex gap-2">
          <Button onClick={handleAccept} className="flex-1">
            Hinzufügen
          </Button>
          <Button variant="secondary" onClick={handleDiscard}>
            Verwerfen
          </Button>
        </div>
      )}

      {stage.kind === "error" && (
        <div className="mt-4 flex gap-2">
          <Button
            onClick={async () => {
              const localItems = readLocalItems()
              if (localItems.length === 0) {
                await dismissWishlistMergePending()
                setStage({ kind: "idle" })
                return
              }
              await performMerge(localItems)
            }}
            className="flex-1"
          >
            Erneut versuchen
          </Button>
          <Button variant="secondary" onClick={handleDismiss}>
            Später
          </Button>
        </div>
      )}
    </div>
  )
}
