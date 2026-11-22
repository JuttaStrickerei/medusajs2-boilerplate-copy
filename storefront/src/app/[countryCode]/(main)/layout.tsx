import { Metadata } from "next"

import { retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import { getBaseURL } from "@lib/util/env"
import { Toaster } from "@medusajs/ui"
import CartMismatchBanner from "@modules/layout/components/cart-mismatch-banner"
import CartReminder from "@modules/layout/components/cart-reminder"
import Footer from "@modules/layout/templates/footer"
import Nav from "@modules/layout/templates/nav"
import NewsletterTeaser from "@modules/layout/components/newsletter-teaser"
import VoucherLink from "@modules/layout/components/voucher-link"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
}

// Das Newsletter-Kärtchen am Rand („10 % auf Ihre erste Bestellung“) ist ausgeschaltet,
// solange NEXT_PUBLIC_NEWSLETTER_POPUP nicht auf "1" steht. Die Formulare auf der
// Startseite und in der Fußzeile hängen nicht an diesem Schalter. Der Wert wird beim
// Bauen eingesetzt: nach dem Setzen der Variable neu bauen (Railway macht das von selbst).
const NEWSLETTER_POPUP_ON = process.env.NEXT_PUBLIC_NEWSLETTER_POPUP === "1"

export default async function PageLayout(props: { children: React.ReactNode }) {
  // Parallel statt nacheinander: Die beiden Abfragen hängen nicht voneinander ab
  const [customer, cart] = await Promise.all([
    retrieveCustomer(),
    retrieveCart(),
  ])

  return (
    <>
      <Nav />
      {/* Wer mit gefülltem Warenkorb wiederkommt, sieht ihn gleich unter dem Kopf */}
      <CartReminder
        initialItems={(cart?.items ?? []).map((item) => ({
          title: item.product_title ?? item.title ?? "",
          quantity: item.quantity,
        }))}
      />
      {customer && cart && (
        <CartMismatchBanner customer={customer} cart={cart} />
      )}

      {props.children}
      <Footer />
      {NEWSLETTER_POPUP_ON && <NewsletterTeaser isLoggedIn={!!customer} />}
      <VoucherLink />
      <Toaster />
    </>
  )
}
