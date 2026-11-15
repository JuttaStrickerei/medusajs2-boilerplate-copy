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
    shipping_methods?: Array<unknown> | null
  }
  taxIncluded?: boolean
  /** Versandkosten vorab, solange noch keine Versandart gewählt ist (Warenkorb, Kasse Schritt 1) */
  shippingPreview?: { amount: number; hasFreePickup: boolean } | null
  /** In der Kasse steht die Abholung im Schritt „Lieferung“, der Hinweis wäre doppelt */
  hidePickupNote?: boolean
}

const CartTotals: React.FC<CartTotalsProps> = ({ totals, taxIncluded = true, shippingPreview = null, hidePickupNote = false }) => {
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
  // Solange keine Versandart gewählt ist, steht die Lieferung nach Hause schon in der Summe.
  // Sonst zeigt der Warenkorb „Versand € 0,00“ und der Betrag kommt erst in der Kasse dazu.
  const preview = !totals.shipping_methods?.length ? shippingPreview : null
  const displayShipping = preview ? preview.amount : shipping_total ?? shipping_subtotal ?? null
  const displayTotal = (total ?? 0) + (preview ? preview.amount : 0)
  
  // Use discount_total if available, otherwise discount_subtotal
  const displayDiscount = discount_total || discount_subtotal || 0

  // Mit Rabatt zeigt „Artikel“ den Preis vor dem Abzug. Sonst stünde dort schon der
  // reduzierte Betrag und darunter noch einmal „Rabatt“, als würde doppelt abgezogen.
  // So gilt immer: Artikel − Rabatt + Versand = Gesamt.
  const shownItems =
    displayDiscount > 0
      ? (total ?? 0) - (shipping_total ?? shipping_subtotal ?? 0) + displayDiscount
      : displayItemsSubtotal

  return (
    <div className="space-y-3">
      {/* Line Items */}
      <div className="space-y-2.5 text-sm">
        {/* Subtotal - Items */}
        <div className="flex items-center justify-between text-stone-600">
          <span>Artikel</span>
          <span data-testid="cart-subtotal" data-value={shownItems}>
            {formatAmount(shownItems)}
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
          <span>{preview ? "Versand in Österreich" : "Versand"}</span>
          <span data-testid="cart-shipping" data-value={displayShipping ?? 0}>
            {displayShipping !== null
              ? formatAmount(displayShipping)
              : <span className="text-stone-400 italic">Wird berechnet</span>
            }
          </span>
        </div>
        
        {/* Tax breakdown - only show if tax exists */}
        {(tax_total ?? 0) > 0 && !preview && (
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
            data-value={displayTotal}
          >
            {formatAmount(displayTotal)}
          </span>
          <span className="text-xs text-stone-500 block">
            inkl. MwSt.
          </span>
        </div>
      </div>
      
      {preview?.hasFreePickup && !hidePickupNote && (
        <p className="text-xs text-stone-500" data-testid="cart-pickup-note">
          Abholung in Draßburg im Burgenland: kostenlos, in der Kasse wählbar.
        </p>
      )}

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
