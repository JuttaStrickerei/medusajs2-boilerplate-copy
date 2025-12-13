"use client"

import { HttpTypes } from "@medusajs/types"
import { convertToLocale } from "@lib/util/money"
import { Truck, CheckCircle } from "@components/icons"
import { cn } from "@lib/utils"

type ReturnShippingSelectorProps = {
  shippingOptions: HttpTypes.StoreCartShippingOption[]
  selectedOptionId: string
  onSelect: (optionId: string) => void
  currencyCode: string
}

export default function ReturnShippingSelector({
  shippingOptions,
  selectedOptionId,
  onSelect,
  currencyCode,
}: ReturnShippingSelectorProps) {
  if (shippingOptions.length === 0) {
    return (
      <div className="text-center py-8 bg-amber-50 rounded-xl border border-amber-200">
        <Truck size={32} className="mx-auto mb-3 text-amber-500" />
        <p className="text-amber-800 font-medium">
          Keine Retourenversand-Optionen verfügbar
        </p>
        <p className="text-sm text-amber-600 mt-1">
          Bitte kontaktieren Sie unseren Kundenservice für Unterstützung.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {shippingOptions.map((option) => {
        const isSelected = selectedOptionId === option.id
        const price = option.amount || 0
        const isFree = price === 0

        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onSelect(option.id)}
            className={cn(
              "w-full p-4 rounded-xl border-2 transition-all text-left",
              "flex items-center gap-4",
              isSelected
                ? "border-stone-800 bg-stone-50"
                : "border-stone-200 bg-white hover:border-stone-300"
            )}
          >
            {/* Selection Indicator */}
            <div
              className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0",
                isSelected
                  ? "bg-stone-800 text-white"
                  : "border-2 border-stone-300"
              )}
            >
              {isSelected && <CheckCircle size={14} />}
            </div>

            {/* Icon */}
            <div
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                isSelected ? "bg-stone-800 text-white" : "bg-stone-100 text-stone-600"
              )}
            >
              <Truck size={20} />
            </div>

            {/* Option Info */}
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-stone-800">
                {option.name}
              </h4>
              {option.data?.estimated_delivery && (
                <p className="text-sm text-stone-500">
                  {option.data.estimated_delivery}
                </p>
              )}
            </div>

            {/* Price */}
            <div className="flex-shrink-0 text-right">
              {isFree ? (
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-700 font-medium text-sm">
                  Kostenlos
                </span>
              ) : (
                <span className="font-semibold text-stone-800">
                  {convertToLocale({
                    amount: price,
                    currency_code: currencyCode,
                  })}
                </span>
              )}
            </div>
          </button>
        )
      })}

      {/* Info Box */}
      <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <Truck size={16} className="text-blue-600" />
          </div>
          <div className="text-sm">
            <p className="text-blue-800 font-medium">Versandhinweis</p>
            <p className="text-blue-600 mt-1">
              Nach der Anmeldung erhalten Sie ein Retourenlabel per E-Mail, 
              das Sie ausdrucken und auf Ihr Paket kleben können.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

