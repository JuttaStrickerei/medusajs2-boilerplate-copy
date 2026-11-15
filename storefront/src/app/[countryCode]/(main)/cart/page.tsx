import { retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import { getShippingPreview } from "@lib/data/fulfillment"
import { readAddedParams } from "@lib/util/added-to-cart"
import CartTemplate from "@modules/cart/templates"
import { Metadata } from "next"
import { notFound } from "next/navigation"

export const metadata: Metadata = {
  title: "Warenkorb",
  description: "Ihr Warenkorb bei der Strickerei Jutta.",
  robots: { index: false, follow: false },
}

export default async function Cart(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  // Kommt die Kundin gerade von „In den Warenkorb“, steht in der Adresse, was dazukam
  const added = readAddedParams(await props.searchParams)

  const cart = await retrieveCart().catch((error) => {
    console.error(error)
    return notFound()
  })

  const customer = await retrieveCustomer()

  const shippingPreview = cart?.items?.length
    ? await getShippingPreview(cart.id)
    : null

  return (
    <CartTemplate
      cart={cart}
      customer={customer}
      shippingPreview={shippingPreview}
      added={added}
    />
  )
}
