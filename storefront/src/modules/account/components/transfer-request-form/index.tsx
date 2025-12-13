"use client"

import { useActionState } from "react"
import { createTransferRequest } from "@lib/data/orders"
import { Input } from "@components/ui"
import { Button } from "@components/ui"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import { CheckCircle, X } from "@components/icons"
import { useEffect, useState } from "react"

export default function TransferRequestForm() {
  const [showSuccess, setShowSuccess] = useState(false)

  const [state, formAction] = useActionState(createTransferRequest, {
    success: false,
    error: null,
    order: null,
  })

  useEffect(() => {
    if (state.success && state.order) {
      setShowSuccess(true)
    }
  }, [state.success, state.order])

  return (
    <div className="flex flex-col gap-y-4 w-full">
      <div className="grid sm:grid-cols-2 items-center gap-x-8 gap-y-4 w-full">
        <div className="flex flex-col gap-y-1">
          <h3 className="font-serif text-lg font-medium text-stone-800">
            Bestellung übertragen
          </h3>
          <p className="text-sm text-stone-500">
            Können Sie Ihre Bestellung nicht finden?
            <br /> Verknüpfen Sie eine Bestellung mit Ihrem Konto.
          </p>
        </div>
        <form
          action={formAction}
          className="flex flex-col gap-y-1 sm:items-end"
        >
          <div className="flex flex-col gap-y-2 w-full">
            <Input 
              className="w-full" 
              name="order_id" 
              placeholder="Bestellnummer eingeben" 
            />
            <SubmitButton
              variant="secondary"
              className="w-fit whitespace-nowrap self-end"
            >
              Übertragung anfragen
            </SubmitButton>
          </div>
        </form>
      </div>
      {!state.success && state.error && (
        <p className="text-sm text-red-500 text-right">
          {state.error}
        </p>
      )}
      {showSuccess && (
        <div className="flex justify-between p-4 bg-green-50 border border-green-200 rounded-lg w-full self-stretch items-center">
          <div className="flex gap-x-3 items-center">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div className="flex flex-col gap-y-0.5">
              <p className="text-sm font-medium text-stone-800">
                Übertragung für Bestellung {state.order?.id} angefragt
              </p>
              <p className="text-xs text-stone-500">
                Eine Bestätigungs-E-Mail wurde an {state.order?.email} gesendet
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowSuccess(false)}
            className="p-1 hover:bg-green-100 rounded-full transition-colors"
          >
            <X className="w-4 h-4 text-stone-500" />
          </button>
        </div>
      )}
    </div>
  )
}
