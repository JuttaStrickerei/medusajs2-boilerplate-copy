"use client"

import { clx } from "@medusajs/ui"
import { updateLineItem } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"
import ErrorMessage from "@modules/checkout/components/error-message"
import DeleteButton from "@modules/common/components/delete-button"
import LineItemOptions from "@modules/common/components/line-item-options"
import LineItemPrice from "@modules/common/components/line-item-price"
import LineItemUnitPrice from "@modules/common/components/line-item-unit-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Spinner from "@modules/common/icons/spinner"
import Thumbnail from "@modules/products/components/thumbnail"
import { Minus, Plus } from "@components/icons"
import { triggerCartRefresh } from "@lib/context/cart-context"
import { useState } from "react"

type ItemProps = {
  item: HttpTypes.StoreCartLineItem
  type?: "full" | "preview"
  currencyCode: string
}

const Item = ({ item, type = "full", currencyCode }: ItemProps) => {
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const changeQuantity = async (quantity: number) => {
    if (quantity < 1) return
    setError(null)
    setUpdating(true)

    await updateLineItem({
      lineId: item.id,
      quantity,
    })
      .then(() => {
        // Trigger instant cart update
        triggerCartRefresh()
      })
      .catch((err) => {
        setError(err.message)
      })
      .finally(() => {
        setUpdating(false)
      })
  }

  // Preview layout (for cart dropdown and checkout summary)
  if (type === "preview") {
    return (
      <div className="flex gap-4 py-4" data-testid="product-row">
        <LocalizedClientLink
          href={`/products/${item.product_handle}`}
          className="w-16 h-16 flex-shrink-0 bg-stone-100 rounded-lg overflow-hidden border border-stone-200"
        >
          <Thumbnail
            thumbnail={item.thumbnail}
            images={item.variant?.product?.images}
            size="square"
            className="w-full h-full object-contain"
          />
        </LocalizedClientLink>
        <div className="flex-1 min-w-0">
          <LocalizedClientLink href={`/products/${item.product_handle}`}>
            <p className="text-sm font-medium text-stone-800 line-clamp-1 hover:text-stone-600 transition-colors" data-testid="product-title">
              {item.product_title}
            </p>
          </LocalizedClientLink>
          <LineItemOptions variant={item.variant} data-testid="product-variant" />
          <div className="flex items-center justify-between mt-2">
            <span className="text-sm text-stone-500">{item.quantity}×</span>
            <LineItemPrice item={item} style="tight" currencyCode={currencyCode} />
          </div>
        </div>
      </div>
    )
  }

  // Full layout (for cart page)
  return (
    <div className="p-6" data-testid="product-row">
      {/* Mobile Layout */}
      <div className="small:hidden flex gap-4">
        <LocalizedClientLink
          href={`/products/${item.product_handle}`}
          className="w-24 h-24 flex-shrink-0 overflow-hidden rounded-lg bg-stone-100"
        >
          <Thumbnail
            thumbnail={item.thumbnail}
            images={item.variant?.product?.images}
            size="square"
          />
        </LocalizedClientLink>
        
        <div className="flex-1 min-w-0">
          <div className="flex justify-between gap-2">
            <LocalizedClientLink href={`/products/${item.product_handle}`}>
              <p className="font-medium text-stone-800 line-clamp-2" data-testid="product-title">
                {item.product_title}
              </p>
            </LocalizedClientLink>
            <DeleteButton id={item.id} data-testid="product-delete-button" />
          </div>
          
          <LineItemOptions variant={item.variant} data-testid="product-variant" />
          
          <div className="flex items-center justify-between mt-3">
            {/* Quantity Controls */}
            <div className="flex items-center border border-stone-300 rounded-lg">
              <button
                onClick={() => changeQuantity(item.quantity - 1)}
                disabled={updating || item.quantity <= 1}
                className="p-2 text-stone-600 hover:text-stone-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Menge verringern"
              >
                <Minus size={16} />
              </button>
              <span className="w-10 text-center text-sm font-medium text-stone-800">
                {updating ? <Spinner className="w-4 h-4 mx-auto" /> : item.quantity}
              </span>
              <button
                onClick={() => changeQuantity(item.quantity + 1)}
                disabled={updating}
                className="p-2 text-stone-600 hover:text-stone-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Menge erhöhen"
              >
                <Plus size={16} />
              </button>
            </div>
            
            <LineItemPrice item={item} style="tight" currencyCode={currencyCode} />
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden small:grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 items-center">
        {/* Product */}
        <div className="flex gap-4 items-center">
          <LocalizedClientLink
            href={`/products/${item.product_handle}`}
            className="w-20 h-20 flex-shrink-0 overflow-hidden rounded-lg bg-stone-100"
          >
            <Thumbnail
              thumbnail={item.thumbnail}
              images={item.variant?.product?.images}
              size="square"
            />
          </LocalizedClientLink>
          
          <div className="min-w-0">
            <LocalizedClientLink href={`/products/${item.product_handle}`}>
              <p className="font-medium text-stone-800 line-clamp-2 hover:text-stone-600 transition-colors" data-testid="product-title">
                {item.product_title}
              </p>
            </LocalizedClientLink>
            <LineItemOptions variant={item.variant} data-testid="product-variant" />
          </div>
        </div>

        {/* Quantity */}
        <div className="flex items-center justify-center gap-2">
          <div className="flex items-center border border-stone-300 rounded-lg">
            <button
              onClick={() => changeQuantity(item.quantity - 1)}
              disabled={updating || item.quantity <= 1}
              className="p-2 text-stone-600 hover:text-stone-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Menge verringern"
            >
              <Minus size={14} />
            </button>
            <span className="w-8 text-center text-sm font-medium text-stone-800">
              {updating ? <Spinner className="w-4 h-4 mx-auto" /> : item.quantity}
            </span>
            <button
              onClick={() => changeQuantity(item.quantity + 1)}
              disabled={updating}
              className="p-2 text-stone-600 hover:text-stone-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Menge erhöhen"
            >
              <Plus size={14} />
            </button>
          </div>
          <DeleteButton id={item.id} data-testid="product-delete-button" />
        </div>

        {/* Unit Price */}
        <div className="text-right">
          <LineItemUnitPrice item={item} style="tight" currencyCode={currencyCode} />
        </div>

        {/* Total */}
        <div className="text-right">
          <LineItemPrice item={item} style="tight" currencyCode={currencyCode} />
        </div>
      </div>

      {error && <ErrorMessage error={error} data-testid="product-error-message" />}
    </div>
  )
}

export default Item
