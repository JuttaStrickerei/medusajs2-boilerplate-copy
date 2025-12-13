import { Metadata } from "next"
import { notFound } from "next/navigation"

import AddressBook from "@modules/account/components/address-book"

import { getRegion } from "@lib/data/regions"
import { retrieveCustomer } from "@lib/data/customer"

export const metadata: Metadata = {
  title: "Adressen",
  description: "Ihre gespeicherten Adressen",
}

export default async function Addresses(props: {
  params: Promise<{ countryCode: string }>
}) {
  const params = await props.params
  const { countryCode } = params
  const customer = await retrieveCustomer()
  const region = await getRegion(countryCode)

  if (!customer || !region) {
    notFound()
  }

  return (
    <div className="p-6 small:p-8" data-testid="addresses-page-wrapper">
      <div className="mb-8">
        <h1 className="font-serif text-2xl font-medium text-stone-800 mb-2">Lieferadressen</h1>
        <p className="text-stone-600">
          Verwalten Sie Ihre Lieferadressen. Gespeicherte Adressen stehen Ihnen 
          beim Checkout zur Verfügung.
        </p>
      </div>
      <AddressBook customer={customer} region={region} />
    </div>
  )
}
