import type {
  SubscriberArgs,
  SubscriberConfig,
} from "@medusajs/framework"
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * Subscriber that handles return creation events
 * When a return is created, this generates a Sendcloud return label
 */
export default async function handleReturnCreated({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const returnId = data.id

  console.log(`[ReturnCreated] Processing return: ${returnId}`)

  try {
    // Get required services
    const returnModuleService = container.resolve(Modules.ORDER)
    const fulfillmentModuleService = container.resolve(Modules.FULFILLMENT)
    const query = container.resolve(ContainerRegistrationKeys.QUERY)

    // Fetch the return with related data
    const { data: returns } = await query.graph({
      entity: "return",
      fields: [
        "id",
        "status",
        "order_id",
        "items.*",
        "items.item.*",
        "order.*",
        "order.shipping_address.*",
        "order.items.*",
      ],
      filters: {
        id: returnId,
      },
    })

    if (!returns || returns.length === 0) {
      console.log(`[ReturnCreated] Return not found: ${returnId}`)
      return
    }

    const returnData = returns[0]
    const order = returnData.order

    if (!order) {
      console.log(`[ReturnCreated] No order associated with return: ${returnId}`)
      return
    }

    console.log(`[ReturnCreated] Found return for order: ${order.id}`)

    // Check if we should create a Sendcloud return label
    // Only create if the return has shipping and is in "requested" status
    if (returnData.status !== "requested") {
      console.log(`[ReturnCreated] Return status is ${returnData.status}, skipping Sendcloud label creation`)
      return
    }

    // Get Sendcloud fulfillment provider
    let sendcloudService
    try {
      sendcloudService = container.resolve("sendcloudFulfillmentProviderService")
    } catch (e) {
      console.log(`[ReturnCreated] Sendcloud service not available, skipping return label creation`)
      return
    }

    if (!sendcloudService) {
      console.log(`[ReturnCreated] Sendcloud service not available`)
      return
    }

    // Get original fulfillment to determine shipping method
    const originalFulfillments = order.fulfillments || []
    const originalFulfillment = originalFulfillments.find(
      (f: any) => f.provider_id === "sendcloud_sendcloud"
    )

    if (!originalFulfillment) {
      console.log(`[ReturnCreated] No Sendcloud fulfillment found for order ${order.id}`)
      return
    }

    // Build return parcel data for Sendcloud
    const shippingAddress = order.shipping_address
    
    if (!shippingAddress) {
      console.log(`[ReturnCreated] No shipping address found for order ${order.id}`)
      return
    }

    // Calculate total weight from return items
    const totalWeight = returnData.items?.reduce((sum: number, item: any) => {
      const originalItem = order.items?.find((i: any) => i.id === item.item_id)
      const weight = originalItem?.variant?.weight || 500 // Default 500g
      return sum + (weight * item.quantity)
    }, 0) || 1000

    // Create return parcel data
    const returnParcelData = {
      parcel: {
        name: `${shippingAddress.first_name} ${shippingAddress.last_name}`,
        company_name: shippingAddress.company || "",
        address: shippingAddress.address_1 || "",
        address_2: shippingAddress.address_2 || "",
        house_number: "", // Parse from address if needed
        city: shippingAddress.city || "",
        postal_code: shippingAddress.postal_code || "",
        country: shippingAddress.country_code?.toUpperCase() || "AT",
        telephone: shippingAddress.phone || "",
        email: order.email || "",
        weight: Math.max(Math.round(totalWeight / 10), 1), // Convert to hectograms, min 1
        order_number: `RET-${order.display_id || order.id}`,
        is_return: true,
        request_label: true,
        // Use the same shipping method as the original order if possible
        shipping_method_checkout_name: "Return Shipping",
      },
    }

    console.log(`[ReturnCreated] Creating Sendcloud return parcel for order ${order.id}`)

    // Create the return parcel in Sendcloud
    try {
      const sendcloudResult = await sendcloudService.createParcel(returnParcelData)
      
      if (sendcloudResult && sendcloudResult.parcel) {
        console.log(`[ReturnCreated] Sendcloud return parcel created: ${sendcloudResult.parcel.id}`)
        
        // Store the return label info in the return metadata
        // Note: This would need a custom approach since Medusa v2 returns 
        // don't have direct metadata support out of the box
        
        // Log the label URL for now
        if (sendcloudResult.parcel.label?.normal_printer?.[0]) {
          console.log(`[ReturnCreated] Return label URL: ${sendcloudResult.parcel.label.normal_printer[0]}`)
        }
        
        if (sendcloudResult.parcel.tracking_number) {
          console.log(`[ReturnCreated] Return tracking number: ${sendcloudResult.parcel.tracking_number}`)
        }

        // TODO: Send email to customer with return label
        // This would integrate with your notification service
      }
    } catch (sendcloudError: any) {
      console.error(`[ReturnCreated] Failed to create Sendcloud return parcel:`, sendcloudError)
      // Don't throw - we don't want to fail the return creation
    }

  } catch (error) {
    console.error(`[ReturnCreated] Error processing return ${returnId}:`, error)
  }
}

export const config: SubscriberConfig = {
  event: "return.created",
}

