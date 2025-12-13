import { Metadata } from "next"
import { notFound } from "next/navigation"
import { retrieveOrder } from "@lib/data/orders"
import { listReturnReasons, listReturnShippingOptions } from "@lib/data/returns"
import ReturnRequestTemplate from "@modules/account/templates/return-request-template"

type Props = {
  params: Promise<{ id: string; countryCode: string }>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const order = await retrieveOrder(params.id).catch(() => null)
  
  return {
    title: order ? `Retoure anmelden - Bestellung #${order.display_id}` : "Retoure anmelden",
    description: "Melden Sie Ihre Retoure an und erhalten Sie ein Retourenlabel.",
  }
}

export default async function ReturnPage(props: Props) {
  const params = await props.params

  // Fetch order - this will fail if not authenticated or order doesn't exist
  const order = await retrieveOrder(params.id).catch(() => null)
  
  if (!order) {
    notFound()
  }

  // Fetch return reasons
  const returnReasons = await listReturnReasons()
  
  // Fetch return shipping options using the order's region
  let shippingOptions: Awaited<ReturnType<typeof listReturnShippingOptions>> = []
  
  if (order.region_id) {
    shippingOptions = await listReturnShippingOptions(order.region_id)
  }

  return (
    <div className="w-full p-6 small:p-8">
      <ReturnRequestTemplate
        order={order}
        shippingOptions={shippingOptions}
        returnReasons={returnReasons}
      />
    </div>
  )
}
