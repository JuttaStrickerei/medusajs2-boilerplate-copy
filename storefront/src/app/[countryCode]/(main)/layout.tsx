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

export default async function PageLayout(props: { children: React.ReactNode }) {
  const customer = await retrieveCustomer()
  const cart = await retrieveCart()

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
      <NewsletterTeaser isLoggedIn={!!customer} />
      <VoucherLink />
      <Toaster />
    </>
  )
}
