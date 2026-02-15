"use client"

import { setAddresses } from "@lib/data/cart"
import compareAddresses from "@lib/util/compare-addresses"
import { HttpTypes } from "@medusajs/types"
import { useToggleState } from "@medusajs/ui"
import Spinner from "@modules/common/icons/spinner"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useActionState } from "react"
import BillingAddress from "../billing_address"
import ErrorMessage from "../error-message"
import ShippingAddress from "../shipping-address"
import { SubmitButton } from "../submit-button"
import { CheckCircle, MapPin, Phone, Mail } from "@components/icons"

const Addresses = ({
  cart,
  customer,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
}) => {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const checkoutStep = searchParams.get("step")
  // FIX: Keep the address section open on initial checkout load, even when no explicit step query exists.
  const isOpen = !checkoutStep || checkoutStep === "address"

  const { state: sameAsBilling, toggle: toggleSameAsBilling } = useToggleState(
    cart?.shipping_address && cart?.billing_address
      ? compareAddresses(cart?.shipping_address, cart?.billing_address)
      : true
  )

  const handleEdit = () => {
    router.push(pathname + "?step=address")
  }

  const [message, formAction] = useActionState(setAddresses, null)

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`
            w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
            ${!isOpen && cart?.shipping_address
              ? "bg-green-100 text-green-600"
              : "bg-stone-800 text-white"
            }
          `}>
            {!isOpen && cart?.shipping_address ? (
              <CheckCircle size={18} />
            ) : (
              "1"
            )}
          </div>
          <h3 className="font-serif text-lg font-medium text-stone-800">
            Lieferadresse
          </h3>
        </div>
        {!isOpen && cart?.shipping_address && (
          <button
            onClick={handleEdit}
            className="text-sm font-medium text-stone-600 hover:text-stone-800 transition-colors underline underline-offset-4"
            data-testid="edit-address-button"
          >
            Bearbeiten
          </button>
        )}
      </div>

      {isOpen ? (
        <form action={formAction}>
          <div className="space-y-6">
            <ShippingAddress
              customer={customer}
              checked={sameAsBilling}
              onChange={toggleSameAsBilling}
              cart={cart}
            />

            {!sameAsBilling && (
              <div className="pt-6 border-t border-stone-200">
                <h4 className="font-medium text-stone-800 mb-4">
                  Rechnungsadresse
                </h4>
                <BillingAddress cart={cart} />
              </div>
            )}

            <SubmitButton 
              className="w-full h-12 text-base" 
              data-testid="submit-address-button"
            >
              Weiter zur Lieferung
            </SubmitButton>
            <ErrorMessage error={message} data-testid="address-error-message" />
          </div>
        </form>
      ) : (
        <div>
          {cart && cart.shipping_address ? (
            <div className="grid grid-cols-1 small:grid-cols-3 gap-6">
              {/* Shipping Address */}
              <div data-testid="shipping-address-summary">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin size={16} className="text-stone-400" />
                  <span className="text-sm font-medium text-stone-800">
                    Lieferadresse
                  </span>
                </div>
                <div className="text-sm text-stone-600 space-y-0.5">
                  <p>
                    {cart.shipping_address.first_name}{" "}
                    {cart.shipping_address.last_name}
                  </p>
                  <p>
                    {cart.shipping_address.address_1}
                    {cart.shipping_address.address_2 && `, ${cart.shipping_address.address_2}`}
                  </p>
                  <p>
                    {cart.shipping_address.postal_code} {cart.shipping_address.city}
                  </p>
                  <p className="uppercase">
                    {cart.shipping_address.country_code}
                  </p>
                </div>
              </div>

              {/* Contact */}
              <div data-testid="shipping-contact-summary">
                <div className="flex items-center gap-2 mb-2">
                  <Phone size={16} className="text-stone-400" />
                  <span className="text-sm font-medium text-stone-800">
                    Kontakt
                  </span>
                </div>
                <div className="text-sm text-stone-600 space-y-0.5">
                  {cart.shipping_address.phone && (
                    <p>{cart.shipping_address.phone}</p>
                  )}
                  <p className="flex items-center gap-1">
                    <Mail size={14} className="text-stone-400" />
                    {cart.email}
                  </p>
                </div>
              </div>

              {/* Billing Address */}
              <div data-testid="billing-address-summary">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin size={16} className="text-stone-400" />
                  <span className="text-sm font-medium text-stone-800">
                    Rechnungsadresse
                  </span>
                </div>
                <div className="text-sm text-stone-600 space-y-0.5">
                  {sameAsBilling ? (
                    <p className="italic">Identisch mit Lieferadresse</p>
                  ) : (
                    <>
                      <p>
                        {cart.billing_address?.first_name}{" "}
                        {cart.billing_address?.last_name}
                      </p>
                      <p>
                        {cart.billing_address?.address_1}
                        {cart.billing_address?.address_2 && `, ${cart.billing_address.address_2}`}
                      </p>
                      <p>
                        {cart.billing_address?.postal_code} {cart.billing_address?.city}
                      </p>
                      <p className="uppercase">
                        {cart.billing_address?.country_code}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <Spinner />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Addresses
