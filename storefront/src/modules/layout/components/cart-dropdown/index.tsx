"use client"

import { useState } from "react"
import { HttpTypes } from "@medusajs/types"
import { convertToLocale } from "@lib/util/money"
import { updateLineItem, deleteLineItem } from "@lib/data/cart"
import { triggerCartRefresh } from "@lib/context/cart-context"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Button } from "@components/ui"
import Thumbnail from "@modules/products/components/thumbnail"
import { ShoppingBag, Minus, Plus, Trash } from "@components/icons"
import Spinner from "@modules/common/icons/spinner"

interface CartDropdownProps {
  cart: HttpTypes.StoreCart | null
  isOpen: boolean
}

export default function CartDropdown({ cart, isOpen }: CartDropdownProps) {
  const [updatingItems, setUpdatingItems] = useState<Record<string, boolean>>({})
  
  const totalItems = cart?.items?.reduce((acc, item) => acc + item.quantity, 0) || 0
  const isEmpty = !cart || totalItems === 0
  const currencyCode = cart?.currency_code || "EUR"

  // Helper function for consistent price formatting
  const formatAmount = (amount: number) => {
    return convertToLocale({
      amount,
      currency_code: currencyCode,
    })
  }

  // Calculate items subtotal from item totals for consistency
  // (item.total includes tax, item_subtotal might not)
  const itemsTotal = cart?.items?.reduce((acc, item) => acc + (item.total || 0), 0) || 0

  // Handle quantity change
  const handleQuantityChange = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return
    
    setUpdatingItems(prev => ({ ...prev, [itemId]: true }))
    
    try {
      await updateLineItem({
        lineId: itemId,
        quantity: newQuantity,
      })
      triggerCartRefresh()
    } catch (error) {
      console.error("Error updating quantity:", error)
    } finally {
      setUpdatingItems(prev => ({ ...prev, [itemId]: false }))
    }
  }

  // Handle item deletion
  const handleDelete = async (itemId: string) => {
    setUpdatingItems(prev => ({ ...prev, [itemId]: true }))
    
    try {
      await deleteLineItem(itemId)
      triggerCartRefresh()
    } catch (error) {
      console.error("Error deleting item:", error)
    } finally {
      setUpdatingItems(prev => ({ ...prev, [itemId]: false }))
    }
  }

  return (
    <div
      className={`
        absolute top-full right-0 pt-3 w-[380px]
        transition-all duration-200 ease-out
        ${isOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2'}
      `}
    >
      <div className="bg-white rounded-2xl shadow-xl border border-stone-200 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-100">
          <h3 className="font-serif text-lg font-medium text-stone-800">
            Warenkorb
            {totalItems > 0 && (
              <span className="text-stone-500 font-sans text-sm font-normal ml-2">
                ({totalItems} {totalItems === 1 ? 'Artikel' : 'Artikel'})
              </span>
            )}
          </h3>
        </div>

        {/* Content */}
        <div className="max-h-[340px] overflow-y-auto scrollbar-thin">
          {isEmpty ? (
            <div className="px-5 py-12 text-center">
              <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingBag size={24} className="text-stone-400" />
              </div>
              <p className="text-stone-600 mb-2">Ihr Warenkorb ist leer</p>
              <p className="text-sm text-stone-400">
                Entdecken Sie unsere Kollektionen
              </p>
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {cart?.items?.slice(0, 4).map((item) => {
                const isUpdating = updatingItems[item.id]
                
                return (
                  <div key={item.id} className="px-5 py-4 flex gap-3">
                    {/* Thumbnail */}
                    <LocalizedClientLink
                      href={`/products/${item.product?.handle}`}
                      className="relative w-16 h-16 flex-shrink-0 bg-stone-100 rounded-lg overflow-hidden border border-stone-200"
                    >
                      <Thumbnail
                        thumbnail={item.thumbnail}
                        size="square"
                        className="w-full h-full object-contain"
                      />
                    </LocalizedClientLink>
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <LocalizedClientLink
                            href={`/products/${item.product?.handle}`}
                            className="text-sm font-medium text-stone-800 hover:text-stone-600 transition-colors line-clamp-1"
                          >
                            {item.product?.title}
                          </LocalizedClientLink>
                          <p className="text-xs text-stone-500 mt-0.5">
                            {item.variant?.title}
                          </p>
                        </div>
                        
                        {/* Delete Button */}
                        <button
                          onClick={() => handleDelete(item.id)}
                          disabled={isUpdating}
                          className="p-1 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                          aria-label="Artikel entfernen"
                        >
                          {isUpdating ? (
                            <Spinner className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash size={14} />
                          )}
                        </button>
                      </div>
                      
                      {/* Quantity Controls & Price */}
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center border border-stone-200 rounded-md">
                          <button
                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                            disabled={isUpdating || item.quantity <= 1}
                            className="w-7 h-7 flex items-center justify-center text-stone-500 hover:text-stone-700 hover:bg-stone-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Menge verringern"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="w-7 h-7 flex items-center justify-center text-xs font-medium text-stone-700 border-x border-stone-200">
                            {isUpdating ? (
                              <Spinner className="w-3 h-3 animate-spin" />
                            ) : (
                              item.quantity
                            )}
                          </span>
                          <button
                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                            disabled={isUpdating}
                            className="w-7 h-7 flex items-center justify-center text-stone-500 hover:text-stone-700 hover:bg-stone-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Menge erhöhen"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                        
                        <span className="text-sm font-medium text-stone-800">
                          {formatAmount(item.total || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
              
              {cart?.items && cart.items.length > 4 && (
                <div className="px-5 py-3 text-center">
                  <span className="text-sm text-stone-500">
                    + {cart.items.length - 4} weitere Artikel
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!isEmpty && (
          <div className="px-5 py-4 bg-stone-50 border-t border-stone-100">
            {/* Subtotal - use calculated items total for consistency */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-stone-600">Zwischensumme</span>
              <span className="text-base font-semibold text-stone-800">
                {formatAmount(itemsTotal)}
              </span>
            </div>
            
            {/* Tax note - always show inkl. MwSt. for Austrian B2C */}
            <p className="text-xs text-stone-500 mt-1 mb-4">
              inkl. MwSt.
            </p>
            
            {/* Actions */}
            <div className="space-y-2">
              <LocalizedClientLink href="/cart" className="block">
                <Button variant="secondary" fullWidth>
                  Warenkorb ansehen
                </Button>
              </LocalizedClientLink>
              <LocalizedClientLink href="/checkout" className="block">
                <Button variant="primary" fullWidth>
                  Zur Kasse
                </Button>
              </LocalizedClientLink>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
