"use client"

import React from "react"

import { applyPromotions } from "@lib/data/cart"
import { convertToLocale } from "@lib/util/money"
import { SHOP_ERRORS } from "@lib/util/shop-errors"
import { clearPendingVoucher, readPendingVoucher } from "@lib/util/pending-voucher"
import { HttpTypes } from "@medusajs/types"
import ErrorMessage from "../error-message"
import { SubmitButton } from "../submit-button"
import { Tag, Trash, ChevronDown } from "@components/icons"
import { cn } from "@lib/utils"
import { triggerCartRefresh } from "@lib/context/cart-context"

type DiscountCodeProps = {
  cart: HttpTypes.StoreCart & {
    promotions: HttpTypes.StorePromotion[]
  }
}

const DiscountCode: React.FC<DiscountCodeProps> = ({ cart }) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState("")

  const { promotions = [] } = cart

  // Gutschein aus einem Link (?gutschein=…, z. B. Willkommens-Mail): einmal von
  // selbst einlösen, sobald etwas im Warenkorb liegt und noch kein Code gesetzt ist
  const itemCount = cart?.items?.length ?? 0
  const hasManualCode = promotions.some((promotion) => !promotion.is_automatic)
  React.useEffect(() => {
    if (!itemCount || hasManualCode) return
    const pending = readPendingVoucher()
    if (!pending) return
    clearPendingVoucher()
    applyPromotions([pending])
      .then((applied) => {
        if (
          Array.isArray(applied) &&
          !applied.some((c) => c.toLowerCase() === pending.toLowerCase())
        ) {
          setIsOpen(true)
          setErrorMessage(SHOP_ERRORS.PROMO_NOT_APPLIED)
        }
        triggerCartRefresh()
      })
      .catch(() => {
        setIsOpen(true)
        setErrorMessage(SHOP_ERRORS.PROMO_INVALID)
      })
  }, [itemCount, hasManualCode])
  const removePromotionCode = async (code: string) => {
    const validPromotions = promotions.filter(
      (promotion) => promotion.code !== code
    )

    await applyPromotions(
      validPromotions.filter((p) => p.code !== undefined).map((p) => p.code!)
    )
    // Warenkorb im Browser neu laden: Zähler im Kopf und Abgleich der Seite (cart-freshness)
    triggerCartRefresh()
  }

  const addPromotionCode = async (formData: FormData) => {
    setErrorMessage("")

    const code = formData.get("code")
    if (!code) {
      return
    }
    const input = document.getElementById("promotion-input") as HTMLInputElement

    try {
      // Pro Bestellung gilt ein Gutscheincode: Der neue Code ersetzt den bisherigen.
      // Sonst ließen sich Codes stapeln (z. B. zwei Mal 10 %).
      const wanted = code.toString().trim()
      const applied = await applyPromotions([wanted])
      if (
        Array.isArray(applied) &&
        !applied.some((c) => c.toLowerCase() === wanted.toLowerCase())
      ) {
        setErrorMessage(SHOP_ERRORS.PROMO_NOT_APPLIED)
      }
      triggerCartRefresh()
    } catch {
      // Im Produktions-Build kommt hier nur ein allgemeiner englischer Text an;
      // häufigste Ursache ist ein falscher oder abgelaufener Code
      setErrorMessage(SHOP_ERRORS.PROMO_INVALID)
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
                className="flex-1 min-w-0 px-3 py-2 text-base small:text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-200 focus:border-stone-400"
              />
              <SubmitButton
                variant="secondary"
                data-testid="discount-apply-button"
                className="px-4 py-2 text-sm"
              >
                Einlösen
              </SubmitButton>
            </div>

            <p className="text-xs text-stone-500">
              Pro Bestellung können Sie einen Gutscheincode einlösen.
              {promotions.some((p) => !p.is_automatic) &&
                " Ein neuer Code ersetzt den bisherigen."}
            </p>

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
            Ihr Gutschein
          </p>

          {promotions.map((promotion) => (
            <div
              key={promotion.id}
              className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded-lg"
              data-testid="discount-row"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Tag size={14} className="text-green-600 flex-shrink-0" />
                <span className="text-sm font-medium text-green-800" data-testid="discount-code">
                  {promotion.code}
                </span>
                {/* Am Handy steht der Abzug schon in der Zeile „Rabatt“ darunter; so bleibt der Code in einer Zeile */}
                {promotion.application_method?.value !== undefined && (
                  <span className="hidden xsmall:inline text-xs text-green-600 whitespace-nowrap">
                    (−{promotion.application_method.type === "percentage"
                      ? `${promotion.application_method.value}\u00a0%`
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
