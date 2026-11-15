"use client"

import PaymentMethods from "@modules/common/components/payment-methods"
import { usePathname } from "next/navigation"

/** Zahlungsarten in der Fußzeile. Im Warenkorb stehen sie schon am Kassen-Knopf, dort nicht doppelt. */
export default function FooterPayments() {
  const pathname = usePathname() || ""
  if (/\/cart(\/|$)/.test(pathname)) return null

  return <PaymentMethods dark large label="Zahlungsarten" className="justify-center mb-5" />
}
