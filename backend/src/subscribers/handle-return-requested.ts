import {
  type SubscriberArgs,
  type SubscriberConfig,
} from "@medusajs/framework"
import { Modules, OrderWorkflowEvents } from "@medusajs/framework/utils"
import { SendcloudClient } from "../modules/sendcloud/client"

/**
 * Subscriber that enriches return fulfillments with order data
 * AND updates the Sendcloud parcel with correct customer information
 * 
 * This is necessary because:
 * 1. The Sendcloud provider is called BEFORE we have order data
 * 2. So the parcel is created with placeholder data
 * 3. This subscriber runs AFTER the fulfillment is created
 * 4. We fetch the real order data and UPDATE the Sendcloud parcel
 */
export default async function returnFulfillmentEnricher({
  event: { data },
  container,
}: SubscriberArgs<{ order_id: string; return_id: string }>) {
  try {
    const query = container.resolve("query")
    const fulfillmentService = container.resolve(Modules.FULFILLMENT)

    // Wait briefly for fulfillment to be created and linked by the workflow
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Step 1: Query order data
    const { data: orders } = await query.graph({
      entity: "order",
      fields: [
        "id",
        "display_id",
        "email",
        "currency_code",
        "shipping_address.first_name",
        "shipping_address.last_name",
        "shipping_address.address_1",
        "shipping_address.address_2",
        "shipping_address.city",
        "shipping_address.country_code",
        "shipping_address.postal_code",
        "shipping_address.province",
        "shipping_address.phone",
        "shipping_address.company",
        "items.id",
        "items.title",
        "items.sku",
        "items.quantity",
        "items.unit_price",
        "items.variant.id",
        "items.variant.sku",
        "items.variant.title",
        "items.variant.weight",
        "items.variant.hs_code",
        "items.variant.origin_country",
        "customer.id",
        "customer.email",
        "customer.first_name",
        "customer.last_name",
      ],
      filters: { id: data.order_id },
    })

    if (!orders || orders.length === 0) {
      console.error("[ReturnEnricher] Order not found:", data.order_id)
      return
    }

    const order = orders[0]

    // Step 2: Find the fulfillment linked to this return
    let fulfillmentId: string | null = null
    let attempts = 0
    const maxAttempts = 6

    while (!fulfillmentId && attempts < maxAttempts) {
      try {
        const { data: returns } = await query.graph({
          entity: "return",
          fields: ["id", "fulfillments.*"],
          filters: { id: data.return_id },
        })

        if (returns && returns.length > 0 && returns[0].fulfillments) {
          const fulfillments = returns[0].fulfillments
          if (fulfillments && fulfillments.length > 0 && fulfillments[0]) {
            fulfillmentId = fulfillments[0].id
            break
          }
        }
      } catch (queryError) {
        console.error("[ReturnEnricher] Query error on attempt", attempts + 1, ":", (queryError as Error).message)
      }

      attempts++
      if (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1500))
      }
    }

    if (!fulfillmentId) {
      console.error("[ReturnEnricher] No fulfillment found after", maxAttempts, "attempts")
      return
    }

    // Step 3: Retrieve the fulfillment with its data
    const fulfillment = await fulfillmentService.retrieveFulfillment(fulfillmentId, {
      relations: ["shipping_option", "delivery_address"],
    })

    if (!fulfillment) {
      console.error("[ReturnEnricher] Fulfillment not found:", fulfillmentId)
      return
    }

    // Step 4: Update fulfillment data with order information
    const enrichedData = {
      ...(fulfillment.data || {}),
      order: order,
      enriched_at: new Date().toISOString(),
      enriched_by: "return-fulfillment-enricher",
    }

    await fulfillmentService.updateFulfillment(fulfillmentId, {
      data: enrichedData,
    })

    // Step 5: UPDATE SENDCLOUD PARCEL with correct customer data, THEN request label
    const parcelId = (fulfillment.data as any)?.parcel_id
    
    if (parcelId) {
      try {
        const sendcloudClient = new SendcloudClient({
          public_key: process.env.SENDCLOUD_PUBLIC_KEY || "",
          secret_key: process.env.SENDCLOUD_SECRET_KEY || "",
        })

        const customerAddress = order.shipping_address
        const senderName = `${customerAddress?.first_name || ""} ${customerAddress?.last_name || ""}`.trim() || "Customer"

        // Step 5a: Update the parcel with correct "from" (customer) data
        const updateData = {
          from_name: senderName,
          from_company_name: customerAddress?.company || undefined,
          from_address_1: customerAddress?.address_1 || "",
          from_house_number: customerAddress?.address_2 || "0",
          from_city: customerAddress?.city || "",
          from_postal_code: customerAddress?.postal_code || "",
          from_country: customerAddress?.country_code?.toUpperCase() || "DE",
          from_email: order.email || "",
          from_telephone: customerAddress?.phone || "",
          order_number: String((order as any).display_id || order.id),
        }

        await sendcloudClient.updateParcel(Number(parcelId), updateData)

        // Step 5b: NOW request the label (this announces the parcel)
        const labelResponse = await sendcloudClient.requestLabel(Number(parcelId))
        const updatedParcel = labelResponse.parcel

        // Step 5c: Update fulfillment with the new label data
        const trackingNumber = updatedParcel.tracking_number || ""
        const trackingUrl = updatedParcel.tracking_url || ""
        const proxyLabelUrl = `/admin/sendcloud/labels/${parcelId}`

        const updatedFulfillmentData = {
          ...(fulfillment.data || {}),
          order: order,
          tracking_number: trackingNumber,
          tracking_url: trackingUrl,
          label_url: proxyLabelUrl,
          sendcloud_label_url: updatedParcel.label?.normal_printer?.[0],
          enriched_at: new Date().toISOString(),
          enriched_by: "return-fulfillment-enricher",
          sendcloud_announced: true,
        }

        await fulfillmentService.updateFulfillment(fulfillmentId, {
          data: updatedFulfillmentData,
          labels: [
            {
              tracking_number: trackingNumber,
              tracking_url: trackingUrl,
              label_url: proxyLabelUrl,
            },
          ],
        })

      } catch (sendcloudError) {
        console.error("[ReturnEnricher] Failed to update/announce Sendcloud parcel:", (sendcloudError as Error).message)
      }
    }

  } catch (error) {
    console.error("[ReturnEnricher] Error enriching fulfillment:", (error as Error).message)
  }
}

export const config: SubscriberConfig = {
  event: OrderWorkflowEvents.RETURN_REQUESTED,
}
