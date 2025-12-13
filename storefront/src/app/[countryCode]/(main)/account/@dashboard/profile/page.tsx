import { Metadata } from "next"

import ProfilePhone from "@modules/account/components/profile-phone"
import ProfileBillingAddress from "@modules/account/components/profile-billing-address"
import ProfileEmail from "@modules/account/components/profile-email"
import ProfileName from "@modules/account/components/profile-name"
import ProfilePassword from "@modules/account/components/profile-password"

import { notFound } from "next/navigation"
import { listRegions } from "@lib/data/regions"
import { retrieveCustomer } from "@lib/data/customer"

export const metadata: Metadata = {
  title: "Profil",
  description: "Sehen und bearbeiten Sie Ihr Profil.",
}

export default async function Profile() {
  const customer = await retrieveCustomer()
  const regions = await listRegions()

  if (!customer || !regions) {
    notFound()
  }

  return (
    <div className="p-6 small:p-8" data-testid="profile-page-wrapper">
      <div className="mb-8">
        <h1 className="font-serif text-2xl font-medium text-stone-800 mb-2">Profil</h1>
        <p className="text-stone-600">
          Sehen und aktualisieren Sie Ihre Profilinformationen, einschließlich Name, 
          E-Mail und Telefonnummer. Sie können auch Ihre Rechnungsadresse aktualisieren.
        </p>
      </div>
      <div className="flex flex-col gap-y-6 w-full">
        <ProfileName customer={customer} />
        <Divider />
        <ProfileEmail customer={customer} />
        <Divider />
        <ProfilePhone customer={customer} />
        <Divider />
        <ProfileBillingAddress customer={customer} regions={regions} />
      </div>
    </div>
  )
}

const Divider = () => {
  return <div className="w-full h-px bg-stone-200" />
}
