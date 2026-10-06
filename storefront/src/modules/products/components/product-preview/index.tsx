"use client"

import { useState, useTransition } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { HttpTypes } from "@medusajs/types"
import { getProductPrice } from "@lib/util/get-product-price"
import { addToCart } from "@lib/data/cart"
import { gaCurrency, productToItem, trackEvent } from "@lib/util/analytics"
import { cn, isProductNew } from "@lib/utils"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import PlaceholderImage from "@modules/common/icons/placeholder-image"
import { Badge, Button } from "@components/ui"
import { Heart, ShoppingBag, Check } from "@components/icons"
import { triggerCartRefresh } from "@lib/context/cart-context"
import { useWishlist } from "@lib/context/wishlist-context"
import PreviewPrice from "./price"
import {
  CARD_BODY,
  CARD_MAT,
  CARD_MEDIA,
  CARD_NAME,
  CARD_NAME_UNDERLINE,
  CARD_SIZES,
} from "./card-styles"

interface ProductPreviewProps {
  product: HttpTypes.StoreProduct
  isFeatured?: boolean
  region: HttpTypes.StoreRegion
  className?: string
}

/** Feste Breite des Hover-Fotos; es erscheint erst ab 1280px (Karte ≤ 300px) */
const HOVER_IMAGE_WIDTH = 300
const HOVER_IMAGE_HEIGHT = 450
const MAX_COLOR_DOTS = 5

export default function ProductPreview({
  product,
  isFeatured,
  region,
  className,
}: ProductPreviewProps) {
  const [isAdded, setIsAdded] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  // Wishlist hook - consume items directly for reliable reactivity
  const { items: wishlistItems, toggleWishlist } = useWishlist()
  const isWishlisted = wishlistItems.some((item) => item.id === product.id)

  const { cheapestPrice } = getProductPrice({ product })
  const isNew = product.created_at ? isProductNew(product.created_at) : false

  // Check if product has a sale price
  const hasSale = cheapestPrice?.price_type === "sale"

  // Get secondary image for hover effect
  const primaryImage = product.thumbnail || product.images?.[0]?.url
  const secondaryImage = product.images?.[1]?.url

  const colors = getColorOptions(product)
  // Punkte nur für Farben mit bekanntem Farbwert; unbekannte zählen ins „+N“
  const colorDots = colors.filter((c) => c.hex).slice(0, MAX_COLOR_DOTS)
  const moreColorCount = colors.length - colorDots.length
  const colorLabel = `Farben: ${colors.map((c) => c.value).join(", ")}`
  // Die sichtbaren Abzeichen liegen im aria-hidden Bild-Link
  const badgeLabel = [isNew && "Neu", hasSale && "Sale"]
    .filter(Boolean)
    .join(", ")
  const href = `/products/${product.handle}`

  // Get the first available variant for quick add
  const firstVariant = product.variants?.[0]
  const canQuickAdd = !!firstVariant && product.variants?.length === 1

  // Handle wishlist toggle
  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    toggleWishlist({
      id: product.id,
      handle: product.handle || "",
      title: product.title || "",
      thumbnail: product.thumbnail || null,
    })
  }

  // Handle quick add to cart
  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!firstVariant) {
      // Navigate to product page if no variant or multiple variants
      router.push(`/products/${product.handle}`)
      return
    }

    // If multiple variants, go to product page to select
    if (product.variants && product.variants.length > 1) {
      router.push(`/products/${product.handle}`)
      return
    }

    startTransition(async () => {
      try {
        await addToCart({
          variantId: firstVariant.id,
          quantity: 1,
          countryCode: region.countries?.[0]?.iso_2 || "at",
        })

        // Show success state
        setIsAdded(true)

        // Trigger cart update immediately
        triggerCartRefresh()

        const item = productToItem(product, firstVariant, 1)
        trackEvent("add_to_cart", {
          currency: gaCurrency(region.currency_code),
          value: item.price ?? 0,
          items: [item],
        })

        // Reset after 2 seconds
        setTimeout(() => setIsAdded(false), 2000)
      } catch (error) {
        console.error("Error adding to cart:", error)
      }
    })
  }

  return (
    <div className={cn(CARD_MAT, className)}>
      <div className="relative">
        {/* Bildfläche: zweiter Weg zur Produktseite, für Tastatur und
            Screenreader genügt der Link unter dem Bild */}
        <LocalizedClientLink
          href={href}
          tabIndex={-1}
          aria-hidden
          className={CARD_MEDIA}
        >
          {primaryImage ? (
            <Image
              src={primaryImage}
              alt={product.title || "Produktbild"}
              fill
              sizes={CARD_SIZES}
              priority={isFeatured}
              className="object-cover mix-blend-multiply"
            />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center text-stone-300">
              <PlaceholderImage size={24} aria-hidden />
            </span>
          )}

          {/* Zweites Foto beim Überfahren; unter 1280px display:none, daher
              lädt ein Handy es nie. Die deckende Fläche verhindert, dass sich
              die beiden multiplizierten Fotos überlagern. */}
          {secondaryImage && (
            <span className="absolute inset-0 isolate hidden bg-stone-100 opacity-0 transition-opacity duration-500 ease-out medium:block [@media(hover:hover)]:group-hover:opacity-100">
              <Image
                src={secondaryImage}
                alt=""
                width={HOVER_IMAGE_WIDTH}
                height={HOVER_IMAGE_HEIGHT}
                loading="lazy"
                className="h-full w-full object-cover mix-blend-multiply"
              />
            </span>
          )}

          {(isNew || hasSale) && (
            <span className="absolute left-2 top-2 z-10 flex flex-col items-start gap-1">
              {isNew && (
                <Badge
                  variant="secondary"
                  className="bg-white/95 text-[11px] leading-4 text-stone-800 ring-1 ring-black/5"
                >
                  Neu
                </Badge>
              )}
              {hasSale && (
                <Badge variant="sale" className="text-[11px] leading-4">
                  Sale
                </Badge>
              )}
            </span>
          )}
        </LocalizedClientLink>

        {/* Wunschliste: eigener Knopf neben dem Link, nicht darin. Sichtbar
            36px, die Tippfläche (::before) reicht auf 44px */}
        <button
          type="button"
          onClick={handleWishlistToggle}
          aria-pressed={isWishlisted}
          aria-label={
            isWishlisted
              ? "Von Wunschliste entfernen"
              : "Zur Wunschliste hinzufügen"
          }
          className={cn(
            "absolute right-1.5 top-1.5 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 before:absolute before:-inset-1 before:rounded-full before:content-[''] text-stone-700 shadow-sm ring-1 ring-black/5 transition-colors hover:bg-white hover:text-stone-900",
            isWishlisted && "text-red-500 hover:text-red-600"
          )}
        >
          <Heart size={18} filled={isWishlisted} />
        </button>

        {/* Schnell in den Warenkorb: nur mit Maus (Überfahren) oder Tastatur;
            auf Touch-Geräten nicht vorhanden, damit ein Tippen aufs Bild nie
            unbemerkt etwas in den Warenkorb legt */}
        <div className="absolute inset-x-1.5 bottom-1.5 z-10 hidden translate-y-1 opacity-0 transition duration-200 group-focus-within:translate-y-0 group-focus-within:opacity-100 [@media(hover:hover)]:block [@media(hover:hover)]:group-hover:translate-y-0 [@media(hover:hover)]:group-hover:opacity-100">
          <Button
            size="sm"
            onClick={handleQuickAdd}
            disabled={isPending}
            className={cn(
              "h-9 w-full rounded-full text-[13px] shadow-sm ring-1 ring-black/5",
              isAdded
                ? "bg-green-600 text-white hover:bg-green-600"
                : "bg-white/95 text-stone-800 hover:bg-white"
            )}
          >
            {isPending ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-stone-400 border-t-transparent" />
            ) : isAdded ? (
              <Check size={16} />
            ) : (
              <ShoppingBag size={16} />
            )}
            {isAdded ? "Hinzugefügt" : canQuickAdd ? "Hinzufügen" : "Auswählen"}
          </Button>
        </div>
      </div>

      {/* Der eine zugängliche Link der Karte */}
      <LocalizedClientLink href={href} className={CARD_BODY}>
        <h3 className={CARD_NAME}>
          <span className={CARD_NAME_UNDERLINE}>{product.title}</span>
        </h3>
        {badgeLabel && <span className="sr-only">{badgeLabel}</span>}
        {colorDots.length > 0 ? (
          <span
            role="img"
            aria-label={colorLabel}
            className="mt-1.5 flex items-center gap-1"
          >
            {colorDots.map((color) => (
              <span
                key={color.value}
                title={color.value}
                className="h-2.5 w-2.5 rounded-full ring-1 ring-black/10"
                style={{ backgroundColor: color.hex }}
              />
            ))}
            {moreColorCount > 0 && (
              <span className="text-[11px] leading-none text-stone-500">
                +{moreColorCount}
              </span>
            )}
          </span>
        ) : (
          colors.length > 0 && <span className="sr-only">{colorLabel}</span>
        )}
        <div className="mt-auto pt-1.5">
          {cheapestPrice && <PreviewPrice price={cheapestPrice} />}
        </div>
      </LocalizedClientLink>
    </div>
  )
}

// Helper function to extract color options
function getColorOptions(product: HttpTypes.StoreProduct) {
  const colorOption = product.options?.find(
    (o) =>
      o.title?.toLowerCase() === "color" || o.title?.toLowerCase() === "farbe"
  )

  if (!colorOption?.values) return []

  // Get unique colors
  const seen = new Set<string>()
  return colorOption.values
    .filter((v) => {
      if (seen.has(v.value)) return false
      seen.add(v.value)
      return true
    })
    .map((v) => ({
      value: v.value,
      hex: getColorHex(v.value),
    }))
}

// Map color names to hex values
function getColorHex(colorName: string): string | undefined {
  const colorMap: Record<string, string> = {
    // German color names
    schwarz: "#1a1a1a",
    weiß: "#ffffff",
    weiss: "#ffffff",
    grau: "#6b7280",
    beige: "#d4c4a8",
    braun: "#8b6f47",
    blau: "#2563eb",
    navy: "#1e3a5f",
    rot: "#dc2626",
    bordeaux: "#722f37",
    grün: "#16a34a",
    oliv: "#6b8e23",
    salbei: "#9caf88",
    gelb: "#eab308",
    rosa: "#f472b6",
    lila: "#a855f7",
    // English color names
    black: "#1a1a1a",
    white: "#ffffff",
    grey: "#6b7280",
    gray: "#6b7280",
    brown: "#8b6f47",
    blue: "#2563eb",
    red: "#dc2626",
    green: "#16a34a",
    olive: "#6b8e23",
    sage: "#9caf88",
    yellow: "#eab308",
    pink: "#f472b6",
    purple: "#a855f7",
    lilac: "#c084fc",
    // Material names
    kaschmir: "#e8dcc8",
    cashmere: "#e8dcc8",
    merino: "#f5f5dc",
    alpaka: "#d2b48c",
    alpaca: "#d2b48c",
  }

  return colorMap[colorName.toLowerCase()]
}
