"use client"

import { addToCart } from "@lib/data/cart"
import { triggerCartRefresh } from "@lib/context/cart-context"
import { gaCurrency, productToItem, trackEvent } from "@lib/util/analytics"
import { getProductPrice } from "@lib/util/get-product-price"
import { cn, formatPrice } from "@lib/utils"
import { HttpTypes } from "@medusajs/types"
import { Button } from "@components/ui"
import { Check, Heart, ShoppingBag } from "@components/icons"
import { useWishlist } from "@lib/context/wishlist-context"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import OptionSelect from "@modules/products/components/product-actions/option-select"
import {
  translateOptionTitle,
  useVariantSelection,
} from "@modules/products/hooks/use-variant-selection"
import Image from "next/image"
import { useParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { getProductDetails } from "@modules/products/components/product-tabs"
import ImageLightbox from "./image-lightbox"

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

// Optionsnamen, unter denen die Farbe gepflegt wird
const COLOR_OPTION_TITLES = ["farbe", "farben", "color", "colour"]

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

  const [lightboxOpen, setLightboxOpen] = useState(false)

  // Wie auf der Produktseite: einzelnes Teil merken
  const { items: wishlistItems, toggleWishlist } = useWishlist()
  const isWishlisted = wishlistItems.some((item) => item.id === product.id)

  const colorOptionId = product.options?.find((o) =>
    COLOR_OPTION_TITLES.includes((o.title ?? "").trim().toLowerCase())
  )?.id
  const selectedColor = colorOptionId ? options[colorOptionId] : undefined

  // Bilder für die Vorschau. Bei gewählter Farbe die Bilder einer Variante
  // dieser Farbe: Medusa liefert dort die ihr zugeordneten Bilder plus alle
  // Bilder ohne Zuordnung (bzw. alle, solange nichts zugeordnet ist).
  // Reihenfolge wie bei den Produktbildern.
  const galleryImages = useMemo(() => {
    const urls = [
      ...(product.images ?? []).map((img) => img.url),
      ...(product.variants ?? []).flatMap((v) => [
        v.thumbnail,
        ...(v.images ?? []).map((img) => img.url),
      ]),
      product.thumbnail,
    ].filter((url): url is string => !!url)
    const allImages = Array.from(new Set(urls))

    if (!colorOptionId || !selectedColor) return allImages

    const colorVariant = product.variants?.find(
      (v) =>
        v.options?.find((o) => o.option_id === colorOptionId)?.value ===
        selectedColor
    )
    const colorUrls = new Set((colorVariant?.images ?? []).map((img) => img.url))
    if (!colorUrls.size) return allImages

    return allImages.filter((url) => colorUrls.has(url))
  }, [product, colorOptionId, selectedColor])

  const details = getProductDetails(product)

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
      className="flex flex-col gap-3 rounded-xl border border-stone-200/70 bg-white p-3 small:p-4"
      data-testid="look-item"
    >
      <div className="flex gap-4 small:gap-5">
        {/* Klick aufs Bild öffnet die Bildvorschau, der Name führt zum Produkt */}
        <button
          type="button"
          onClick={() => galleryImages.length && setLightboxOpen(true)}
          disabled={!galleryImages.length}
          className="relative block w-24 small:w-32 flex-shrink-0 self-start overflow-hidden rounded-lg bg-stone-100 aspect-[3/4] enabled:cursor-zoom-in"
          aria-label={`Bilder von ${product.title} ansehen`}
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
          {galleryImages.length > 1 && (
            <span className="absolute bottom-1 right-1 rounded bg-white/85 px-1.5 py-0.5 text-[10px] text-stone-700">
              {galleryImages.length} Bilder
            </span>
          )}
        </button>

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

          <div className="flex flex-wrap items-center gap-2">
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
              className={cn(addedToCart && "border-green-600 text-green-700")}
              leftIcon={
                addedToCart ? <Check size={16} /> : <ShoppingBag size={16} />
              }
            >
              {getButtonText()}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                toggleWishlist({
                  id: product.id,
                  handle: product.handle || "",
                  title: product.title || "",
                  thumbnail: product.thumbnail || null,
                })
              }
              leftIcon={
                <Heart
                  size={16}
                  filled={isWishlisted}
                  className={isWishlisted ? "text-red-500" : ""}
                />
              }
              className={cn(isWishlisted && "border-red-200 bg-red-50")}
              aria-pressed={isWishlisted}
            >
              {isWishlisted ? "Gemerkt" : "Merken"}
            </Button>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      </div>

      {details.length > 0 && (
        <details className="group border-t border-stone-100 pt-3">
          <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-semibold uppercase tracking-wide text-stone-700">
            Produktdetails
            <span className="text-stone-400 transition-transform group-open:rotate-45">
              +
            </span>
          </summary>
          <div className="mt-2 divide-y divide-stone-100">
            {details.map((detail) => (
              <div
                key={detail.label}
                className="flex items-center justify-between py-2 text-sm"
              >
                <span className="text-stone-500">{detail.label}</span>
                <span className="font-medium text-stone-800">{detail.value}</span>
              </div>
            ))}
          </div>
        </details>
      )}

      {lightboxOpen && (
        <ImageLightbox
          images={galleryImages}
          title={product.title}
          initialIndex={Math.max(0, galleryImages.indexOf(previewImage ?? ""))}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </article>
  )
}
