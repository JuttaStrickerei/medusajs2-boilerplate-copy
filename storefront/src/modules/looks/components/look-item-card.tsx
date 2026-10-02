"use client"

import { addToCart } from "@lib/data/cart"
import { triggerCartRefresh } from "@lib/context/cart-context"
import { gaCurrency, productToItem, trackEvent } from "@lib/util/analytics"
import { getProductPrice } from "@lib/util/get-product-price"
import { hasPriceRange as productHasPriceRange } from "@lib/util/look-price"
import { cn, formatPrice } from "@lib/utils"
import { HttpTypes } from "@medusajs/types"
import { Check, ChevronDown, Heart, ShoppingBag } from "@components/icons"
import { useWishlist } from "@lib/context/wishlist-context"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Spinner from "@modules/common/icons/spinner"
import { isSizeOption } from "@modules/products/components/product-actions/option-select"
import {
  LOW_STOCK_THRESHOLD,
  translateOptionTitle,
  useVariantSelection,
} from "@modules/products/hooks/use-variant-selection"
import Image from "next/image"
import { useParams } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import { getProductDetails } from "@modules/products/components/product-tabs"
import ImageLightbox from "./image-lightbox"
import LookOptionChips, { sortSizes } from "./look-option-chips"

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
  // gewählte Größe (für „Ihre Größe für alle Teile“)
  selectedSize?: string
}

// „Ihre Größe für alle Teile“: seq zählt hoch, damit dieselbe Größe erneut
// angewendet werden kann
export type LookBulkSize = { value: string; seq: number }

// Optionsnamen, unter denen die Farbe gepflegt wird
const COLOR_OPTION_TITLES = ["farbe", "farben", "color", "colour"]

const uniqueValues = (option: HttpTypes.StoreProductOption) =>
  Array.from(new Set((option.values ?? []).map((v) => v.value)))

type LookItemCardProps = {
  product: HttpTypes.StoreProduct
  disabled?: boolean
  onSelectionChange: (productId: string, selection: LookItemSelection) => void
  bulkSize?: LookBulkSize | null
  // nach erfolglosem Klick auf „Ganzen Look …“: fehlende Auswahl markieren
  attention?: boolean
  // „Einzeln in den Warenkorb“ (nur bei Looks mit mehreren Teilen)
  showSingleAdd?: boolean
}

export default function LookItemCard({
  product,
  disabled,
  onSelectionChange,
  bulkSize,
  attention,
  showSingleAdd,
}: LookItemCardProps) {
  const countryCode = useParams().countryCode as string
  const rowRef = useRef<HTMLElement>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [addedToCart, setAddedToCart] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ownAttention, setOwnAttention] = useState(false)
  const [sizeNote, setSizeNote] = useState<string | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  const {
    orderedOptions,
    selectionStatus,
    options,
    setOptionValue,
    selectedVariant,
    missingOptions,
    availability,
    isPurchasable,
    previewImage,
  } = useVariantSelection(product)

  const [lightboxOpen, setLightboxOpen] = useState(false)

  // Wie auf der Produktseite: einzelnes Teil merken
  const { items: wishlistItems, toggleWishlist } = useWishlist()
  const isWishlisted = wishlistItems.some((item) => item.id === product.id)

  const colorOption = product.options?.find((o) =>
    COLOR_OPTION_TITLES.includes((o.title ?? "").trim().toLowerCase())
  )
  const colorOptionId = colorOption?.id
  const selectedColor = colorOptionId ? options[colorOptionId] : undefined
  const sizeOption = orderedOptions.find(
    (o) => o.id !== colorOptionId && isSizeOption(o.title ?? "")
  )
  const sizeValues = useMemo(
    () => (sizeOption ? sortSizes(uniqueValues(sizeOption)) : []),
    [sizeOption]
  )
  const selectedSize = sizeOption ? options[sizeOption.id] : undefined
  const hasChoice = (product.variants?.length ?? 0) > 1
  const colorValues = colorOption ? uniqueValues(colorOption) : []
  const otherOptions = orderedOptions.filter(
    (o) => o.id !== colorOptionId && o.id !== sizeOption?.id
  )

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
    const colorUrls = new Set(
      (colorVariant?.images ?? []).map((img) => img.url)
    )
    if (!colorUrls.size) return allImages

    return allImages.filter((url) => colorUrls.has(url))
  }, [product, colorOptionId, selectedColor])

  const details = getProductDetails(product)
  const material = details.find((d) => d.label === "Material")?.value

  // Optionen mit nur einem Wert wählt der Hook selbst vor – sie zählen nicht
  // als „fehlend“, sonst blitzt kurz „Farbe“ statt „Größe“ auf
  const nextMissing =
    missingOptions.find((o) => uniqueValues(o).length > 1) ?? missingOptions[0]
  const missingLabel = nextMissing
    ? translateOptionTitle(nextMissing.title ?? "Option")
    : undefined

  useEffect(() => {
    onSelectionChange(product.id, {
      variant: selectionStatus === "ready" ? selectedVariant : undefined,
      purchasable: isPurchasable,
      status: selectionStatus,
      missingLabel,
      selectedSize,
    })
  }, [
    product.id,
    selectedVariant,
    selectionStatus,
    isPurchasable,
    missingLabel,
    selectedSize,
    onSelectionChange,
  ])

  // „Ihre Größe für alle Teile“ übernehmen (nur bei neuer seq)
  const appliedSeq = useRef(0)
  useEffect(() => {
    if (!bulkSize || bulkSize.seq === appliedSeq.current) return
    appliedSeq.current = bulkSize.seq
    if (!sizeOption || sizeValues.length < 2 || !isPurchasable) return

    const status = availability[sizeOption.id]?.[bulkSize.value]?.status
    if (status === "available" || status === "low") {
      setOptionValue(sizeOption.id, bulkSize.value)
      setSizeNote(null)
    } else {
      setSizeNote(
        `Größe ${bulkSize.value} gibt es bei diesem Teil nicht – bitte wählen`
      )
    }
    // nur auf neue Auswahl reagieren, nicht auf jede Änderung der Verfügbarkeit
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bulkSize?.seq])

  const { cheapestPrice, variantPrice } = getProductPrice({
    product,
    variantId: selectedVariant?.id,
  })
  const price = selectedVariant ? variantPrice : cheapestPrice
  const hasPriceRange = !selectedVariant && productHasPriceRange(product)
  const isOnSale = price?.price_type === "sale"

  const isReady = selectionStatus === "ready"
  const showAttention =
    (!!attention || ownAttention) && !isReady && isPurchasable

  const focusMissing = () => {
    const row = rowRef.current
    const input =
      row?.querySelector<HTMLInputElement>(
        "fieldset[data-missing] input:not(:disabled)"
      ) ?? row?.querySelector<HTMLInputElement>("fieldset input:not(:disabled)")
    input?.focus()
  }

  const handleAddToCart = async () => {
    // aria-disabled statt disabled: der Fokus bleibt so auf dem Button
    if (disabled || isAdding) return
    if (!isReady || !selectedVariant?.id) {
      setOwnAttention(true)
      focusMissing()
      return
    }

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
    } catch {
      // Feste deutsche Meldung: Server-Actions liefern in Produktion nur
      // eine generische englische Fehlermeldung
      setError(
        "Das Teil konnte nicht in den Warenkorb gelegt werden. Bitte versuchen Sie es erneut."
      )
    } finally {
      setIsAdding(false)
    }
  }

  const handleOptionChange = (optionId: string, value: string) => {
    setOptionValue(optionId, value)
    if (optionId === sizeOption?.id) setSizeNote(null)
    setError(null)
  }

  // Zeile 2: einzelne Farbe/Größe als Text, dazu das Material
  const singleColor = colorValues.length === 1 ? colorValues[0] : undefined
  const singleSize =
    sizeOption && sizeValues.length === 1 ? sizeValues[0] : undefined
  const subline = [singleColor, singleSize, material]
    .filter(Boolean)
    .join(" · ")

  const lowStockQty =
    selectedVariant?.manage_inventory &&
    !selectedVariant.allow_backorder &&
    (selectedVariant.inventory_quantity ?? 0) > 0 &&
    (selectedVariant.inventory_quantity ?? 0) <= LOW_STOCK_THRESHOLD
      ? selectedVariant.inventory_quantity
      : undefined

  let status: { text: string; tone: "red" | "amber"; alert?: boolean } | null =
    null
  if (error) {
    status = { text: error, tone: "red", alert: true }
  } else if (sizeNote && !isReady) {
    status = { text: sizeNote, tone: "amber" }
  } else if (showAttention && selectionStatus === "unavailable") {
    status = {
      text: "Diese Kombination ist nicht verfügbar – bitte andere Auswahl treffen",
      tone: "red",
    }
  } else if (showAttention) {
    status = { text: `Bitte ${missingLabel ?? "Variante"} wählen`, tone: "red" }
  } else if (lowStockQty) {
    status = {
      text: selectedSize
        ? `Nur noch ${lowStockQty} in ${selectedSize}`
        : `Nur noch ${lowStockQty} verfügbar`,
      tone: "amber",
    }
  }

  const detailsId = `look-piece-details-${product.id}`
  const rowDisabled = !!disabled || isAdding

  return (
    <article
      ref={rowRef}
      id={`look-piece-${product.id}`}
      className="grid grid-cols-[4rem_minmax(0,1fr)] gap-x-3 py-4 small:grid-cols-[4.5rem_minmax(0,1fr)] small:gap-x-4"
      data-testid="look-item"
    >
      {/* Klick aufs Bild öffnet die Bildvorschau, der Name führt zum Produkt */}
      <button
        type="button"
        onClick={() => galleryImages.length && setLightboxOpen(true)}
        disabled={!galleryImages.length}
        className={cn(
          "relative col-start-1 row-span-2 row-start-1 block aspect-[3/4] w-full self-start overflow-hidden rounded-md bg-stone-100 enabled:cursor-zoom-in small:row-span-6",
          !isPurchasable && "opacity-60"
        )}
        aria-label={`Bilder von ${product.title} ansehen (${galleryImages.length})`}
      >
        {previewImage ? (
          <Image
            src={previewImage}
            alt={product.title}
            fill
            sizes="72px"
            className="object-cover"
          />
        ) : null}
      </button>

      <div className="col-start-2 row-start-1 min-w-0">
        <div className="flex items-start gap-2">
          <LocalizedClientLink
            href={`/products/${product.handle}`}
            className="line-clamp-2 text-[15px] font-medium text-stone-900 underline-offset-4 hover:underline"
          >
            {product.title}
          </LocalizedClientLink>
          {price && (
            <p className="ml-auto shrink-0 text-right text-[15px] tabular-nums">
              <span className={isOnSale ? "text-red-700" : "text-stone-900"}>
                {hasPriceRange ? "ab " : ""}
                {formatPrice(
                  price.calculated_price_number,
                  price.currency_code
                )}
              </span>
              {isOnSale && (
                <span className="block text-xs text-stone-400 line-through">
                  {formatPrice(
                    price.original_price_number,
                    price.currency_code
                  )}
                </span>
              )}
            </p>
          )}
          <button
            type="button"
            onClick={() =>
              toggleWishlist({
                id: product.id,
                handle: product.handle || "",
                title: product.title || "",
                thumbnail: product.thumbnail || null,
              })
            }
            className={cn(
              "-my-2.5 -mr-2.5 grid h-11 w-11 shrink-0 place-items-center rounded-full text-stone-500 transition-colors hover:text-stone-900",
              !price && "ml-auto"
            )}
            aria-pressed={isWishlisted}
            aria-label={
              isWishlisted
                ? `${product.title} von der Merkliste entfernen`
                : `${product.title} merken`
            }
          >
            <Heart
              size={18}
              filled={isWishlisted}
              className={isWishlisted ? "text-red-500" : ""}
            />
          </button>
        </div>

        {!isPurchasable ? (
          <p className="mt-0.5 text-xs text-red-700">Derzeit ausverkauft</p>
        ) : (
          subline && <p className="mt-0.5 text-xs text-stone-500">{subline}</p>
        )}

        {hasChoice && colorOption && colorValues.length > 1 && (
          <LookOptionChips
            className="mt-2"
            name={`${product.id}-${colorOption.id}`}
            legend="Farbe"
            kind="color"
            values={colorValues}
            current={options[colorOption.id]}
            availability={availability[colorOption.id]}
            onChange={(v) => handleOptionChange(colorOption.id, v)}
            disabled={rowDisabled || !isPurchasable}
            missing={nextMissing?.id === colorOption.id}
            attention={showAttention && nextMissing?.id === colorOption.id}
          />
        )}
      </div>

      <div className="col-start-2 row-start-2 mt-2 flex items-center justify-between gap-3 text-xs text-stone-600 small:order-last small:row-start-auto">
        <button
          type="button"
          onClick={() => setDetailsOpen((o) => !o)}
          aria-expanded={detailsOpen}
          aria-controls={detailsId}
          className="-my-3.5 inline-flex items-center gap-1 py-3.5 hover:text-stone-900"
        >
          Details
          <ChevronDown
            size={14}
            aria-hidden
            className={cn(
              "transition-transform duration-200",
              detailsOpen && "rotate-180"
            )}
          />
        </button>
        {showSingleAdd && isPurchasable && (
          <button
            type="button"
            onClick={handleAddToCart}
            aria-disabled={rowDisabled || undefined}
            aria-busy={isAdding || undefined}
            className={cn(
              "-my-3.5 inline-flex items-center gap-1.5 py-3.5 hover:text-stone-900 aria-disabled:cursor-not-allowed aria-disabled:opacity-60",
              addedToCart && "text-green-700 hover:text-green-700"
            )}
          >
            {isAdding ? (
              <Spinner size={14} />
            ) : addedToCart ? (
              <Check size={14} aria-hidden />
            ) : (
              <ShoppingBag size={14} aria-hidden />
            )}
            {addedToCart ? "Im Warenkorb" : "Einzeln in den Warenkorb"}
          </button>
        )}
      </div>

      {hasChoice && sizeOption && sizeValues.length > 1 && (
        <LookOptionChips
          className="col-span-2 mt-3 small:col-span-1 small:col-start-2"
          name={`${product.id}-${sizeOption.id}`}
          legend={`${translateOptionTitle(sizeOption.title ?? "Größe")} – ${
            product.title
          }`}
          legendVisible={false}
          kind="size"
          narrow
          values={sizeValues}
          current={selectedSize}
          availability={availability[sizeOption.id]}
          onChange={(v) => handleOptionChange(sizeOption.id, v)}
          disabled={rowDisabled || !isPurchasable}
          missing={nextMissing?.id === sizeOption.id}
          attention={
            (showAttention || (!!sizeNote && !isReady)) &&
            nextMissing?.id === sizeOption.id
          }
        />
      )}

      {hasChoice &&
        otherOptions
          .filter((o) => uniqueValues(o).length > 1)
          .map((option) => (
            <LookOptionChips
              key={option.id}
              className="col-span-2 mt-3 small:col-span-1 small:col-start-2"
              name={`${product.id}-${option.id}`}
              legend={translateOptionTitle(option.title ?? "")}
              kind="other"
              values={uniqueValues(option)}
              current={options[option.id]}
              availability={availability[option.id]}
              onChange={(v) => handleOptionChange(option.id, v)}
              disabled={rowDisabled || !isPurchasable}
              missing={nextMissing?.id === option.id}
              attention={showAttention && nextMissing?.id === option.id}
            />
          ))}

      <div
        aria-live="polite"
        className={cn(
          "col-span-2 text-xs small:col-span-1 small:col-start-2",
          status && "mt-1.5",
          status?.tone === "red" ? "text-red-700" : "text-amber-800"
        )}
      >
        {status &&
          (status.alert ? (
            <p role="alert">{status.text}</p>
          ) : (
            <p>{status.text}</p>
          ))}
      </div>

      {detailsOpen && (
        <div
          id={detailsId}
          className="col-span-2 pt-3 small:order-last small:col-span-1 small:col-start-2"
        >
          {details.length > 0 && (
            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 text-xs">
              {details.map((detail) => (
                <div key={detail.label} className="contents">
                  <dt className="text-stone-500">{detail.label}</dt>
                  <dd className="text-stone-800">{detail.value}</dd>
                </div>
              ))}
            </dl>
          )}
          <LocalizedClientLink
            href={`/products/${product.handle}`}
            className="mt-2 inline-block text-xs text-stone-700 underline underline-offset-4 hover:text-stone-900"
          >
            Zum Produkt →
          </LocalizedClientLink>
        </div>
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
