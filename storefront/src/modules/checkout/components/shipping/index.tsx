"use client"

import { Radio, RadioGroup } from "@headlessui/react"
import { setShippingMethod } from "@lib/data/cart"
import { calculatePriceForShippingOption } from "@lib/data/fulfillment"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import { clx } from "@medusajs/ui"
import ErrorMessage from "@modules/checkout/components/error-message"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@components/ui"
import { CheckCircle, Truck, MapPin } from "@components/icons"
import Spinner from "@modules/common/icons/spinner"

const PICKUP_OPTION_ON = "__PICKUP_ON"
const PICKUP_OPTION_OFF = "__PICKUP_OFF"

type ShippingProps = {
  cart: HttpTypes.StoreCart
  availableShippingMethods: HttpTypes.StoreCartShippingOption[] | null
}

function formatAddress(address: HttpTypes.StoreCartAddress) {
  if (!address) {
    return ""
  }

  let ret = ""

  if (address.address_1) {
    ret += ` ${address.address_1}`
  }

  if (address.address_2) {
    ret += `, ${address.address_2}`
  }

  if (address.postal_code) {
    ret += `, ${address.postal_code} ${address.city}`
  }

  if (address.country_code) {
    ret += `, ${address.country_code.toUpperCase()}`
  }

  return ret
}

const Shipping: React.FC<ShippingProps> = ({
  cart,
  availableShippingMethods,
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingPrices, setIsLoadingPrices] = useState(true)

  const [showPickupOptions, setShowPickupOptions] =
    useState<string>(PICKUP_OPTION_OFF)
  const [calculatedPricesMap, setCalculatedPricesMap] = useState<
    Record<string, number>
  >({})
  const [error, setError] = useState<string | null>(null)
  const [shippingMethodId, setShippingMethodId] = useState<string | null>(
    cart.shipping_methods?.at(-1)?.shipping_option_id || null
  )

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const isOpen = searchParams.get("step") === "delivery"

  const _shippingMethods = availableShippingMethods?.filter(
    (sm) => sm.service_zone?.fulfillment_set?.type !== "pickup"
  )

  const _pickupMethods = availableShippingMethods?.filter(
    (sm) => sm.service_zone?.fulfillment_set?.type === "pickup"
  )

  const hasPickupOptions = !!_pickupMethods?.length

  useEffect(() => {
    setIsLoadingPrices(true)

    if (_shippingMethods?.length) {
      const promises = _shippingMethods
        .filter((sm) => sm.price_type === "calculated")
        .map((sm) => calculatePriceForShippingOption(sm.id, cart.id))

      if (promises.length) {
        Promise.allSettled(promises).then((res) => {
          const pricesMap: Record<string, number> = {}
          res
            .filter((r) => r.status === "fulfilled")
            .forEach((p) => (pricesMap[p.value?.id || ""] = p.value?.amount!))

          setCalculatedPricesMap(pricesMap)
          setIsLoadingPrices(false)
        })
      }
    }

    if (_pickupMethods?.find((m) => m.id === shippingMethodId)) {
      setShowPickupOptions(PICKUP_OPTION_ON)
    }
  }, [availableShippingMethods])

  const handleEdit = () => {
    router.push(pathname + "?step=delivery", { scroll: false })
  }

  const handleSubmit = () => {
    router.push(pathname + "?step=payment", { scroll: false })
  }

  const handleSetShippingMethod = async (
    id: string,
    variant: "shipping" | "pickup"
  ) => {
    setError(null)

    if (variant === "pickup") {
      setShowPickupOptions(PICKUP_OPTION_ON)
    } else {
      setShowPickupOptions(PICKUP_OPTION_OFF)
    }

    let currentId: string | null = null
    setIsLoading(true)
    setShippingMethodId((prev) => {
      currentId = prev
      return id
    })

    await setShippingMethod({ cartId: cart.id, shippingMethodId: id })
      .catch((err) => {
        setShippingMethodId(currentId)

        setError(err.message)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }

  useEffect(() => {
    setError(null)
  }, [isOpen])

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={clx(
            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
            {
              "bg-green-100 text-green-600": !isOpen && (cart.shipping_methods?.length ?? 0) > 0,
              "bg-stone-800 text-white": isOpen,
              "bg-stone-200 text-stone-400": !isOpen && cart.shipping_methods?.length === 0,
            }
          )}>
            {!isOpen && (cart.shipping_methods?.length ?? 0) > 0 ? (
              <CheckCircle size={18} />
            ) : (
              "2"
            )}
          </div>
          <h3 className={clx(
            "font-serif text-lg font-medium",
            {
              "text-stone-800": isOpen || (cart.shipping_methods?.length ?? 0) > 0,
              "text-stone-400": !isOpen && cart.shipping_methods?.length === 0,
            }
          )}>
            Versandart
          </h3>
        </div>
        {!isOpen &&
          cart?.shipping_address &&
          cart?.billing_address &&
          cart?.email && (
            <button
              onClick={handleEdit}
              className="text-sm font-medium text-stone-600 hover:text-stone-800 transition-colors underline underline-offset-4"
              data-testid="edit-delivery-button"
            >
              Bearbeiten
            </button>
          )}
      </div>

      {isOpen ? (
        <div className="space-y-6">
          {/* Shipping Options */}
          <div>
            <p className="text-sm text-stone-600 mb-4">
              Wie soll Ihre Bestellung geliefert werden?
            </p>

            <div data-testid="delivery-options-container" className="space-y-3">
              {/* Pickup Option */}
              {hasPickupOptions && (
                <RadioGroup
                  value={showPickupOptions}
                  onChange={() => {
                    const id = _pickupMethods.find(
                      (option) => !option.insufficient_inventory
                    )?.id
                    if (id) handleSetShippingMethod(id, "pickup")
                  }}
                >
                  <Radio
                    value={PICKUP_OPTION_ON}
                    data-testid="delivery-option-radio"
                    className={clx(
                      "flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-all",
                      {
                        "border-stone-800 bg-stone-50": showPickupOptions === PICKUP_OPTION_ON,
                        "border-stone-200 hover:border-stone-300": showPickupOptions !== PICKUP_OPTION_ON,
                      }
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={clx(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                        showPickupOptions === PICKUP_OPTION_ON
                          ? "border-stone-800"
                          : "border-stone-300"
                      )}>
                        {showPickupOptions === PICKUP_OPTION_ON && (
                          <div className="w-2.5 h-2.5 rounded-full bg-stone-800" />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin size={18} className="text-stone-600" />
                        <span className="font-medium text-stone-800">Abholung</span>
                      </div>
                    </div>
                    <span className="text-stone-600">-</span>
                  </Radio>
                </RadioGroup>
              )}

              {/* Shipping Methods */}
              <RadioGroup
                value={shippingMethodId}
                onChange={(v) => v && handleSetShippingMethod(v, "shipping")}
              >
                {_shippingMethods?.map((option) => {
                  const isDisabled =
                    option.price_type === "calculated" &&
                    !isLoadingPrices &&
                    typeof calculatedPricesMap[option.id] !== "number"

                  return (
                    <Radio
                      key={option.id}
                      value={option.id}
                      data-testid="delivery-option-radio"
                      disabled={isDisabled}
                      className={clx(
                        "flex items-center justify-between p-4 border rounded-xl transition-all",
                        {
                          "border-stone-800 bg-stone-50": option.id === shippingMethodId,
                          "border-stone-200 hover:border-stone-300 cursor-pointer": !isDisabled && option.id !== shippingMethodId,
                          "border-stone-200 opacity-50 cursor-not-allowed": isDisabled,
                        }
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={clx(
                          "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                          option.id === shippingMethodId
                            ? "border-stone-800"
                            : "border-stone-300"
                        )}>
                          {option.id === shippingMethodId && (
                            <div className="w-2.5 h-2.5 rounded-full bg-stone-800" />
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Truck size={18} className="text-stone-600" />
                          <span className="font-medium text-stone-800">{option.name}</span>
                        </div>
                      </div>
                      <span className="font-medium text-stone-800">
                        {option.price_type === "flat" ? (
                          convertToLocale({
                            amount: option.amount!,
                            currency_code: cart?.currency_code,
                          })
                        ) : calculatedPricesMap[option.id] ? (
                          convertToLocale({
                            amount: calculatedPricesMap[option.id],
                            currency_code: cart?.currency_code,
                          })
                        ) : isLoadingPrices ? (
                          <Spinner className="w-4 h-4" />
                        ) : (
                          "-"
                        )}
                      </span>
                    </Radio>
                  )
                })}
              </RadioGroup>
            </div>
          </div>

          {/* Pickup Locations */}
          {showPickupOptions === PICKUP_OPTION_ON && (
            <div className="pt-4 border-t border-stone-200">
              <p className="text-sm text-stone-600 mb-4">
                Wählen Sie einen Abholort
              </p>
              <RadioGroup
                value={shippingMethodId}
                onChange={(v) => v && handleSetShippingMethod(v, "pickup")}
                className="space-y-3"
              >
                {_pickupMethods?.map((option) => (
                  <Radio
                    key={option.id}
                    value={option.id}
                    disabled={option.insufficient_inventory}
                    data-testid="delivery-option-radio"
                    className={clx(
                      "flex items-start justify-between p-4 border rounded-xl transition-all",
                      {
                        "border-stone-800 bg-stone-50": option.id === shippingMethodId,
                        "border-stone-200 hover:border-stone-300 cursor-pointer": !option.insufficient_inventory && option.id !== shippingMethodId,
                        "border-stone-200 opacity-50 cursor-not-allowed": option.insufficient_inventory,
                      }
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={clx(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5",
                        option.id === shippingMethodId
                          ? "border-stone-800"
                          : "border-stone-300"
                      )}>
                        {option.id === shippingMethodId && (
                          <div className="w-2.5 h-2.5 rounded-full bg-stone-800" />
                        )}
                      </div>
                      <div>
                        <span className="font-medium text-stone-800">{option.name}</span>
                        <p className="text-sm text-stone-500 mt-0.5">
                          {formatAddress(option.service_zone?.fulfillment_set?.location?.address)}
                        </p>
                      </div>
                    </div>
                    <span className="font-medium text-stone-800">
                      {convertToLocale({
                        amount: option.amount ?? 0,
                        currency_code: cart?.currency_code,
                      })}
                    </span>
                  </Radio>
                ))}
              </RadioGroup>
            </div>
          )}

          <div>
            <ErrorMessage error={error} data-testid="delivery-option-error-message" />
            <Button
              className="w-full h-12 text-base"
              onClick={handleSubmit}
              isLoading={isLoading}
              disabled={!cart.shipping_methods?.[0]}
              data-testid="submit-delivery-option-button"
            >
              Weiter zur Zahlung
            </Button>
          </div>
        </div>
      ) : (
        <div>
          {cart && (cart.shipping_methods?.length ?? 0) > 0 && (
            <div className="flex items-center gap-3">
              <Truck size={18} className="text-stone-400" />
              <div>
                <p className="text-sm font-medium text-stone-800">
                  {cart.shipping_methods!.at(-1)!.name}
                </p>
                <p className="text-sm text-stone-600">
                  {convertToLocale({
                    amount: cart.shipping_methods!.at(-1)!.amount ?? 0,
                    currency_code: cart?.currency_code,
                  })}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Shipping
