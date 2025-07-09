import { Metadata } from "next"

import Overview from "@modules/account/components/overview"
import { notFound } from "next/navigation"
import { getCustomer } from "@lib/data/customer"
import { listOrders } from "@lib/data/orders"

import { getTranslations } from "next-intl/server"

export async function generateMetadata() {
  const t = await getTranslations("account");
  
  return {
    title: t("title"),
    description: t("overview"),
  }
  
}

export default async function OverviewTemplate() {
  const customer = await getCustomer().catch(() => null)
  const orders = (await listOrders().catch(() => null)) || null

  if (!customer) {
    notFound()
  }

  return <Overview customer={customer} orders={orders} />
}
