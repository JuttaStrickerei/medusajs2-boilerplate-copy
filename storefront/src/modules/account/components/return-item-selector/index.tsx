"use client"

import { useState } from "react"
import { HttpTypes } from "@medusajs/types"
import { EnhancedOrderItem } from "@lib/util/returns"
import { ReturnItemSelection } from "@lib/data/returns"
import { convertToLocale } from "@lib/util/money"
import Thumbnail from "@modules/products/components/thumbnail"
import { Minus, Plus, ChevronDown, ChevronUp } from "@components/icons"
import { cn } from "@lib/utils"

type ReturnItemSelectorProps = {
  items: EnhancedOrderItem[]
  returnReasons: HttpTypes.StoreReturnReason[]
  selectedItems: ReturnItemSelection[]
  onSelectionChange: (selection: ReturnItemSelection) => void
  currencyCode: string
}

export default function ReturnItemSelector({
  items,
  returnReasons,
  selectedItems,
  onSelectionChange,
  currencyCode,
}: ReturnItemSelectorProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  const toggleItemExpanded = (itemId: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(itemId)) {
        newSet.delete(itemId)
      } else {
        newSet.add(itemId)
      }
      return newSet
    })
  }

  const getSelectedItem = (itemId: string) => {
    return selectedItems.find((s) => s.id === itemId)
  }

  const handleQuantityChange = (item: EnhancedOrderItem, delta: number) => {
    const current = getSelectedItem(item.id)
    const currentQty = current?.quantity || 0
    const newQty = Math.max(0, Math.min(item.returnableQuantity, currentQty + delta))

    // Auto-expand when selecting
    if (newQty > 0 && !expandedItems.has(item.id)) {
      setExpandedItems((prev) => new Set(prev).add(item.id))
    }

    onSelectionChange({
      id: item.id,
      quantity: newQty,
      return_reason_id: current?.return_reason_id,
      note: current?.note,
    })
  }

  const handleReasonChange = (itemId: string, reasonId: string) => {
    const current = getSelectedItem(itemId)
    if (!current) return

    onSelectionChange({
      ...current,
      return_reason_id: reasonId,
    })
  }

  const handleNoteChange = (itemId: string, note: string) => {
    const current = getSelectedItem(itemId)
    if (!current) return

    onSelectionChange({
      ...current,
      note,
    })
  }

  // Filter to only show returnable items
  const returnableItems = items.filter((item) => item.isReturnable)

  if (returnableItems.length === 0) {
    return (
      <div className="text-center py-8 bg-stone-50 rounded-xl">
        <p className="text-stone-600">
          Keine Artikel können zurückgegeben werden.
        </p>
        <p className="text-sm text-stone-500 mt-1">
          Artikel müssen zuerst zugestellt werden, bevor sie zurückgegeben werden können.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {returnableItems.map((item) => {
        const selected = getSelectedItem(item.id)
        const isSelected = (selected?.quantity || 0) > 0
        const isExpanded = expandedItems.has(item.id)

        return (
          <div
            key={item.id}
            className={cn(
              "border rounded-xl overflow-hidden transition-all",
              isSelected
                ? "border-stone-800 bg-stone-50"
                : "border-stone-200 bg-white hover:border-stone-300"
            )}
          >
            {/* Item Header */}
            <div className="p-4 flex items-center gap-4">
              {/* Thumbnail */}
              <div className="w-16 h-16 flex-shrink-0 bg-white rounded-lg overflow-hidden border border-stone-200">
                <Thumbnail
                  thumbnail={item.thumbnail}
                  size="square"
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Item Info */}
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-stone-800 truncate">
                  {item.product_title || item.title}
                </h4>
                {item.variant_title && (
                  <p className="text-sm text-stone-500 truncate">
                    {item.variant_title}
                  </p>
                )}
                <p className="text-sm text-stone-600 mt-1">
                  {convertToLocale({
                    amount: item.unit_price || 0,
                    currency_code: currencyCode,
                  })}
                  {" · "}
                  <span className="text-stone-500">
                    Max. {item.returnableQuantity} Stück
                  </span>
                </p>
              </div>

              {/* Quantity Selector */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleQuantityChange(item, -1)}
                  disabled={!selected || selected.quantity === 0}
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                    selected && selected.quantity > 0
                      ? "bg-stone-800 text-white hover:bg-stone-700"
                      : "bg-stone-100 text-stone-400 cursor-not-allowed"
                  )}
                  aria-label="Menge verringern"
                >
                  <Minus size={16} />
                </button>
                <span className="w-8 text-center font-medium text-stone-800">
                  {selected?.quantity || 0}
                </span>
                <button
                  type="button"
                  onClick={() => handleQuantityChange(item, 1)}
                  disabled={selected?.quantity === item.returnableQuantity}
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                    (!selected || selected.quantity < item.returnableQuantity)
                      ? "bg-stone-800 text-white hover:bg-stone-700"
                      : "bg-stone-100 text-stone-400 cursor-not-allowed"
                  )}
                  aria-label="Menge erhöhen"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* Expanded Options (shown when item is selected) */}
            {isSelected && (
              <div className="border-t border-stone-200">
                {/* Toggle Details */}
                <button
                  type="button"
                  onClick={() => toggleItemExpanded(item.id)}
                  className="w-full px-4 py-3 flex items-center justify-between text-sm text-stone-600 hover:bg-stone-100 transition-colors"
                >
                  <span>
                    {isExpanded ? "Details ausblenden" : "Rückgabegrund angeben"}
                  </span>
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {/* Details Form */}
                {isExpanded && (
                  <div className="px-4 pb-4 space-y-4">
                    {/* Return Reason */}
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-2">
                        Rückgabegrund <span className="text-stone-400">(optional)</span>
                      </label>
                      <select
                        value={selected?.return_reason_id || ""}
                        onChange={(e) => handleReasonChange(item.id, e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-stone-200 bg-white text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-200"
                      >
                        <option value="">Bitte auswählen...</option>
                        {returnReasons.map((reason) => (
                          <option key={reason.id} value={reason.id}>
                            {reason.label || reason.value}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Note */}
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-2">
                        Anmerkung <span className="text-stone-400">(optional)</span>
                      </label>
                      <textarea
                        value={selected?.note || ""}
                        onChange={(e) => handleNoteChange(item.id, e.target.value)}
                        placeholder="Weitere Details zur Rückgabe..."
                        rows={2}
                        className="w-full px-4 py-2.5 rounded-lg border border-stone-200 bg-white text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-200 resize-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}

      {/* Summary */}
      {selectedItems.filter((s) => s.quantity > 0).length > 0 && (
        <div className="mt-6 p-4 bg-stone-800 text-white rounded-xl">
          <div className="flex justify-between items-center">
            <span className="font-medium">Ausgewählte Artikel</span>
            <span className="text-lg font-semibold">
              {selectedItems.reduce((sum, s) => sum + s.quantity, 0)} Stück
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

