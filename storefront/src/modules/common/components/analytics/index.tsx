"use client"

import { useEffect } from "react"
import { GaItem, trackEvent } from "@lib/util/analytics"

/**
 * Tiny client components that fire GA4 e-commerce page events once on mount.
 * They render nothing; the server component that knows the data renders them.
 */

function firedOnce(key: string): boolean {
  // Session-scoped dedupe (reloads, back/forward, React strict-mode double mount).
  try {
    if (window.sessionStorage.getItem(key)) return true
    window.sessionStorage.setItem(key, "1")
  } catch {
    // storage unavailable: fall through and fire
  }
  return false
}

export function ViewItem({ item, currency }: { item: GaItem; currency: string }) {
  useEffect(() => {
    trackEvent("view_item", {
      currency,
      value: item.price ?? 0,
      items: [item],
    })
  }, [item.item_id]) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}

export function ViewItemList({
  items,
  listId,
  listName,
}: {
  items: GaItem[]
  listId: string
  listName: string
}) {
  const key = items.map((i) => i.item_id).join(",")
  useEffect(() => {
    if (!items.length) return
    trackEvent("view_item_list", {
      item_list_id: listId,
      item_list_name: listName,
      items,
    })
  }, [listId, key]) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}

export function BeginCheckout({
  cartId,
  currency,
  value,
  items,
}: {
  cartId: string
  currency: string
  value: number
  items: GaItem[]
}) {
  useEffect(() => {
    if (firedOnce(`ga_begin_checkout_${cartId}`)) return
    trackEvent("begin_checkout", { currency, value, items })
  }, [cartId]) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}

export function Purchase({
  transactionId,
  currency,
  value,
  tax,
  shipping,
  items,
}: {
  transactionId: string
  currency: string
  value: number
  tax: number
  shipping: number
  items: GaItem[]
}) {
  useEffect(() => {
    if (firedOnce(`ga_purchase_${transactionId}`)) return
    trackEvent("purchase", {
      transaction_id: transactionId,
      currency,
      value,
      tax,
      shipping,
      items,
    })
  }, [transactionId]) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}
