"use client"

import { useEffect, useMemo, useRef, useState, useTransition } from "react"
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
import { yarnDotBackground } from "@lib/util/yarn-colors"
import { productPath } from "@lib/util/product-colors"
import { cartPathAfterAdd } from "@lib/util/added-to-cart"
import PreviewPrice from "./price"
import { cardSlides, type CardSlide } from "./card-slides"
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
  /**
   * Fotos zum Wischen, von der Server-Komponente ausgerechnet (cardSlides).
   * Ohne Angabe rechnet die Karte sie aus dem Produkt selbst aus.
   */
  slides?: CardSlide[]
}

/** Feste Breite des Hover-Fotos; es erscheint erst ab 1280px (Karte ≤ 300px) */
const HOVER_IMAGE_WIDTH = 300
const HOVER_IMAGE_HEIGHT = 450
const MAX_COLOR_DOTS = 5

// Unter 1280px ein kleiner Schieber: natürliches Scrollen mit Einrasten, ein
// Foto je Wisch (snap-always). Senkrechtes Wischen scrollt weiter die Seite.
// Ab 1280px steht er still und zeigt das erste Foto wie bisher.
const CARD_SLIDER =
  "no-scrollbar absolute inset-0 flex snap-x snap-mandatory overflow-x-auto overflow-y-hidden overscroll-x-contain medium:overflow-x-hidden"
/** Eigene getönte Fläche je Foto, damit das Multiplizieren auch im Schieber stimmt */
const CARD_SLIDE =
  "relative isolate h-full w-full shrink-0 snap-start snap-always bg-stone-100"

export default function ProductPreview({
  product,
  isFeatured,
  region,
  className,
  slides: slidesProp,
}: ProductPreviewProps) {
  const [isAdded, setIsAdded] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const slides = useMemo(
    () => slidesProp ?? cardSlides(product),
    [slidesProp, product]
  )
  const sliderRef = useRef<HTMLSpanElement>(null)
  const slidesKey = slides.map((slide) => slide.url).join("|")
  // Stand des Schiebers, gemerkt mit den Fotos, zu denen er gehört. Kommen
  // andere Fotos (z. B. nach einem Farbfilter), gilt er nicht mehr: die Karte
  // beginnt wieder vorn, und der Schieber (gleicher Schlüssel) entsteht neu.
  // loaded: nur das erste Foto lädt sofort, die weiteren kommen erst ins
  // Dokument, wenn gewischt wird, und dann immer eines voraus.
  const [sliderState, setSliderState] = useState({
    key: slidesKey,
    active: 0,
    loaded: 1,
  })
  const { active: activeSlide, loaded: loadedSlides } =
    sliderState.key === slidesKey ? sliderState : { active: 0, loaded: 1 }

  const syncSlide = () => {
    const slider = sliderRef.current
    if (!slider || slider.clientWidth === 0) return
    const position = slider.scrollLeft / slider.clientWidth
    // begrenzt, weil iOS am Rand über das Ende hinaus federt
    const active = Math.min(Math.max(Math.round(position), 0), slides.length - 1)
    setSliderState((state) => {
      const loaded = Math.max(
        state.key === slidesKey ? state.loaded : 1,
        position > 0 ? active + 2 : 1
      )
      return state.key === slidesKey &&
        state.active === active &&
        state.loaded === loaded
        ? state
        : { key: slidesKey, active, loaded }
    })
  }

  // Falls schon gewischt wurde, bevor die Seite fertig geladen war
  useEffect(() => {
    syncSlide()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Wishlist hook - consume items directly for reliable reactivity
  const { items: wishlistItems, toggleWishlist } = useWishlist()
  const isWishlisted = wishlistItems.some((item) => item.id === product.id)

  const { cheapestPrice } = getProductPrice({ product })
  const isNew = product.created_at ? isProductNew(product.created_at) : false

  // Check if product has a sale price
  const hasSale = cheapestPrice?.price_type === "sale"

  // Foto beim Überfahren: wie bisher das zweite der Galerie; zeigt das erste
  // Foto eine bestimmte Farbe, dann das zweite Foto dieser Farbe
  const firstSlide = slides[0]
  const secondaryImage = firstSlide?.color
    ? firstSlide.hover
    : product.images?.[1]?.url

  const colors = getColorOptions(product)
  // Punkte nur für Farben mit bekanntem Farbwert; unbekannte zählen ins „+N“
  const colorDots = colors.filter((c) => c.background).slice(0, MAX_COLOR_DOTS)
  const moreColorCount = colors.length - colorDots.length
  const colorLabel = `Farben: ${colors.map((c) => c.value).join(", ")}`
  // Die sichtbaren Abzeichen liegen im aria-hidden Bild-Link
  const badgeLabel = [isNew && "Neu", hasSale && "Sale"]
    .filter(Boolean)
    .join(", ")
  // Bei mehreren Farben führt die Karte zur Farbe des sichtbaren Fotos
  const shownSlide = slides[Math.min(activeSlide, slides.length - 1)]
  const href = productPath(product.handle ?? "", shownSlide?.color)

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
      router.push(href)
      return
    }

    // If multiple variants, go to product page to select
    if (product.variants && product.variants.length > 1) {
      router.push(href)
      return
    }

    const countryCode = region.countries?.[0]?.iso_2 || "at"

    startTransition(async () => {
      try {
        await addToCart({
          variantId: firstVariant.id,
          quantity: 1,
          countryCode,
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

        // Wie überall im Shop: nach dem Hinzufügen direkt in den Warenkorb
        router.push(
          `/${countryCode}${cartPathAfterAdd([firstVariant.id], href)}`
        )
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
          {firstSlide ? (
            <span
              key={slidesKey}
              ref={sliderRef}
              onScroll={syncSlide}
              className={CARD_SLIDER}
            >
              {slides.map((slide, index) => (
                <span key={slide.url} className={CARD_SLIDE}>
                  {index === 0 ? (
                    <Image
                      src={slide.url}
                      alt={product.title || "Produktbild"}
                      fill
                      sizes={CARD_SIZES}
                      priority={isFeatured}
                      className="object-contain mix-blend-multiply"
                    />
                  ) : (
                    index < loadedSlides && (
                      <Image
                        src={slide.url}
                        alt=""
                        fill
                        sizes={CARD_SIZES}
                        loading="eager"
                        className="object-contain mix-blend-multiply"
                      />
                    )
                  )}
                </span>
              ))}
            </span>
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
                className="h-full w-full object-contain mix-blend-multiply"
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

          {/* Anzeige, welches Foto zu sehen ist; nur wo gewischt wird */}
          {slides.length > 1 && (
            <span className="pointer-events-none absolute inset-x-0 bottom-2 z-10 flex justify-center medium:hidden">
              <span className="flex items-center gap-1.5 rounded-full bg-white/90 px-1.5 py-1 ring-1 ring-black/5">
                {slides.map((slide, index) => (
                  <span
                    key={slide.url}
                    className={cn(
                      "h-1.5 w-1.5 rounded-full transition-colors",
                      index === activeSlide ? "bg-stone-800" : "bg-stone-400"
                    )}
                  />
                ))}
              </span>
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
                className="h-2.5 w-2.5 rounded-full ring-1 ring-black/15"
                style={{ background: color.background }}
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
      background: yarnDotBackground(v.value),
    }))
}
