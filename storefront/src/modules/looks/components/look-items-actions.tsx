"use client"

import { addLookToCart } from "@lib/data/looks"
import { triggerCartRefresh } from "@lib/context/cart-context"
import { gaCurrency, productToItem, trackEvent } from "@lib/util/analytics"
import { getPricesForVariant } from "@lib/util/get-product-price"
import { cn, formatPrice } from "@lib/utils"
import { HttpTypes } from "@medusajs/types"
import { Button } from "@components/ui"
import { Check, ShoppingBag } from "@components/icons"
import { useParams } from "next/navigation"
import { useCallback, useState } from "react"
import LookItemCard, { LookItemSelection } from "./look-item-card"

type LookItemsActionsProps = {
  lookId: string
  lookTitle: string
  products: HttpTypes.StoreProduct[]
}

export default function LookItemsActions({
  lookId,
  lookTitle,
  products,
}: LookItemsActionsProps) {
  const countryCode = useParams().countryCode as string
  const [selections, setSelections] = useState<
    Record<string, LookItemSelection>
  >({})
  const [isAdding, setIsAdding] = useState(false)
  const [added, setAdded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSelectionChange = useCallback(
    (productId: string, selection: LookItemSelection) => {
      setSelections((prev) => {
        const current = prev[productId]
        if (
          current?.variant?.id === selection.variant?.id &&
          current?.purchasable === selection.purchasable
        ) {
          return prev
        }
        return { ...prev, [productId]: selection }
      })
    },
    []
  )

  // Nur kaufbare Teile zählen; ausverkaufte werden übersprungen
  const purchasable = products.filter(
    (p) => selections[p.id]?.purchasable ?? true
  )
  const soldOut = products.filter(
    (p) => selections[p.id] && !selections[p.id].purchasable
  )
  const openCount = purchasable.filter((p) => !selections[p.id]?.variant).length
  const ready = purchasable.length > 0 && openCount === 0

  const total = (() => {
    let sum = 0
    let currency: string | undefined
    for (const p of purchasable) {
      const variant = selections[p.id]?.variant
      const price = variant ? getPricesForVariant(variant) : null
      if (price) {
        sum += price.calculated_price_number
        currency = price.currency_code
      }
    }
    return currency ? { sum, currency } : null
  })()

  const handleAddLook = async () => {
    if (!ready) return

    const chosen = purchasable
      .map((p) => ({ product: p, variant: selections[p.id].variant! }))
      .filter((c) => !!c.variant)

    setIsAdding(true)
    setError(null)

    try {
      await addLookToCart({
        lookId,
        items: chosen.map((c) => ({ variantId: c.variant.id, quantity: 1 })),
        countryCode,
      })

      triggerCartRefresh()

      const items = chosen.map((c) => ({
        ...productToItem(c.product, c.variant, 1),
        item_list_name: `Look: ${lookTitle}`,
      }))
      trackEvent("add_to_cart", {
        currency: gaCurrency(chosen[0]?.variant.calculated_price?.currency_code),
        value: items.reduce((acc, i) => acc + (i.price ?? 0), 0),
        items,
      })

      setAdded(true)
      setTimeout(() => setAdded(false), 2500)
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Der Look konnte nicht hinzugefügt werden"
      )
    } finally {
      setIsAdding(false)
    }
  }

  const buttonText = () => {
    if (added) return "Look hinzugefügt!"
    if (!purchasable.length) return "Look derzeit ausverkauft"
    if (!ready) {
      return openCount === 1
        ? "Bitte noch 1 Teil auswählen"
        : `Bitte noch ${openCount} Teile auswählen`
    }
    return total
      ? `Ganzen Look in den Warenkorb – ${formatPrice(total.sum, total.currency)}`
      : "Ganzen Look in den Warenkorb"
  }

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-4">
        {products.map((product) => (
          <li key={product.id}>
            <LookItemCard
              product={product}
              disabled={isAdding}
              onSelectionChange={handleSelectionChange}
            />
          </li>
        ))}
      </ul>

      <div className="sticky bottom-0 z-10 -mx-4 border-t border-stone-200 bg-white/95 px-4 py-4 backdrop-blur small:static small:mx-0 small:rounded-xl small:border small:px-5">
        {soldOut.length > 0 && purchasable.length > 0 && (
          <p className="mb-3 text-sm text-stone-600">
            {soldOut.map((p) => p.title).join(", ")}{" "}
            {soldOut.length === 1 ? "ist" : "sind"} derzeit ausverkauft und{" "}
            {soldOut.length === 1 ? "wird" : "werden"} nicht hinzugefügt.
          </p>
        )}
        <Button
          onClick={handleAddLook}
          disabled={!ready || isAdding}
          loading={isAdding}
          fullWidth
          size="lg"
          className={cn(added && "bg-green-600 hover:bg-green-600")}
          leftIcon={added ? <Check size={20} /> : <ShoppingBag size={20} />}
          data-testid="add-look-button"
        >
          {buttonText()}
        </Button>
        <p className="mt-2 text-center text-xs text-stone-500">
          inkl. MwSt., zzgl.{" "}
          <a href={`/${countryCode}/shipping`} className="underline hover:text-stone-700">
            Versandkosten
          </a>
        </p>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  )
}
