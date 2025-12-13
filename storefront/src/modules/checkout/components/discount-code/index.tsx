"use client"

import React from "react"

import { applyPromotions } from "@lib/data/cart"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import ErrorMessage from "../error-message"
import { SubmitButton } from "../submit-button"
import { Tag, Trash, ChevronDown } from "@components/icons"
import { cn } from "@lib/utils"

type DiscountCodeProps = {
  cart: HttpTypes.StoreCart & {
    promotions: HttpTypes.StorePromotion[]
  }
}

const DiscountCode: React.FC<DiscountCodeProps> = ({ cart }) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState("")

  const { promotions = [] } = cart
  const removePromotionCode = async (code: string) => {
    const validPromotions = promotions.filter(
      (promotion) => promotion.code !== code
    )

    await applyPromotions(
      validPromotions.filter((p) => p.code !== undefined).map((p) => p.code!)
    )
  }

  const addPromotionCode = async (formData: FormData) => {
    setErrorMessage("")

    const code = formData.get("code")
    if (!code) {
      return
    }
    const input = document.getElementById("promotion-input") as HTMLInputElement
    const codes = promotions
      .filter((p) => p.code !== undefined)
      .map((p) => p.code!)
    codes.push(code.toString())

    try {
      await applyPromotions(codes)
    } catch (e: any) {
      setErrorMessage(e.message)
    }

    if (input) {
      input.value = ""
    }
  }

  return (
    <div className="w-full">
      <form action={(a) => addPromotionCode(a)} className="w-full">
        {/* Toggle Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          type="button"
          className="flex items-center gap-2 text-sm text-stone-600 hover:text-stone-800 transition-colors"
          data-testid="add-discount-button"
        >
          <Tag size={16} />
          <span>Gutscheincode hinzufügen</span>
          <ChevronDown 
            size={14} 
            className={cn(
              "transition-transform",
              isOpen && "rotate-180"
            )}
          />
        </button>

        {/* Input Form */}
        {isOpen && (
          <div className="mt-3 space-y-2">
            <div className="flex gap-2">
              <input
                id="promotion-input"
                name="code"
                type="text"
                placeholder="Code eingeben"
                autoFocus={false}
                data-testid="discount-input"
                className="flex-1 px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-200 focus:border-stone-400"
              />
              <SubmitButton
                variant="secondary"
                data-testid="discount-apply-button"
                className="px-4 py-2 text-sm"
              >
                Einlösen
              </SubmitButton>
            </div>

            <ErrorMessage
              error={errorMessage}
              data-testid="discount-error-message"
            />
          </div>
        )}
      </form>

      {/* Applied Promotions */}
      {promotions.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-xs text-stone-500 uppercase tracking-wider">
            Aktive Gutscheine
          </p>

          {promotions.map((promotion) => (
            <div
              key={promotion.id}
              className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded-lg"
              data-testid="discount-row"
            >
              <div className="flex items-center gap-2">
                <Tag size={14} className="text-green-600" />
                <span className="text-sm font-medium text-green-800" data-testid="discount-code">
                  {promotion.code}
                </span>
                {promotion.application_method?.value !== undefined && (
                  <span className="text-xs text-green-600">
                    (−{promotion.application_method.type === "percentage"
                      ? `${promotion.application_method.value}%`
                      : convertToLocale({
                          amount: +promotion.application_method.value,
                          currency_code: promotion.application_method.currency_code || cart.currency_code,
                        })}
                    )
                  </span>
                )}
              </div>
              {!promotion.is_automatic && (
                <button
                  type="button"
                  className="p-1 text-green-600 hover:text-green-800 transition-colors"
                  onClick={() => {
                    if (promotion.code) {
                      removePromotionCode(promotion.code)
                    }
                  }}
                  data-testid="remove-discount-button"
                >
                  <Trash size={14} />
                  <span className="sr-only">Gutschein entfernen</span>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default DiscountCode
