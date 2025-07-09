import { Metadata } from "next"
import { notFound } from "next/navigation"

import AddressBook from "@modules/account/components/address-book"

import { headers } from "next/headers"
import { getRegion } from "@lib/data/regions"
import { getCustomer } from "@lib/data/customer"

import { useTranslations } from "next-intl"
import { title } from "process"
import { Description } from "@headlessui/react/dist/components/description/description"
import { getTranslations } from "next-intl/server"

export async function genereateMetadata() {
  const t = await getTranslations("account")
  return {
    title: t("addresses"), 
    description: t("view_your_addresses"),
  }
}

export default async function Addresses({
  params,
}: {
  params: { countryCode: string }
}) {
  // 2. Get translation function for the component
  const t = await getTranslations("account");
  const { countryCode } = params;
  const customer = await getCustomer();
  const region = await getRegion(countryCode);

  if (!customer || !region) {
    notFound()
  }

  return (
    <div className="w-full" data-testid="addresses-page-wrapper">
      <div className="mb-8 flex flex-col gap-y-4">
        {/* 3. Use translations for page content */}
        <h1 className="text-2xl-semi">{t("addresses")}</h1>
        <p className="text-base-regular">
          {t("addresses_page_hint")}
        </p>
      </div>
      <AddressBook customer={customer} region={region} />
    </div>
  )
}