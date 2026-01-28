"use client"

import { useState, useActionState } from "react"
import { HttpTypes } from "@medusajs/types"
import { createReturnRequest, ReturnItemSelection } from "@lib/data/returns"
import { enhanceItemsWithReturnStatus } from "@lib/util/returns"
import { convertToLocale } from "@lib/util/money"
import ReturnItemSelector from "@modules/account/components/return-item-selector"
import ReturnShippingSelector from "@modules/account/components/return-shipping-selector"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Button } from "@components/ui"
import { 
  ArrowLeft, 
  CheckCircle, 
  Package, 
  Truck, 
  FileText,
  ExternalLink,
  RotateCcw
} from "@components/icons"
import { cn } from "@lib/utils"

type ReturnRequestTemplateProps = {
  order: HttpTypes.StoreOrder
  shippingOptions: HttpTypes.StoreCartShippingOption[]
  returnReasons: HttpTypes.StoreReturnReason[]
}

const STEPS = [
  { id: 1, title: "Artikel auswählen", icon: Package },
  { id: 2, title: "Versand wählen", icon: Truck },
  { id: 3, title: "Bestätigen", icon: FileText },
]

export default function ReturnRequestTemplate({
  order,
  shippingOptions,
  returnReasons,
}: ReturnRequestTemplateProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedItems, setSelectedItems] = useState<ReturnItemSelection[]>([])
  const [selectedShippingOption, setSelectedShippingOption] = useState("")
  
  const [state, formAction, isPending] = useActionState(createReturnRequest, {
    success: false,
    error: null,
    return: null,
  })

  // Enhanced items with return status
  const enhancedItems = enhanceItemsWithReturnStatus(order.items || [])
  const currencyCode = order.currency_code || "EUR"

  // Handle item selection changes
  const handleItemSelectionChange = (selection: ReturnItemSelection) => {
    setSelectedItems((prev) => {
      const existing = prev.find((item) => item.id === selection.id)
      if (existing) {
        if (selection.quantity === 0) {
          return prev.filter((item) => item.id !== selection.id)
        }
        return prev.map((item) =>
          item.id === selection.id ? selection : item
        )
      } else if (selection.quantity > 0) {
        return [...prev, selection]
      }
      return prev
    })
  }

  // Calculate summary
  const selectedItemsWithQuantity = selectedItems.filter((s) => s.quantity > 0)
  const totalItems = selectedItemsWithQuantity.reduce((sum, s) => sum + s.quantity, 0)
  const selectedShippingOptionData = shippingOptions.find(
    (opt) => opt.id === selectedShippingOption
  )
  const shippingCost = selectedShippingOptionData?.amount || 0

  // Get location_id from shipping option or order fulfillment
  const getLocationId = () => {
    // Try shipping option first (different possible paths)
    const opt = selectedShippingOptionData as any
    if (opt?.service_zone?.fulfillment_set?.location?.id) {
      return opt.service_zone.fulfillment_set.location.id
    }
    // Try order fulfillment
    if (order.fulfillments?.[0]?.location_id) {
      return order.fulfillments[0].location_id
    }
    return null
  }

  // Form submission
  const handleSubmit = (formData: FormData) => {
    formData.append("order_id", order.id)
    formData.append("items", JSON.stringify(selectedItemsWithQuantity))
    formData.append("return_shipping_option_id", selectedShippingOption)
    
    const locationId = getLocationId()
    if (locationId) {
      formData.append("location_id", locationId)
    }
    
    formAction(formData)
  }

  // Step validation
  const canProceedToStep2 = selectedItemsWithQuantity.length > 0
  const canProceedToStep3 = canProceedToStep2 && selectedShippingOption

  // === SUCCESS VIEW ===
  if (state.success && state.return) {
    return (
      <div className="max-w-2xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle size={40} className="text-green-600" />
          </div>
          <h1 className="font-serif text-3xl font-medium text-stone-800 mb-2">
            Retoure erfolgreich angemeldet
          </h1>
          <p className="text-stone-600">
            Ihre Rücksendung wurde erfolgreich registriert.
          </p>
        </div>

        {/* Return Info Card */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 mb-6">
          <h2 className="font-medium text-stone-800 mb-4">Retouren-Details</h2>
          
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-stone-500">Retouren-ID</span>
              <span className="font-mono text-stone-800">{state.return.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Status</span>
              <span className="inline-flex items-center px-2 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
                Angefordert
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Artikel</span>
              <span className="text-stone-800">{totalItems} Stück</span>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-blue-50 rounded-2xl border border-blue-200 p-6 mb-6">
          <h2 className="font-medium text-blue-800 mb-4">Nächste Schritte</h2>
          <ol className="space-y-4">
            <li className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center flex-shrink-0 text-sm font-medium">1</span>
              <div>
                <p className="text-blue-800 font-medium">Retourenlabel erhalten</p>
                <p className="text-sm text-blue-600">
                  Sie erhalten in Kürze eine E-Mail mit Ihrem Retourenlabel.
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center flex-shrink-0 text-sm font-medium">2</span>
              <div>
                <p className="text-blue-800 font-medium">Artikel verpacken</p>
                <p className="text-sm text-blue-600">
                  Verpacken Sie die Artikel sorgfältig im Originalkarton oder einem geeigneten Paket.
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center flex-shrink-0 text-sm font-medium">3</span>
              <div>
                <p className="text-blue-800 font-medium">Paket abgeben</p>
                <p className="text-sm text-blue-600">
                  Geben Sie das Paket bei einer Postfiliale oder einem Paketshop ab.
                </p>
              </div>
            </li>
          </ol>
        </div>

        {/* Actions */}
        <div className="flex flex-col small:flex-row gap-3">
          <LocalizedClientLink
            href={`/account/orders/details/${order.id}`}
            className="flex-1"
          >
            <Button variant="secondary" fullWidth>
              Zurück zur Bestellung
            </Button>
          </LocalizedClientLink>
          <LocalizedClientLink href="/account/orders" className="flex-1">
            <Button variant="primary" fullWidth>
              Alle Bestellungen
            </Button>
          </LocalizedClientLink>
        </div>
      </div>
    )
  }

  // === MAIN FORM VIEW ===
  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <LocalizedClientLink
          href={`/account/orders/details/${order.id}`}
          className="inline-flex items-center gap-2 text-stone-600 hover:text-stone-800 transition-colors mb-4"
        >
          <ArrowLeft size={16} />
          <span>Zurück zur Bestellung #{order.display_id}</span>
        </LocalizedClientLink>
        
        <h1 className="font-serif text-3xl font-medium text-stone-800">
          Retoure anmelden
        </h1>
        <p className="text-stone-600 mt-2">
          Wählen Sie die Artikel aus, die Sie zurückgeben möchten.
        </p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => {
            const Icon = step.icon
            const isActive = currentStep === step.id
            const isCompleted = currentStep > step.id
            
            return (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-colors",
                      isActive && "bg-stone-800 text-white",
                      isCompleted && "bg-green-500 text-white",
                      !isActive && !isCompleted && "bg-stone-100 text-stone-400"
                    )}
                  >
                    {isCompleted ? <CheckCircle size={20} /> : <Icon size={20} />}
                  </div>
                  <span
                    className={cn(
                      "text-xs font-medium text-center",
                      isActive && "text-stone-800",
                      isCompleted && "text-green-600",
                      !isActive && !isCompleted && "text-stone-400"
                    )}
                  >
                    {step.title}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={cn(
                      "h-0.5 flex-1 mx-2 mb-6",
                      currentStep > step.id ? "bg-green-500" : "bg-stone-200"
                    )}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Error Message */}
      {state.error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="font-medium text-red-800 mb-1">Fehler bei der Retoure</p>
          <p className="text-red-700 text-sm">{state.error}</p>
          <p className="text-red-600 text-xs mt-2">
            Bei anhaltenden Problemen wenden Sie sich bitte an unseren Kundenservice.
          </p>
        </div>
      )}

      {/* Form */}
      <form action={handleSubmit}>
        {/* Step 1: Select Items */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <ReturnItemSelector
              items={enhancedItems}
              returnReasons={returnReasons}
              selectedItems={selectedItems}
              onSelectionChange={handleItemSelectionChange}
              currencyCode={currencyCode}
            />

            <div className="flex justify-end">
              <Button
                type="button"
                onClick={() => setCurrentStep(2)}
                disabled={!canProceedToStep2}
              >
                Weiter zur Versandauswahl
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Select Shipping */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <ReturnShippingSelector
              shippingOptions={shippingOptions}
              selectedOptionId={selectedShippingOption}
              onSelect={setSelectedShippingOption}
              currencyCode={currencyCode}
            />

            <div className="flex justify-between">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setCurrentStep(1)}
              >
                Zurück
              </Button>
              <Button
                type="button"
                onClick={() => setCurrentStep(3)}
                disabled={!canProceedToStep3}
              >
                Weiter zur Bestätigung
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Confirm */}
        {currentStep === 3 && (
          <div className="space-y-6">
            {/* Summary Card */}
            <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
              <div className="p-6 border-b border-stone-200">
                <h2 className="font-medium text-stone-800">Zusammenfassung</h2>
              </div>

              {/* Selected Items */}
              <div className="p-6 border-b border-stone-200">
                <h3 className="text-sm font-medium text-stone-500 uppercase tracking-wider mb-4">
                  Artikel zur Rückgabe
                </h3>
                <div className="space-y-3">
                  {selectedItemsWithQuantity.map((selection) => {
                    const item = enhancedItems.find((i) => i.id === selection.id)
                    if (!item) return null
                    const reason = returnReasons.find(
                      (r) => r.id === selection.return_reason_id
                    )

                    return (
                      <div key={selection.id} className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-stone-100 rounded-lg overflow-hidden">
                          {item.thumbnail && (
                            <img
                              src={item.thumbnail}
                              alt={item.title || ""}
                              className="w-full h-full object-contain"
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-stone-800 truncate">
                            {item.product_title || item.title}
                          </p>
                          <p className="text-sm text-stone-500">
                            {selection.quantity}x
                            {reason && ` · ${reason.label}`}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Shipping */}
              <div className="p-6 border-b border-stone-200">
                <h3 className="text-sm font-medium text-stone-500 uppercase tracking-wider mb-4">
                  Versand
                </h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Truck size={20} className="text-stone-600" />
                    <span className="text-stone-800">
                      {selectedShippingOptionData?.name}
                    </span>
                  </div>
                  <span className="font-medium text-stone-800">
                    {convertToLocale({
                      amount: shippingCost,
                      currency_code: currencyCode,
                    })}
                  </span>
                </div>
              </div>

            </div>

            {/* Terms */}
            <div className="p-4 bg-stone-50 rounded-xl text-sm text-stone-600">
              Mit dem Absenden stimmen Sie unseren{" "}
              <LocalizedClientLink href="/terms" className="text-stone-800 underline">
                Rückgabebedingungen
              </LocalizedClientLink>{" "}
              zu.
            </div>

            {/* Actions */}
            <div className="flex justify-between">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setCurrentStep(2)}
              >
                Zurück
              </Button>
              <Button
                type="submit"
                isLoading={isPending}
              >
                <RotateCcw size={16} className="mr-2" />
                Retoure anmelden
              </Button>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}

