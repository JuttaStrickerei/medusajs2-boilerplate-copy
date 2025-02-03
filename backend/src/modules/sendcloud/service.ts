import { 
  AbstractFulfillmentProviderService
} from "@medusajs/framework/utils"
import { 
  FulfillmentItemDTO,
  FulfillmentOrderDTO,
  CreateFulfillmentResult,
  FulfillmentOption
} from "@medusajs/framework/types"
import { SendcloudClient } from "./client"


import axios from 'axios';

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
    // Extract necessary data from the order and items
    const { shipping_address, email, phone } = order as any;
    const parcelItems = items.map(item => ({
      description: item.title,
      hs_code: "6109", // Example HS code, adjust as necessary
      origin_country: "DE", // Example origin country, adjust as necessary
      product_id: item.variant_id,
      properties: {
        color: "Blue", // Example property, adjust as necessary
        size: "Medium" // Example property, adjust as necessary
      },
      quantity: item.quantity,
      sku: item.variant_sku,
      value: item.unit_price.toString(),
      weight: "0.5" // Example weight, adjust as necessary
    }));
  
    // Prepare the parcel data for SendCloud
    const parcelData = {
      parcel: {
        name: shipping_address.first_name + " " + shipping_address.last_name,
        company_name: shipping_address.company,
        email: email,
        telephone: phone,
        address: shipping_address.address_1,
        house_number: shipping_address.address_2,
        city: shipping_address.city,
        country: shipping_address.country_code,
        postal_code: shipping_address.postal_code,
        parcel_items: parcelItems,
        weight: "1.5", // Total weight, adjust as necessary
        length: "30", // Example length, adjust as necessary
        width: "20", // Example width, adjust as necessary
        height: "10", // Example height, adjust as necessary
        total_order_value: order.total.toString(),
        total_order_value_currency: order.currency_code,
        shipment: {
          id: 1316, // Example shipment ID, adjust as necessary
          name: "POST AT Connect 2-5kg to ParcelShop"
        },
        request_label: true // Set to true to immediately request a label
      }
    };
  
    // Send the request to SendCloud API
    try {
      const response = await axios.post('https://panel.sendcloud.sc/api/v2/parcels', parcelData, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${process.env.SENDCLOUD_PUBLIC_KEY}:${process.env.SENDCLOUD_SECRET_KEY}`).toString('base64')}`,
          'Content-Type': 'application/json'
        }
      });
  
      // Extract the label URL from the response
      const labelUrl = response.data.parcel.label.normal_printer[0];
  
      return {
        data: {
          provider_id: "sendcloud",
          ...data,
          parcel_id: response.data.parcel.id,
          label_url: labelUrl
        },
        labels: [labelUrl]
      };
    } catch (error) {
      console.error('Error creating parcel with SendCloud:', error);
      throw new Error('Failed to create parcel with SendCloud');
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

  /*import { 
    AbstractFulfillmentProviderService
  } from "@medusajs/framework/utils"

  import { 
    FulfillmentItemDTO,
    FulfillmentOrderDTO,
    CreateFulfillmentResult
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
      console.log("Sendcloud options received:", {
        public_key: options.public_key,
        secret_key: options.secret_key?.slice(0, 4) + "..." // Only log first 4 chars for security
      })
      
      this.options_ = options
      this.client_ = new SendcloudClient(options)
      
      // Test the connection when initializing
      this.client_.testConnection()
        .then((success) => {
          if (success) {
            console.log("Successfully connected to Sendcloud")
          } else {
            console.error("Failed to connect to Sendcloud")
          }
        })
    }
  
    async getFulfillmentOptions(): Promise<any[]> {
      try {
        // Get shipping methods from Sendcloud
        const response = await this.client_.getShippingMethods({
          from_country: "NL",  // You might want to make this configurable
          to_country: "DE"     // You might want to make this configurable
        })
    
        // Transform Sendcloud shipping methods into Medusa fulfillment options
        return response.shipping_methods.map(method => ({
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
      } catch (error) {
        console.error("Error fetching Sendcloud fulfillment options:", error)
        return [] // Return empty array on error
      }
    }
  
    async validateOption(data: Record<string, unknown>): Promise<boolean> {
      console.log("Sendcloud validateOption called!", { data })
      return true
    }
  
    async validateFulfillmentData(
      optionData: Record<string, unknown>, 
      data: Record<string, unknown>, 
      context: Record<string, unknown>
    ): Promise<Record<string, unknown>> {
      console.log("Sendcloud validateFulfillmentData called!", { optionData, data, context })
      return {}
    }
  
    async createFulfillment(
      data: Record<string, unknown>,
      items: Partial<Omit<FulfillmentItemDTO, "fulfillment">>[],
      order: Partial<FulfillmentOrderDTO> | undefined,
      fulfillment: Record<string, unknown>
    ): Promise<CreateFulfillmentResult> {
      console.log("Sendcloud createFulfillment called!", { data, items, order, fulfillment })
      return {
        data: {
          provider_id: "sendcloud",
          ...data
        },
        labels: []
      }
    }
  
    async cancelFulfillment(fulfillment: Record<string, unknown>): Promise<Record<string, unknown>> {
      console.log("Sendcloud cancelFulfillment called!", { fulfillment })
      return {}
    }
  }
  
  export default SendcloudFulfillmentProviderService*/