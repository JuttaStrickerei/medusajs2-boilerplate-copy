"use client"

import { addToCart } from "@lib/data/cart"
import { useIntersection } from "@lib/hooks/use-in-view"
import { HttpTypes } from "@medusajs/types"
import { cn } from "@lib/utils"
import { Button } from "@components/ui"
import OptionSelect from "@modules/products/components/product-actions/option-select"
import { isEqual } from "lodash"
import { useParams } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import ProductPrice from "../product-price"
import MobileActions from "./mobile-actions"
import { ShoppingBag, Heart, Share, Check, Minus, Plus } from "@components/icons"
import { triggerCartRefresh } from "@lib/context/cart-context"
import { useWishlist } from "@lib/context/wishlist-context"

type ProductActionsProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  disabled?: boolean
}

const optionsAsKeymap = (
  variantOptions: HttpTypes.StoreProductVariant["options"]
) => {
  return variantOptions?.reduce((acc: Record<string, string>, varopt: any) => {
    acc[varopt.option_id] = varopt.value
    return acc
  }, {})
}

export default function ProductActions({
  product,
  disabled,
}: ProductActionsProps) {
  const [options, setOptions] = useState<Record<string, string | undefined>>({})
  const [isAdding, setIsAdding] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [addedToCart, setAddedToCart] = useState(false)
  const countryCode = useParams().countryCode as string
  
  // Wishlist hook
  const { isInWishlist, toggleWishlist } = useWishlist()
  const isWishlisted = isInWishlist(product.id)

  // If there is only 1 variant, preselect the options
  useEffect(() => {
    if (product.variants?.length === 1) {
      const variantOptions = optionsAsKeymap(product.variants[0].options)
      setOptions(variantOptions ?? {})
    }
  }, [product.variants])

  const selectedVariant = useMemo(() => {
    if (!product.variants || product.variants.length === 0) {
      return
    }

    return product.variants.find((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options])

  // update the options when a variant is selected
  const setOptionValue = (optionId: string, value: string) => {
    setOptions((prev) => ({
      ...prev,
      [optionId]: value,
    }))
  }

  //check if the selected options produce a valid variant
  const isValidVariant = useMemo(() => {
    return product.variants?.some((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options])

  // check if the selected variant is in stock
  const inStock = useMemo(() => {
    // If we don't manage inventory, we can always add to cart
    if (selectedVariant && !selectedVariant.manage_inventory) {
      return true
    }

    // If we allow back orders on the variant, we can add to cart
    if (selectedVariant?.allow_backorder) {
      return true
    }

    // If there is inventory available, we can add to cart
    if (
      selectedVariant?.manage_inventory &&
      (selectedVariant?.inventory_quantity || 0) > 0
    ) {
      return true
    }

    // Otherwise, we can't add to cart
    return false
  }, [selectedVariant])

  const actionsRef = useRef<HTMLDivElement>(null)
  const inView = useIntersection(actionsRef, "0px")

  // add the selected variant to the cart
  const handleAddToCart = async () => {
    if (!selectedVariant?.id) return null

    setIsAdding(true)

    await addToCart({
      variantId: selectedVariant.id,
      quantity: quantity,
      countryCode,
    })

    // Trigger instant cart update
    triggerCartRefresh()

    setIsAdding(false)
    setAddedToCart(true)
    
    // Reset the "added" state after 2 seconds
    setTimeout(() => setAddedToCart(false), 2000)
  }

  // Handle wishlist toggle
  const handleWishlistToggle = () => {
    toggleWishlist({
      id: product.id,
      handle: product.handle || "",
      title: product.title || "",
      thumbnail: product.thumbnail || null,
    })
  }

  const handleQuantityChange = (delta: number) => {
    setQuantity((prev) => Math.max(1, Math.min(10, prev + delta)))
  }

  const getButtonText = () => {
    if (addedToCart) return "Hinzugefügt!"
    if (!selectedVariant && Object.keys(options).length === 0) return "Variante wählen"
    if (!inStock || !isValidVariant) return "Nicht verfügbar"
    return "In den Warenkorb"
  }

  return (
    <>
      <div className="flex flex-col gap-y-6" ref={actionsRef}>
        {/* Price */}
        <div className="pb-4 border-b border-stone-200">
          <ProductPrice product={product} variant={selectedVariant} />
        </div>

        {/* Options */}
        {(product.variants?.length ?? 0) > 1 && (
          <div className="space-y-6">
            {(product.options || []).map((option) => (
              <div key={option.id}>
                <OptionSelect
                  option={option}
                  current={options[option.id]}
                  updateOption={setOptionValue}
                  title={option.title ?? ""}
                  data-testid="product-options"
                  disabled={!!disabled || isAdding}
                />
              </div>
            ))}
          </div>
        )}

        {/* Quantity Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-stone-700">Anzahl</label>
          <div className="flex items-center gap-4">
            <div className="flex items-center border border-stone-300 rounded-lg overflow-hidden">
              <button
                onClick={() => handleQuantityChange(-1)}
                disabled={quantity <= 1}
                className={cn(
                  "w-10 h-10 flex items-center justify-center",
                  "text-stone-600 hover:bg-stone-100 transition-colors",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
                aria-label="Menge verringern"
              >
                <Minus size={16} />
              </button>
              <span className="w-12 h-10 flex items-center justify-center text-stone-800 font-medium border-x border-stone-300">
                {quantity}
              </span>
              <button
                onClick={() => handleQuantityChange(1)}
                disabled={quantity >= 10}
                className={cn(
                  "w-10 h-10 flex items-center justify-center",
                  "text-stone-600 hover:bg-stone-100 transition-colors",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
                aria-label="Menge erhöhen"
              >
                <Plus size={16} />
              </button>
            </div>

            {/* Stock Status */}
            {selectedVariant && (
              <span className={cn(
                "text-sm flex items-center gap-1.5",
                inStock ? "text-green-600" : "text-red-600"
              )}>
                {inStock ? (
                  <>
                    <Check size={16} />
                    Auf Lager
                  </>
                ) : (
                  "Nicht verfügbar"
                )}
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Add to Cart Button */}
          <Button
            onClick={handleAddToCart}
            disabled={
              !inStock ||
              !selectedVariant ||
              !!disabled ||
              isAdding ||
              !isValidVariant
            }
            loading={isAdding}
            fullWidth
            size="lg"
            className={cn(
              addedToCart && "bg-green-600 hover:bg-green-600"
            )}
            leftIcon={addedToCart ? <Check size={20} /> : <ShoppingBag size={20} />}
            data-testid="add-product-button"
          >
            {getButtonText()}
          </Button>

          {/* Secondary Actions */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="secondary"
              onClick={handleWishlistToggle}
              leftIcon={<Heart size={18} filled={isWishlisted} className={isWishlisted ? "text-red-500" : ""} />}
              className={cn(isWishlisted && "border-red-200 bg-red-50")}
            >
              {isWishlisted ? "Gemerkt" : "Merken"}
            </Button>
            <Button
              variant="secondary"
              leftIcon={<Share size={18} />}
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: product.title,
                    url: window.location.href,
                  })
                } else {
                  navigator.clipboard.writeText(window.location.href)
                }
              }}
            >
              Teilen
            </Button>
          </div>
        </div>

        {/* Mobile Actions */}
        <MobileActions
          product={product}
          variant={selectedVariant}
          options={options}
          updateOptions={setOptionValue}
          inStock={inStock}
          handleAddToCart={handleAddToCart}
          isAdding={isAdding}
          show={!inView}
          optionsDisabled={!!disabled || isAdding}
        />
      </div>
    </>
  )
}
