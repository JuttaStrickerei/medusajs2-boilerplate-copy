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
  console.log("[ReturnEnricher] ====== SUBSCRIBER TRIGGERED ======")
  console.log("[ReturnEnricher] Event data:", JSON.stringify(data, null, 2))

  try {
    const query = container.resolve("query")
    const fulfillmentService = container.resolve(Modules.FULFILLMENT)

    // Get backend URL for constructing full label URLs
    const backendUrl = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"

    // Wait for fulfillment to be created and linked by the workflow
    console.log("[ReturnEnricher] Waiting 3s for workflow to complete...")
    await new Promise(resolve => setTimeout(resolve, 3000))

    // Step 1: Query order data with extended product info
    console.log("[ReturnEnricher] Querying order:", data.order_id)
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
        "items.thumbnail",
        "items.variant.id",
        "items.variant.sku",
        "items.variant.title",
        "items.variant.weight",
        "items.variant.hs_code",
        "items.variant.origin_country",
        "items.variant.product.id",
        "items.variant.product.handle",
        "items.variant.product.thumbnail",
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

    const order = orders[0] as any // Type assertion for extended fields
    console.log("[ReturnEnricher] Found order:", order.id, "display_id:", order.display_id)

    // Step 2: Find the fulfillment linked to this return
    console.log("[ReturnEnricher] Searching for fulfillment linked to return:", data.return_id)
    let fulfillmentId: string | null = null
    let parcelId: number | null = null
    let attempts = 0
    const maxAttempts = 10 // Increased attempts

    while (!fulfillmentId && attempts < maxAttempts) {
      try {
        const { data: returns } = await query.graph({
          entity: "return",
          fields: ["id", "status", "fulfillments.*", "fulfillments.data"],
          filters: { id: data.return_id },
        })

        console.log(`[ReturnEnricher] Attempt ${attempts + 1}/${maxAttempts} - Return status:`, returns?.[0]?.status)

        if (returns && returns.length > 0) {
          const returnData = returns[0]
          const fulfillments = returnData.fulfillments
          
          console.log(`[ReturnEnricher] Found ${fulfillments?.length || 0} fulfillments`)
          
          if (fulfillments && fulfillments.length > 0 && fulfillments[0]) {
            const ff = fulfillments[0]
            fulfillmentId = ff.id
            
            // Try to get parcel_id from fulfillment data
            const ffData = (ff.data as Record<string, any>) || {}
            parcelId = ffData.parcel_id ? Number(ffData.parcel_id) : null
            
            console.log(`[ReturnEnricher] Found fulfillment: ${fulfillmentId}, parcel_id: ${parcelId}`)
            break
          }
        }
      } catch (queryError) {
        console.error("[ReturnEnricher] Query error on attempt", attempts + 1, ":", (queryError as Error).message)
      }

      attempts++
      if (attempts < maxAttempts) {
        console.log(`[ReturnEnricher] Waiting 2s before retry...`)
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }

    if (!fulfillmentId) {
      console.error("[ReturnEnricher] No fulfillment found after", maxAttempts, "attempts")
      return
    }

    // Step 3: Retrieve the fulfillment with its data
    console.log("[ReturnEnricher] Retrieving fulfillment details:", fulfillmentId)
    const fulfillment = await fulfillmentService.retrieveFulfillment(fulfillmentId, {
      relations: ["shipping_option", "delivery_address"],
    })

    if (!fulfillment) {
      console.error("[ReturnEnricher] Fulfillment not found:", fulfillmentId)
      return
    }

    // Get parcel_id from fulfillment data if not already found
    if (!parcelId && (fulfillment.data as any)?.parcel_id) {
      parcelId = Number((fulfillment.data as any).parcel_id)
    }

    console.log("[ReturnEnricher] Fulfillment data:", JSON.stringify(fulfillment.data, null, 2))
    console.log("[ReturnEnricher] Parcel ID:", parcelId)

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
    console.log("[ReturnEnricher] Updated fulfillment with order data")

    // Step 5: UPDATE SENDCLOUD PARCEL with correct customer data, THEN request label
    if (parcelId) {
      console.log("[ReturnEnricher] Updating Sendcloud parcel:", parcelId)
      
      try {
        const sendcloudClient = new SendcloudClient({
          public_key: process.env.SENDCLOUD_PUBLIC_KEY || "",
          secret_key: process.env.SENDCLOUD_SECRET_KEY || "",
        })

        const customerAddress = order.shipping_address
        const senderName = `${customerAddress?.first_name || ""} ${customerAddress?.last_name || ""}`.trim() || "Customer"

        console.log("[ReturnEnricher] Customer name:", senderName)
        console.log("[ReturnEnricher] Customer address:", customerAddress?.address_1, customerAddress?.postal_code, customerAddress?.city)

        // Step 5a: Update the parcel with correct "from" (customer) data
        // Use original order number for consistency (easier tracking for customer)
        const orderNumber = String(order.display_id || order.id)
        
        const updateData = {
          from_name: senderName,
          from_company_name: customerAddress?.company || undefined,
          from_address_1: customerAddress?.address_1 || "",
          from_house_number: customerAddress?.address_2 || "1",
          from_city: customerAddress?.city || "",
          from_postal_code: customerAddress?.postal_code || "",
          from_country: customerAddress?.country_code?.toUpperCase() || "AT",
          from_email: order.email || "",
          from_telephone: customerAddress?.phone || "",
          order_number: orderNumber, // Keep original order number
        }

        console.log("[ReturnEnricher] Sendcloud update payload:", JSON.stringify(updateData, null, 2))

        await sendcloudClient.updateParcel(parcelId, updateData)
        console.log("[ReturnEnricher] ✓ Sendcloud parcel updated with customer data")

        // Step 5b: NOW request the label (this announces the parcel)
        console.log("[ReturnEnricher] Requesting label for parcel:", parcelId)
        const labelResponse = await sendcloudClient.requestLabel(parcelId)
        const updatedParcel = labelResponse.parcel

        console.log("[ReturnEnricher] ✓ Label requested successfully")
        console.log("[ReturnEnricher] Tracking number:", updatedParcel.tracking_number)
        console.log("[ReturnEnricher] Tracking URL:", updatedParcel.tracking_url)

        // Step 5c: Update fulfillment with the new label data
        const trackingNumber = updatedParcel.tracking_number || ""
        const trackingUrl = updatedParcel.tracking_url || ""
        
        // Use FULL URL for label so admin panel can download directly
        // Use /labels/ endpoint (public, no auth required)
        const proxyLabelUrl = `${backendUrl}/labels/${parcelId}`
        
        // Also store direct Sendcloud URL as backup
        const sendcloudLabelUrl = updatedParcel.label?.normal_printer?.[0] || ""

        console.log("[ReturnEnricher] Label URL (proxy):", proxyLabelUrl)
        console.log("[ReturnEnricher] Label URL (sendcloud):", sendcloudLabelUrl)

        const updatedFulfillmentData = {
          ...(fulfillment.data || {}),
          order: order,
          parcel_id: parcelId, // Ensure parcel_id is preserved
          tracking_number: trackingNumber,
          tracking_url: trackingUrl,
          label_url: proxyLabelUrl, // Full URL for admin panel
          sendcloud_label_url: sendcloudLabelUrl, // Backup direct URL
          enriched_at: new Date().toISOString(),
          enriched_by: "return-fulfillment-enricher",
          sendcloud_announced: true,
          is_return: true,
        }

        await fulfillmentService.updateFulfillment(fulfillmentId, {
          data: updatedFulfillmentData,
          labels: [
            {
              tracking_number: trackingNumber,
              tracking_url: trackingUrl,
              label_url: proxyLabelUrl, // Full URL
            },
          ],
        })

        console.log("[ReturnEnricher] ✓ Fulfillment updated with label data")
        console.log("[ReturnEnricher] ====== SUBSCRIBER COMPLETED SUCCESSFULLY ======")

      } catch (sendcloudError) {
        console.error("[ReturnEnricher] ✗ Failed to update/announce Sendcloud parcel:", (sendcloudError as Error).message)
        console.error("[ReturnEnricher] Full error:", sendcloudError)
      }
    } else {
      console.warn("[ReturnEnricher] No parcel_id found in fulfillment data - cannot update Sendcloud")
    }

  } catch (error) {
    console.error("[ReturnEnricher] ✗ Error enriching fulfillment:", (error as Error).message)
    console.error("[ReturnEnricher] Stack:", (error as Error).stack)
  }
}

export const config: SubscriberConfig = {
  event: OrderWorkflowEvents.RETURN_REQUESTED,
}
