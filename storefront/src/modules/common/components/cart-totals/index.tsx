"use client"

import { convertToLocale } from "@lib/util/money"
import React from "react"

type CartTotalsProps = {
  totals: {
    total?: number | null
    subtotal?: number | null
    tax_total?: number | null
    currency_code: string
    item_subtotal?: number | null
    item_total?: number | null
    shipping_subtotal?: number | null
    shipping_total?: number | null
    discount_subtotal?: number | null
    discount_total?: number | null
    items?: Array<{ total?: number | null }>
  }
  taxIncluded?: boolean
}

const CartTotals: React.FC<CartTotalsProps> = ({ totals, taxIncluded = true }) => {
  const {
    currency_code,
    total,
    tax_total,
    item_subtotal,
    item_total,
    shipping_subtotal,
    shipping_total,
    discount_subtotal,
    discount_total,
    items,
  } = totals

  // Helper function for consistent formatting
  const formatAmount = (amount: number) => {
    return convertToLocale({
      amount,
      currency_code,
    })
  }

  // Calculate items total from individual items if available (most accurate with tax)
  const calculatedItemsTotal = items?.reduce((acc, item) => acc + (item.total || 0), 0) || 0
  
  // Use the calculated items total, or fall back to item_total/item_subtotal
  const displayItemsSubtotal = calculatedItemsTotal || item_total || item_subtotal || 0
  
  // Use shipping_total if available (includes tax), otherwise shipping_subtotal
  // Use ?? null to preserve null state (means "not yet calculated")
  const displayShipping = shipping_total ?? shipping_subtotal ?? null
  
  // Use discount_total if available, otherwise discount_subtotal
  const displayDiscount = discount_total || discount_subtotal || 0

  return (
    <div className="space-y-3">
      {/* Line Items */}
      <div className="space-y-2.5 text-sm">
        {/* Subtotal - Items */}
        <div className="flex items-center justify-between text-stone-600">
          <span>Artikel</span>
          <span data-testid="cart-subtotal" data-value={displayItemsSubtotal}>
            {formatAmount(displayItemsSubtotal)}
          </span>
        </div>
        
        {/* Discount */}
        {displayDiscount > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-stone-600">Rabatt</span>
            <span
              className="text-green-600 font-medium"
              data-testid="cart-discount"
              data-value={displayDiscount}
            >
              −{formatAmount(displayDiscount)}
            </span>
          </div>
        )}
        
        {/* Shipping */}
        <div className="flex items-center justify-between text-stone-600">
          <span>Versand</span>
          <span data-testid="cart-shipping" data-value={displayShipping ?? 0}>
            {displayShipping !== null
              ? formatAmount(displayShipping)
              : <span className="text-stone-400 italic">Wird berechnet</span>
            }
          </span>
        </div>
        
        {/* Tax breakdown - only show if tax exists */}
        {(tax_total ?? 0) > 0 && (
          <div className="flex items-center justify-between text-stone-500 text-xs pt-1">
            <span>davon MwSt. (20%)</span>
            <span data-testid="cart-taxes" data-value={tax_total || 0}>
              {formatAmount(tax_total ?? 0)}
            </span>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-stone-200 pt-3" />

      {/* Total */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-base font-semibold text-stone-800">Gesamt</span>
        </div>
        <div className="text-right">
          <span
            className="text-xl font-bold text-stone-800"
            data-testid="cart-total"
            data-value={total || 0}
          >
            {formatAmount(total ?? 0)}
          </span>
          <span className="text-xs text-stone-500 block">
            inkl. MwSt.
          </span>
        </div>
      </div>
      
      {/* Additional info */}
      {displayShipping === null && (
        <p className="text-xs text-stone-400 italic">
          Versandkosten werden im nächsten Schritt berechnet
        </p>
      )}
    </div>
  )
}

export default CartTotals
