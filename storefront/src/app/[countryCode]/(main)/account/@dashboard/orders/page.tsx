import { Metadata } from "next"

import OrderOverview from "@modules/account/components/order-overview"
import { notFound } from "next/navigation"
import { listOrders } from "@lib/data/orders"
import TransferRequestForm from "@modules/account/components/transfer-request-form"

export const metadata: Metadata = {
  title: "Bestellungen",
  description: "Übersicht Ihrer bisherigen Bestellungen.",
}

export default async function Orders() {
  const orders = await listOrders()

  if (!orders) {
    notFound()
  }

  return (
    <div className="p-6 small:p-8" data-testid="orders-page-wrapper">
      <div className="mb-8">
        <h1 className="font-serif text-2xl font-medium text-stone-800 mb-2">Bestellungen</h1>
        <p className="text-stone-600">
          Sehen Sie Ihre bisherigen Bestellungen und deren Status ein. 
          Bei Bedarf können Sie auch Rücksendungen veranlassen.
        </p>
      </div>
      <div>
        <OrderOverview orders={orders} />
        <div className="my-8 h-px bg-stone-200" />
        <TransferRequestForm />
      </div>
    </div>
  )
}
