import { 
  AbstractFulfillmentProviderService,
  MedusaError
} from "@medusajs/framework/utils"
import { 
  FulfillmentItemDTO,
  FulfillmentOrderDTO,
  CreateFulfillmentResult,
  FulfillmentOption
} from "@medusajs/framework/types"
import { SendcloudClient } from "./client"

export type SendcloudOptions = {
  public_key: string
  secret_key: string
}

class SendcloudFulfillmentProviderService extends AbstractFulfillmentProviderService {
  static identifier = "sendcloud"
  protected client_: SendcloudClient
  protected options_: SendcloudOptions

  constructor(container, options: SendcloudOptions) {
    super()
    this.options_ = options
    this.client_ = new SendcloudClient(options)
    
    if (process.env.NODE_ENV === 'development') {
      // Only test connection in development
      this.client_.testConnection()
        .then((success) => {
          if (!success) {
            console.error("Failed to connect to Sendcloud")
          }
        })
    }
  }

  async getFulfillmentOptions(): Promise<FulfillmentOption[]> {
    try {
      console.log("Fetching shipping methods from Sendcloud...")
  
      const response = await this.client_.getShippingMethods({
        from_country: "NL", // TODO: Make configurable
        to_country: "DE"    // TODO: Make configurable
      })
  
      console.log(`Successfully received ${response.shipping_methods.length} shipping methods from Sendcloud.`)
  
      const shippingOptions = response.shipping_methods.map(method => ({
        id: `sendcloud_${method.id}`,
        name: method.name,
        provider_id: "sendcloud",
        data: {
          carrier: method.carrier,
          min_weight: method.min_weight,
          max_weight: method.max_weight,
          sendcloud_id: method.id,
          countries: method.countries
        }
      }))
  
      console.log(`Created ${shippingOptions.length} fulfillment options from the shipping methods.`)
  
      return shippingOptions
    } catch (error) {
      console.error("Error fetching Sendcloud shipping methods:", error)
      return []
    }
  }

  async validateOption(data: Record<string, unknown>): Promise<boolean> {
    // Ensure the shipping method exists and is valid
    const shippingMethods = await this.getFulfillmentOptions()
    return shippingMethods.some(method => method.id === data.id)
  }

  async validateFulfillmentData(
    optionData: Record<string, unknown>, 
    data: Record<string, unknown>, 
    context: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    return {
      ...optionData,
      ...data
    }
  }

  async createFulfillment(
    data: Record<string, unknown>,
    items: Partial<Omit<FulfillmentItemDTO, "fulfillment">>[],
    order: Partial<FulfillmentOrderDTO> | undefined,
    fulfillment: Record<string, unknown>
  ): Promise<CreateFulfillmentResult> {
    if (!order?.shipping_address) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Shipping address is required for creating Sendcloud parcel"
      )
    }

    // Extract sendcloud_id from the fulfillment data
    const sendcloudMethodId = (data.data as Record<string, unknown>)?.sendcloud_id
    if (!sendcloudMethodId) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Sendcloud shipping method ID is required"
      )
    }

    try {
      // Log items for debugging
      console.log("Items to fulfill:", 
        items.map(item => ({
          line_item: (item as any)?.line_item,
          quantity: item.quantity
        }))
      )

      // Calculate total weight in kg with detailed logging
      // Inside your async createFulfillment (or wherever needed)...
      console.log("Starting weight calculation...");

      const totalWeight = Math.max(
        items.reduce((sum, item) => {
          // 1) Find the matching order item
          const orderItem = order?.items?.find((i) => i.id === item.line_item_id)
          
          // 2) Log the entire structure for debugging
          console.log("Full order item structure:", JSON.stringify(orderItem, null, 2))

          if (!orderItem) {
            console.warn(`No matching order item for line_item_id=${item.line_item_id}. Skipping...`);
            return sum;
          }

          // 3) Safely convert the weight to a number
          //    (Adjust the property path if your logs show the weight is stored elsewhere)
          const rawWeight = Number(orderItem?.variant_option_values?.weight) || 0;

          // 4) Use quantity (fallback to 1 if undefined)
          const quantity = item.quantity || 1;

          // 5) Log the item-level calculation
          console.log("Item weight calculation:", {
            rawWeight,
            quantity,
            weightInKg: rawWeight / 1000,
            contributionToTotal: (rawWeight / 1000) * quantity,
          });

          // 6) Accumulate the sum in kg
          return sum + (rawWeight / 1000) * quantity;
        }, 0),
        0.00099 // fallback if the sum is 0
      ).toFixed(3);

console.log(`Calculated totalWeight in kg => ${totalWeight}`);
console.log("Weight calculation finished.");

      // Validate required address fields
      if (!order.shipping_address.address_1 || 
          !order.shipping_address.city || 
          !order.shipping_address.postal_code || 
          !order.shipping_address.country_code) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Missing required address fields"
        )
      }

      // Ensure country code is uppercase
      const countryCode = order.shipping_address.country_code.toUpperCase()

      const parcelData = {
        parcel: {
          name: `${order.shipping_address.first_name || ''} ${order.shipping_address.last_name || ''}`.trim(),
          address: order.shipping_address.address_1,
          house_number: order.shipping_address.address_2 || "0", // Sendcloud requires a house number
          city: order.shipping_address.city,
          postal_code: order.shipping_address.postal_code,
          telephone: order.shipping_address.phone || undefined,
          email: order.email || undefined,
          country: countryCode,
          shipment: {
            id: Number(sendcloudMethodId)
          },
          weight: totalWeight,
          order_number: order.id || '',
          request_label: false
        }
      }

      console.log("Sending parcel data to Sendcloud:", JSON.stringify(parcelData, null, 2))

      const response = await this.client_.createParcel(parcelData)

      return {
        data: {
          parcel_id: response.parcel.id,
          tracking_number: response.parcel.tracking_number,
          shipping_label: response.parcel.label?.normal_printer?.[0],
          carrier: response.parcel.carrier?.code,
          status: response.parcel.status
        },
        labels: [
          {
            tracking_number: response.parcel.tracking_number || "",
            tracking_url: "", // Since Sendcloud doesn't provide a tracking URL directly
            label_url: response.parcel.label?.normal_printer?.[0] || ""
          }
        ]
      }
    } catch (error) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Error creating Sendcloud parcel: ${error.message}`
      )
    }
  }

  async cancelFulfillment(
    fulfillment: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    console.log("Fulfillment data for cancellation:", JSON.stringify(fulfillment, null, 2))
    const fulfillmentData = fulfillment.data as Record<string, unknown> | undefined
    const parcelId = fulfillmentData?.parcel_id
    
    if (!parcelId) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "No parcel ID found in fulfillment data"
      )
    }
  
    try {
      await this.client_.cancelParcel(Number(parcelId))
      return fulfillment
    } catch (error) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Error cancelling Sendcloud parcel: ${error.message}`
      )
    }
  }
}

export default SendcloudFulfillmentProviderService

/*import { 
  AbstractFulfillmentProviderService
} from "@medusajs/framework/utils"
import { 
  FulfillmentItemDTO,
  FulfillmentOrderDTO,
  CreateFulfillmentResult,
  FulfillmentOption
} from "@medusajs/framework/types"
import { SendcloudClient } from "./client"

export type SendcloudOptions = {
  public_key: string
  secret_key: string
}

class SendcloudFulfillmentProviderService extends AbstractFulfillmentProviderService {
  static identifier = "sendcloud"
  protected client_: SendcloudClient
  protected options_: SendcloudOptions

  constructor(container, options: SendcloudOptions) {
    super()
    this.options_ = options
    this.client_ = new SendcloudClient(options)
    
    if (process.env.NODE_ENV === 'development') {
      // Only test connection in development
      this.client_.testConnection()
        .then((success) => {
          if (!success) {
            console.error("Failed to connect to Sendcloud")
          }
        })
    }
  }

  async getFulfillmentOptions(): Promise<FulfillmentOption[]> {
    try {
      console.log("Fetching shipping methods from Sendcloud...")
  
      const response = await this.client_.getShippingMethods({
        from_country: "NL", // TODO: Make configurable
        to_country: "DE"    // TODO: Make configurable
      })
  
      console.log(`Successfully received ${response.shipping_methods.length} shipping methods from Sendcloud.`)
  
      const shippingOptions = response.shipping_methods.map(method => ({
        id: `sendcloud_${method.id}`,
        name: method.name,
        provider_id: "sendcloud",
        data: {
          carrier: method.carrier,
          min_weight: method.min_weight,
          max_weight: method.max_weight,
          sendcloud_id: method.id,
          countries: method.countries
        }
      }))
  
      console.log(`Created ${shippingOptions.length} fulfillment options from the shipping methods.`)
  
      return shippingOptions
    } catch (error) {
      console.error("Error fetching Sendcloud shipping methods:", error)
      return []
    }
  }

  async validateOption(data: Record<string, unknown>): Promise<boolean> {
    // Ensure the shipping method exists and is valid
    const shippingMethods = await this.getFulfillmentOptions()
    return shippingMethods.some(method => method.id === data.id)
  }

  async validateFulfillmentData(
    optionData: Record<string, unknown>, 
    data: Record<string, unknown>, 
    context: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    return {
      ...optionData,
      ...data
    }
  }

  async createFulfillment(
    data: Record<string, unknown>,
    items: Partial<Omit<FulfillmentItemDTO, "fulfillment">>[],
    order: Partial<FulfillmentOrderDTO> | undefined,
    fulfillment: Record<string, unknown>
  ): Promise<CreateFulfillmentResult> {
    // TODO: Implement actual Sendcloud parcel creation
    return {
      data: {
        provider_id: "sendcloud",
        ...data
      },
      labels: []
    }
  }

  async cancelFulfillment(
    fulfillment: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    // TODO: Implement actual Sendcloud cancellation
    return {}
  }
}

export default SendcloudFulfillmentProviderService
*/