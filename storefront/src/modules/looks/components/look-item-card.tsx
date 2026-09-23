"use client"

import { addToCart } from "@lib/data/cart"
import { triggerCartRefresh } from "@lib/context/cart-context"
import { gaCurrency, productToItem, trackEvent } from "@lib/util/analytics"
import { getProductPrice } from "@lib/util/get-product-price"
import { cn, formatPrice } from "@lib/utils"
import { HttpTypes } from "@medusajs/types"
import { Button } from "@components/ui"
import { Check, ShoppingBag } from "@components/icons"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import OptionSelect from "@modules/products/components/product-actions/option-select"
import {
  translateOptionTitle,
  useVariantSelection,
} from "@modules/products/hooks/use-variant-selection"
import Image from "next/image"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"

export type LookItemSelection = {
  // gewählte, lieferbare Variante (sonst undefined)
  variant?: HttpTypes.StoreProductVariant
  // ist irgendeine Variante des Produkts kaufbar?
  purchasable: boolean
  // ready = lieferbare Variante gewählt, incomplete = Option fehlt noch,
  // unavailable = gewählte Kombination gibt es nicht / ausverkauft
  status: "ready" | "incomplete" | "unavailable"
  // Bezeichnung der nächsten fehlenden Option (z. B. „Größe“)
  missingLabel?: string
}

type LookItemCardProps = {
  product: HttpTypes.StoreProduct
  disabled?: boolean
  onSelectionChange: (productId: string, selection: LookItemSelection) => void
}

export default function LookItemCard({
  product,
  disabled,
  onSelectionChange,
}: LookItemCardProps) {
  const countryCode = useParams().countryCode as string
  const [isAdding, setIsAdding] = useState(false)
  const [addedToCart, setAddedToCart] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    orderedOptions,
    selectionStatus,
    options,
    setOptionValue,
    selectedVariant,
    isValidVariant,
    inStock,
    missingOptions,
    availability,
    isPurchasable,
    previewImage,
  } = useVariantSelection(product)

  const missingLabel = missingOptions[0]
    ? translateOptionTitle(missingOptions[0].title ?? "Option")
    : undefined

  useEffect(() => {
    onSelectionChange(product.id, {
      variant: selectionStatus === "ready" ? selectedVariant : undefined,
      purchasable: isPurchasable,
      status: selectionStatus,
      missingLabel,
    })
  }, [
    product.id,
    selectedVariant,
    selectionStatus,
    isPurchasable,
    missingLabel,
    onSelectionChange,
  ])

  const { cheapestPrice, variantPrice } = getProductPrice({
    product,
    variantId: selectedVariant?.id,
  })
  const price = selectedVariant ? variantPrice : cheapestPrice
  const hasPriceRange =
    !selectedVariant &&
    new Set(
      (product.variants ?? []).map(
        (v: any) =>
          v.calculated_price?.calculated_amount_with_tax ??
          v.calculated_price?.calculated_amount
      )
    ).size > 1
  const isOnSale = price?.price_type === "sale"

  const handleAddToCart = async () => {
    if (!selectedVariant?.id) return

    setIsAdding(true)
    setError(null)

    try {
      await addToCart({
        variantId: selectedVariant.id,
        quantity: 1,
        countryCode,
      })

      triggerCartRefresh()

      const item = productToItem(product, selectedVariant, 1)
      trackEvent("add_to_cart", {
        currency: gaCurrency(selectedVariant.calculated_price?.currency_code),
        value: item.price ?? 0,
        items: [item],
      })

      setAddedToCart(true)
      setTimeout(() => setAddedToCart(false), 2000)
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Artikel konnte nicht hinzugefügt werden"
      )
    } finally {
      setIsAdding(false)
    }
  }

  const getButtonText = () => {
    if (addedToCart) return "Hinzugefügt!"
    if (!isPurchasable) return "Ausverkauft"
    if (selectionStatus === "incomplete") return `Bitte ${missingLabel} wählen`
    if (!isValidVariant) return "Kombination nicht verfügbar"
    if (!inStock) return "Variante ausverkauft"
    return "In den Warenkorb"
  }

  return (
    <article
      className="flex gap-4 small:gap-5 rounded-xl border border-stone-200/70 bg-white p-3 small:p-4"
      data-testid="look-item"
    >
      <LocalizedClientLink
        href={`/products/${product.handle}`}
        className="relative block w-24 small:w-32 flex-shrink-0 self-start overflow-hidden rounded-lg bg-stone-100 aspect-[3/4]"
      >
        {previewImage ? (
          <Image
            src={previewImage}
            alt={product.title}
            fill
            sizes="(max-width: 640px) 96px, 128px"
            className="object-cover"
          />
        ) : null}
      </LocalizedClientLink>

      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div>
          <LocalizedClientLink
            href={`/products/${product.handle}`}
            className="text-sm small:text-base font-medium text-stone-800 hover:underline"
          >
            {product.title}
          </LocalizedClientLink>
          {price && (
            <p className="mt-1 flex items-baseline gap-2 text-sm">
              <span
                className={cn(
                  "font-medium",
                  isOnSale ? "text-red-600" : "text-stone-800"
                )}
              >
                {hasPriceRange ? "ab " : ""}
                {formatPrice(price.calculated_price_number, price.currency_code)}
              </span>
              {isOnSale && (
                <span className="text-stone-400 line-through">
                  {formatPrice(price.original_price_number, price.currency_code)}
                </span>
              )}
            </p>
          )}
          {!isPurchasable && (
            <p className="mt-1 text-sm text-red-600">
              Derzeit ausverkauft
            </p>
          )}
        </div>

        {(product.variants?.length ?? 0) > 1 &&
          orderedOptions.map((option) => (
            <OptionSelect
              key={option.id}
              option={option}
              current={options[option.id]}
              updateOption={setOptionValue}
              title={translateOptionTitle(option.title ?? "")}
              availability={availability[option.id]}
              disabled={!!disabled || isAdding}
            />
          ))}

        <Button
          variant="secondary"
          size="sm"
          onClick={handleAddToCart}
          disabled={
            !inStock ||
            !selectedVariant ||
            !isValidVariant ||
            !!disabled ||
            isAdding
          }
          loading={isAdding}
          className={cn(
            "self-start",
            addedToCart && "border-green-600 text-green-700"
          )}
          leftIcon={
            addedToCart ? <Check size={16} /> : <ShoppingBag size={16} />
          }
        >
          {getButtonText()}
        </Button>

        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </article>
  )
}
