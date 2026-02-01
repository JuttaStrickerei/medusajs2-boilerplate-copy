"use client"

import { useState, useTransition } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { HttpTypes } from "@medusajs/types"
import { getProductPrice } from "@lib/util/get-product-price"
import { addToCart } from "@lib/data/cart"
import { cn, isProductNew } from "@lib/utils"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Badge, Button } from "@components/ui"
import { Heart, ShoppingBag, Check } from "@components/icons"
import { triggerCartRefresh } from "@lib/context/cart-context"
import { useWishlist } from "@lib/context/wishlist-context"
import PreviewPrice from "./price"

interface ProductPreviewProps {
  product: HttpTypes.StoreProduct
  isFeatured?: boolean
  region: HttpTypes.StoreRegion
  className?: string
}

export default function ProductPreview({
  product,
  isFeatured,
  region,
  className,
}: ProductPreviewProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [isAdded, setIsAdded] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  
  // Wishlist hook - consume items directly for reliable reactivity
  const { items: wishlistItems, toggleWishlist } = useWishlist()
  const isWishlisted = wishlistItems.some(item => item.id === product.id)

  const { cheapestPrice } = getProductPrice({ product })
  const isNew = product.created_at ? isProductNew(product.created_at) : false
  
  // Check if product has a sale price
  const hasSale = cheapestPrice?.price_type === "sale"
  
  // Get secondary image for hover effect
  const primaryImage = product.thumbnail
  const secondaryImage = product.images?.[1]?.url

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
        
        // Reset after 2 seconds
        setTimeout(() => setIsAdded(false), 2000)
      } catch (error) {
        console.error("Error adding to cart:", error)
      }
    })
  }

  return (
    <div
      className={cn(
        "group relative bg-white rounded-xl overflow-hidden",
        "border border-stone-200/60",
        "shadow-sm hover:shadow-lg hover:border-stone-200",
        "transition-all duration-300 ease-out",
        "hover:-translate-y-1",
        "flex flex-col h-full", // Ensure full height and flex
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <LocalizedClientLink
        href={`/products/${product.handle}`}
        className="block relative aspect-[4/5] overflow-hidden bg-stone-50"
      >
        {/* Primary Image */}
        {primaryImage && (
          <Image
            src={primaryImage}
            alt={product.title || "Product image"}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={cn(
              "object-cover transition-all duration-500",
              isHovered && secondaryImage ? "opacity-0 scale-105" : "opacity-100 scale-100",
              !imageLoaded && "opacity-0"
            )}
            onLoad={() => setImageLoaded(true)}
            priority={isFeatured}
          />
        )}
        
        {/* Secondary Image (Hover) */}
        {secondaryImage && (
          <Image
            src={secondaryImage}
            alt={`${product.title} - alternate view`}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={cn(
              "object-cover absolute inset-0 transition-all duration-500",
              isHovered ? "opacity-100 scale-100" : "opacity-0 scale-105"
            )}
          />
        )}

        {/* Loading Skeleton */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-stone-200 animate-pulse" />
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
          {isNew && (
            <Badge variant="new" className="animate-fade-in">
              Neu
            </Badge>
          )}
          {hasSale && (
            <Badge variant="sale" className="animate-fade-in">
              Sale
            </Badge>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={handleWishlistToggle}
          className={cn(
            "absolute top-3 right-3 z-10",
            "w-9 h-9 rounded-full flex items-center justify-center",
            "bg-white/90 backdrop-blur-sm shadow-sm",
            "transition-all duration-200",
            "hover:bg-white hover:scale-110",
            isWishlisted && "text-red-500"
          )}
          aria-label={isWishlisted ? "Von Wunschliste entfernen" : "Zur Wunschliste hinzufügen"}
        >
          <Heart size={18} filled={isWishlisted} />
        </button>

        {/* Quick Actions Overlay */}
        <div
          className={cn(
            "absolute inset-x-3 bottom-3 z-10",
            "flex gap-2",
            "transition-all duration-300",
            isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
          )}
        >
          <Button
            size="sm"
            className={cn(
              "flex-1 shadow-lg transition-all",
              isAdded 
                ? "bg-green-600 text-white hover:bg-green-600" 
                : "bg-white/95 backdrop-blur-sm text-stone-800 hover:bg-white"
            )}
            onClick={handleQuickAdd}
            disabled={isPending}
          >
            {isPending ? (
              <span className="w-4 h-4 border-2 border-stone-400 border-t-transparent rounded-full animate-spin mr-1.5" />
            ) : isAdded ? (
              <Check size={16} className="mr-1.5" />
            ) : (
              <ShoppingBag size={16} className="mr-1.5" />
            )}
            {isAdded ? "Hinzugefügt" : canQuickAdd ? "Hinzufügen" : "Auswählen"}
          </Button>
        </div>
      </LocalizedClientLink>

      {/* Product Info */}
      <div className="p-4 flex flex-col flex-1">
        {/* Collection Tag - Fixed height */}
        <div className="h-4 flex items-center">
          {product.collection ? (
            <LocalizedClientLink
              href={`/collections/${product.collection.handle}`}
              className="text-[11px] text-stone-400 uppercase tracking-wider hover:text-stone-600 transition-colors truncate"
            >
              {product.collection.title}
            </LocalizedClientLink>
          ) : (
            <span className="text-[11px] text-stone-300 uppercase tracking-wider">Produkt</span>
          )}
        </div>

        {/* Title - Min height for consistency, allows overflow */}
        <LocalizedClientLink href={`/products/${product.handle}`} className="mt-1.5 block">
          <h3 className="font-medium text-stone-800 leading-snug group-hover:text-stone-600 transition-colors min-h-[2.5rem]">
            {product.title}
          </h3>
        </LocalizedClientLink>

        {/* Color Options - Fixed height */}
        <div className="mt-2 h-5 flex items-center">
          {getColorOptions(product).length > 0 ? (
            <div className="flex items-center gap-1.5">
              {getColorOptions(product).slice(0, 5).map((color, index) => (
                <span
                  key={index}
                  className="w-4 h-4 rounded-full border border-stone-200 shadow-sm"
                  style={{ backgroundColor: color.hex || "#e5e5e5" }}
                  title={color.value}
                />
              ))}
              {getColorOptions(product).length > 5 && (
                <span className="text-[10px] text-stone-400 font-medium">
                  +{getColorOptions(product).length - 5}
                </span>
              )}
            </div>
          ) : null}
        </div>

        {/* Spacer to push price to bottom */}
        <div className="flex-1 min-h-3" />

        {/* Price Section - Always at bottom */}
        <div className="pt-3 border-t border-stone-100 mt-auto">
          {cheapestPrice && <PreviewPrice price={cheapestPrice} />}
        </div>
      </div>
    </div>
  )
}

// Helper function to extract color options
function getColorOptions(product: HttpTypes.StoreProduct) {
  const colorOption = product.options?.find(
    (o) => o.title?.toLowerCase() === "color" || o.title?.toLowerCase() === "farbe"
  )
  
  if (!colorOption?.values) return []
  
  // Get unique colors
  const seen = new Set<string>()
  return colorOption.values.filter((v) => {
    if (seen.has(v.value)) return false
    seen.add(v.value)
    return true
  }).map((v) => ({
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
    gelb: "#eab308",
    rosa: "#f472b6",
    // English color names
    black: "#1a1a1a",
    white: "#ffffff",
    grey: "#6b7280",
    gray: "#6b7280",
    brown: "#8b6f47",
    blue: "#2563eb",
    red: "#dc2626",
    green: "#16a34a",
    yellow: "#eab308",
    pink: "#f472b6",
    // Material names
    kaschmir: "#e8dcc8",
    cashmere: "#e8dcc8",
    merino: "#f5f5dc",
    alpaka: "#d2b48c",
    alpaca: "#d2b48c",
  }
  
  return colorMap[colorName.toLowerCase()]
}
