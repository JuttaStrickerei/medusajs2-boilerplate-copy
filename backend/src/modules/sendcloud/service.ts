import {
  AbstractFulfillmentProviderService,
  MedusaError,
  Modules
} from "@medusajs/framework/utils"
import {
  FulfillmentItemDTO,
  FulfillmentOrderDTO,
  CreateFulfillmentResult,
  FulfillmentOption,
  CalculateShippingOptionPriceDTO,
  CalculatedShippingOptionPrice,
  CreateShippingOptionDTO
} from "@medusajs/framework/types"
import { SendcloudClient } from "./client"
import { SendcloudOptions, SendcloudCreateParcelRequest, SendcloudParcelItem } from "./types"


// MODIFIED MappedOrderItem interface with extended product info
interface MappedOrderItem {
  id: string;
  title: string;
  sku?: string;
  quantity: number;
  weight: number;
  unitPrice: number;
  hs_code?: string | null;
  origin_country?: string | null;
  product_id?: string;      // Medusa product ID
  product_handle?: string;  // Product handle for URL generation
  thumbnail?: string;       // Product image URL
}

// NOTE: SendcloudParcelItem interface is now imported from types.ts


class SendcloudFulfillmentProviderService extends AbstractFulfillmentProviderService {
  static identifier = "sendcloud"
  protected client_: SendcloudClient
  protected options_: SendcloudOptions
  protected container_: any

  constructor(container, options: SendcloudOptions) {
    super()
    this.options_ = options
    this.client_ = new SendcloudClient(options)
    this.container_ = container
    
    if (process.env.NODE_ENV === "development") {
      this.client_.testConnection().then((success) => {
        if (!success) {
          console.error("[SendcloudProvider] Failed to connect to Sendcloud")
        } else {
          console.log("[SendcloudProvider] Successfully connected to Sendcloud")
        }
      })
    }
  }

  async getFulfillmentOptions(): Promise<FulfillmentOption[]> {
    try {
      const [regularResponse, returnResponse] = await Promise.all([
        this.client_.getShippingMethodsAll(),
        this.client_.getReturnShippingMethodsAll(),
      ]);

      const regularOptions = regularResponse.shipping_methods.map(method => ({
        id: `sendcloud_${method.id}`,
        name: method.name,
        provider_id: SendcloudFulfillmentProviderService.identifier,
        price_type: "calculated" as const,
        data: {
          carrier: method.carrier,
          min_weight: method.min_weight,
          max_weight: method.max_weight,
          countries: method.countries,
          sendcloud_id: method.id,
          is_return: false,
        },
      }));

      const returnOptions = returnResponse.shipping_methods.map(method => ({
        id: `sendcloud_return_${method.id}`,
        name: `${method.name} (Return)`,
        provider_id: SendcloudFulfillmentProviderService.identifier,
        price_type: "calculated" as const,
        is_return: true,
        data: {
          carrier: method.carrier,
          min_weight: method.min_weight,
          max_weight: method.max_weight,
          countries: method.countries,
          sendcloud_id: method.id,
          is_return: true, 
        },
      }));

      return [...regularOptions, ...returnOptions];
    } catch (error) {
      console.error("[SendcloudProvider] Error fetching fulfillment options:", error);
      return [];
    }
  }

  async validateOption(data: Record<string, unknown>): Promise<boolean> {
    try {
      const shippingMethods = await this.getFulfillmentOptions()
      return shippingMethods.some(method => method.id === data.id)
    } catch (error) {
      console.error("[SendcloudProvider] Error validating option:", error)
      return false
    }
  }

  /**
   * Required by Medusa when using "calculated" price type
   * Returns true if this provider can calculate prices dynamically
   */
  async canCalculate(data: CreateShippingOptionDTO): Promise<boolean> {
    // We can calculate for any Sendcloud method
    return true
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

  /**
   * Calculate shipping price for a Sendcloud method
   * 
   * Simple approach: Use the price from the method's countries data
   * For now, we use the first country's price as the base price.
   * 
   * Future enhancement: When expanding internationally, this can be extended
   * to look up the price based on context.shipping_address.country_code
   */
  async calculatePrice(
    optionData: CalculateShippingOptionPriceDTO["optionData"],
    data: CalculateShippingOptionPriceDTO["data"],
    context: CalculateShippingOptionPriceDTO["context"]
  ): Promise<CalculatedShippingOptionPrice> {
    try {
      // Try to find sendcloud_id and countries in various places
      const methodData = optionData as Record<string, any>
      
      const sendcloudId = 
        methodData?.sendcloud_id || 
        methodData?.data?.sendcloud_id ||
        (data as any)?.sendcloud_id
      
      const countries = 
        methodData?.countries || 
        methodData?.data?.countries ||
        (data as any)?.countries ||
        []

      if (!sendcloudId) {
        return {
          calculated_amount: 0,
          is_calculated_price_tax_inclusive: false 
        }
      }

      // Get price - try destination country first, then fallback to first country
      let priceFromSendcloud = 0
      const toCountry = context?.shipping_address?.country_code?.toUpperCase()
      
      if (toCountry && countries?.length) {
        const countryData = countries.find((c: any) => c.iso_2?.toUpperCase() === toCountry)
        if (countryData) {
          priceFromSendcloud = countryData.price
        }
      }
      
      // Fallback: use first country's price
      if (priceFromSendcloud === 0 && countries?.[0]?.price) {
        priceFromSendcloud = countries[0].price
      }

      // Note: This storefront template treats amounts as euros (not cents)
      const calculatedAmount = priceFromSendcloud

      return {
        calculated_amount: calculatedAmount,
        is_calculated_price_tax_inclusive: false 
      }
    } catch (error) {
      console.error("[SendcloudProvider] Error calculating price:", error)
      if (error instanceof MedusaError) throw error
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE, 
        `Error calculating Sendcloud price: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  private mapOrderItems(
    itemsToMapFromFulfillment: Partial<Omit<FulfillmentItemDTO, "fulfillment">>[], 
    order: Partial<FulfillmentOrderDTO> 
  ): MappedOrderItem[] {
    const mappedItems: MappedOrderItem[] = [];
  
    if (!order.items || !Array.isArray(order.items)) {
      return mappedItems;
    }

    itemsToMapFromFulfillment.forEach((ffItem) => {
      const orderLineItem = order.items?.find((oli) => oli.id === ffItem.line_item_id);
  
      if (!orderLineItem) return;
      
      const loggableOrderLineItem: any = orderLineItem; 

      let weightInGrams = 500; 
      let itemSku: string | undefined = loggableOrderLineItem.variant?.sku || ffItem.sku;
      let itemTitle: string = loggableOrderLineItem.variant?.title || loggableOrderLineItem.title || "Unknown Item";
      let itemUnitPrice: number = loggableOrderLineItem.unit_price || 0; 
      let hsCode: string | null | undefined = null;
      let originCountry: string | null | undefined = null;
      let productId: string | undefined = undefined;
      let productHandle: string | undefined = undefined;
      let thumbnail: string | undefined = undefined;
  
      if (loggableOrderLineItem.variant) {
        hsCode = loggableOrderLineItem.variant.hs_code; 
        originCountry = loggableOrderLineItem.variant.origin_country; 

        if (typeof loggableOrderLineItem.variant.weight === 'number') {
          weightInGrams = loggableOrderLineItem.variant.weight;
        } else if (loggableOrderLineItem.variant.product && typeof loggableOrderLineItem.variant.product.weight === 'number') {
          weightInGrams = loggableOrderLineItem.variant.product.weight;
        }

        // Extract product info for Sendcloud
        if (loggableOrderLineItem.variant.product) {
          productId = loggableOrderLineItem.variant.product.id;
          productHandle = loggableOrderLineItem.variant.product.handle;
          thumbnail = loggableOrderLineItem.variant.product.thumbnail || loggableOrderLineItem.thumbnail;
        }
      }

      // Fallback to line item thumbnail
      if (!thumbnail && loggableOrderLineItem.thumbnail) {
        thumbnail = loggableOrderLineItem.thumbnail;
      }
  
      mappedItems.push({
        id: loggableOrderLineItem.id, 
        title: itemTitle,
        sku: itemSku, 
        quantity: ffItem.quantity || orderLineItem.quantity, 
        weight: weightInGrams, 
        unitPrice: itemUnitPrice,
        hs_code: hsCode,
        origin_country: originCountry,
        product_id: productId,
        product_handle: productHandle,
        thumbnail: thumbnail,
      });
    });
  
    return mappedItems;
  }
  
  private calculateTotalWeight(items: MappedOrderItem[]): string {
    const totalGrams = items.reduce((sum, item) => {
      const weight = Number(item.weight || 0); 
      const quantity = item.quantity || 1;
      return sum + weight * quantity;
    }, 0);

    return Math.max(totalGrams / 1000, 0.001).toFixed(3);
  }

  /**
   * Diese Methode wird vom createReturnFulfillmentWorkflow aufgerufen
   * Sie erstellt ein Sendcloud-Paket für eine Retoure
   * 
   * WICHTIG: Bei Returns ist die delivery_address bereits die Händler-Adresse (Location),
   * nicht die Kunden-Adresse! Medusa übernimmt das automatisch basierend auf der
   * im Admin ausgewählten Location.
   * 
   * WICHTIG: Das fulfillment-Objekt bei Returns enthält KEIN order-Objekt!
   * Die Items sind bereits als Fulfillment-Items mit SKU, Title, Quantity vorhanden.
   */
async createReturnFulfillment(
  fulfillment: Record<string, unknown>
): Promise<CreateFulfillmentResult> {
  // Extract standard data from fulfillment
  const itemsRaw = (fulfillment as any)?.items;
  const shipping_option = (fulfillment as any)?.shipping_option as Record<string, any> | undefined;
  const delivery_address = (fulfillment as any)?.delivery_address as Record<string, any> | undefined;
  const location_id = (fulfillment as any)?.location_id as string | undefined;
  const fulfillment_id = (fulfillment as any)?.id as string | undefined;

  // Convert items (MikroORM Collection → Array)
  let items: any[] = [];
  if (itemsRaw) {
    if (typeof itemsRaw.getItems === 'function') {
      items = itemsRaw.getItems();
    } else if (itemsRaw.length !== undefined) {
      items = Array.from(itemsRaw);
    } else {
      items = Array.isArray(itemsRaw) ? itemsRaw : [];
    }
  }

  // Validation
  if (!items || items.length === 0) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Items are required for return fulfillment.");
  }
  if (!shipping_option) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Shipping option is required for return fulfillment.");
  }
  if (!delivery_address) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Delivery address is required for return fulfillment.");
  }

  // Validate fulfillment is for SendCloud provider
  const providerIdFromFulfillment = (fulfillment as any).provider_id;
  if (providerIdFromFulfillment && !providerIdFromFulfillment.includes('sendcloud')) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `Fulfillment must be for SendCloud provider. Found provider_id: '${providerIdFromFulfillment}'`
    );
  }

  // Extract Sendcloud Method ID from shipping option data
  // The sendcloud_id can be in various locations depending on how the shipping option was configured
  console.log("[SendcloudProvider] Return - shipping_option:", JSON.stringify(shipping_option, null, 2));
  
  const sendcloudMethodId = 
    (shipping_option.data?.data as any)?.sendcloud_id ||  // Nested in data.data
    (shipping_option.data as any)?.sendcloud_id ||         // Direct in data
    (shipping_option as any)?.sendcloud_id ||              // Direct on shipping_option
    (shipping_option.service_zone?.fulfillment_set?.service_zones?.[0]?.shipping_options?.[0]?.data as any)?.sendcloud_id; // Deeply nested
    
  console.log("[SendcloudProvider] Return - extracted sendcloud_id:", sendcloudMethodId);
  
  if (!sendcloudMethodId) {
    console.error("[SendcloudProvider] Missing sendcloud_id in shipping_option.data");
    console.error("[SendcloudProvider] shipping_option structure:", JSON.stringify(shipping_option, null, 2));
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Sendcloud shipping method ID (data.sendcloud_id) is required in shipping option data."
    );
  }

  // Extract order data from workflow or fetch via container
  let order: any = 
    (fulfillment as any)?.order ||
    (fulfillment as any)?.data?.order ||
    null;
  
  let orderFound = false;
  let customerAddress: any = null;
  let orderNumber = fulfillment_id || "RETURN";

  // Strategy 1: Use order data from workflow (if provided)
  if (order && order.shipping_address) {
    orderFound = true;
    customerAddress = order.shipping_address;
    orderNumber = String(order.display_id || order.id);
  } 
  // Strategy 2: Fetch order data using container_ with "query" service (Medusa v2 style)
  else if (items && items.length > 0 && this.container_) {
    try {
      // Use "query" service for Medusa v2 (more reliable than Modules.ORDER)
      const query = this.container_.resolve("query");
      const firstLineItemId = items[0].line_item_id;
      
      console.log("[SendcloudProvider] Fetching order data for line_item_id:", firstLineItemId);
      
      // Query orders with the line item
      const { data: orders } = await query.graph({
        entity: "order",
        fields: [
          "id",
          "display_id",
          "email",
          "shipping_address.*",
          "items.id",
        ],
        filters: {},
      });
      
      // Find order containing this line item
      const matchingOrder = orders?.find((o: any) =>
        o.items?.some((item: any) => item.id === firstLineItemId)
      );
      
      if (matchingOrder && matchingOrder.shipping_address) {
        order = matchingOrder;
        orderFound = true;
        customerAddress = matchingOrder.shipping_address;
        orderNumber = String(matchingOrder.display_id || matchingOrder.id);
        console.log("[SendcloudProvider] Found order:", orderNumber, "with shipping address");
      }
    } catch (error) {
      console.error("[SendcloudProvider] Failed to fetch order data:", error instanceof Error ? error.message : error);
    }
  }

  // Strategy 3: Last resort - use placeholder data with Austria as default
  // (since most return methods are Austria-specific)
  if (!orderFound) {
    console.warn("[SendcloudProvider] No order data found, using placeholder (may result in invalid labels)");
    
    // Try to get country from delivery_address (which is the merchant address)
    const fallbackCountry = delivery_address?.country_code?.toLowerCase() || "at";
    
    customerAddress = {
      first_name: "Customer",
      last_name: "Return",
      address_1: "Return Address",
      address_2: "1",
      city: "Wien",
      postal_code: "1070",
      country_code: fallbackCountry, // Use delivery country as fallback
      phone: "+436641234567",
      email: "returns@placeholder.com"
    };
  }

  // Prepare items for Sendcloud with proper data
  let sendcloudParcelItems: SendcloudParcelItem[];
  let totalWeightKg: string;

  if (orderFound && order && order.items) {
    const mappedItems = this.mapOrderItems(items, order);

    if (mappedItems.length === 0) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "No valid items to fulfill after mapping.");
    }

    totalWeightKg = this.calculateTotalWeight(mappedItems);

    // Get storefront URL for product links
    const storefrontUrl = process.env.STOREFRONT_URL || process.env.NEXT_PUBLIC_BASE_URL || "https://strickerei-jutta.at"
    
    sendcloudParcelItems = mappedItems.map(item => ({
      description: item.title,
      quantity: item.quantity,
      weight: (Math.max(item.weight, 1) / 1000).toFixed(3),
      sku: item.sku || undefined,
      value: item.unitPrice.toFixed(2),
      hs_code: item.hs_code || undefined,
      origin_country: item.origin_country?.toUpperCase() || undefined, // Must be uppercase (e.g., "AT")
      product_id: item.product_id || undefined,
      // Use thumbnail URL or construct product page URL
      product_url: item.thumbnail || (item.product_handle ? `${storefrontUrl}/products/${item.product_handle}` : undefined),
    }));
  }
  // Fallback: Use basic item data (will have placeholder weights/prices)
  else {
    let totalWeightGrams = 0;
    sendcloudParcelItems = items.map((item) => {
      const title = item.title || "Return Item";
      const sku = item.sku || undefined;
      const quantity = item.quantity || 1;
      const weightPerItemGrams = 500;
      totalWeightGrams += weightPerItemGrams * quantity;

      return {
        description: title,
        quantity: quantity,
        weight: (weightPerItemGrams / 1000).toFixed(3),
        sku: sku,
        value: "10.00",
        hs_code: undefined,
        origin_country: undefined
      };
    });

    totalWeightKg = Math.max(totalWeightGrams / 1000, 0.001).toFixed(3);
  }

  // ====================================================================
  // Create Sendcloud Parcel Data
  // ====================================================================
  const recipientName = delivery_address.company ||
                       `${delivery_address.first_name || ""} ${delivery_address.last_name || ""}`.trim() ||
                       "Return Department";
  const senderName = `${customerAddress.first_name || ""} ${customerAddress.last_name || ""}`.trim() || "Customer";

  // IMPORTANT: Create parcel as DRAFT (request_label: false)
  // The subscriber will update with real customer data and THEN request the label
  // This avoids the "Changing a parcel is not allowed if you already announced it" error
  const parcelData: SendcloudCreateParcelRequest = {
    parcel: {
      is_return: true,
      request_label: false, // ← DRAFT MODE - label will be requested by subscriber after enrichment
      // RECIPIENT = Merchant (return address)
      name: recipientName,
      company_name: delivery_address.company,
      address: delivery_address.address_1,
      house_number: delivery_address.address_2 || "0",
      city: delivery_address.city,
      postal_code: delivery_address.postal_code,
      country: delivery_address.country_code.toUpperCase(),
      email: delivery_address.email,
      telephone: delivery_address.phone,
      // SENDER = Customer (original shipping address)
      from_name: senderName,
      from_company_name: customerAddress.company_name,
      from_address_1: customerAddress.address_1,
      from_house_number: customerAddress.address_2 || "0",
      from_city: customerAddress.city,
      from_postal_code: customerAddress.postal_code,
      from_country: customerAddress.country_code.toUpperCase(),
      from_email: order?.email || "returns@placeholder.com",
      from_telephone: customerAddress.phone || "",
      shipment: { id: Number(sendcloudMethodId) },
      order_number: orderNumber,
      weight: totalWeightKg,
      parcel_items: sendcloudParcelItems,
    }
  };

  // Create parcel in Sendcloud
  try {
    const response = await this.client_.createParcel(parcelData);
    const createdParcel = response.parcel;

    // Use FULL URL for label download
    // Use /labels/ endpoint (public, no auth required)
    // Note: For returns, the label is requested later by the subscriber
    const backendUrl = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"
    const proxyLabelUrl = `${backendUrl}/labels/${createdParcel.id}`
    
    return {
      data: {
        parcel_id: createdParcel.id,
        tracking_number: createdParcel.tracking_number,
        tracking_url: createdParcel.tracking_url,
        label_url: proxyLabelUrl, // Full URL for admin panel
        sendcloud_label_url: createdParcel.label?.normal_printer?.[0], // Direct Sendcloud URL as backup
        is_return: true,
      },
      labels: [{
        tracking_number: createdParcel.tracking_number || "",
        tracking_url: createdParcel.tracking_url || "",
        label_url: proxyLabelUrl
      }]
    };
  } catch (error) {
    console.error("[SendcloudProvider] Return fulfillment failed:", error instanceof Error ? error.message : error);
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      `Failed to create return parcel in Sendcloud: ${(error as Error).message}`
    );
  }
}

  async createFulfillment(
    data: Record<string, unknown>, 
    items: Partial<Omit<FulfillmentItemDTO, "fulfillment">>[], 
    order: Partial<FulfillmentOrderDTO> | undefined, 
    fulfillment: Record<string, unknown>
  ): Promise<CreateFulfillmentResult> {
    if (!order || !order.shipping_address || !order.items) { 
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Order data, shipping address, or order.items are missing."
      );
    }

    const sendcloudMethodId = (data?.data as Record<string, unknown>)?.sendcloud_id || (data as Record<string, unknown>)?.sendcloud_id;
    if (!sendcloudMethodId) {
      console.error("[SendcloudProvider] Missing sendcloud_id in data");
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Sendcloud shipping method ID is required");
    }

    const itemsForSendcloudParcel = this.mapOrderItems(items, order);
    
    if (!itemsForSendcloudParcel.length) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "No valid items to fulfill after mapping.");
    }

    const totalWeightKgString = this.calculateTotalWeight(itemsForSendcloudParcel);

    if (!order.shipping_address.address_1 || !order.shipping_address.city || 
        !order.shipping_address.postal_code || !order.shipping_address.country_code) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Missing required address fields");
    }
    const countryCode = order.shipping_address.country_code.toUpperCase();

    // Get storefront URL for product links
    const storefrontUrl = process.env.STOREFRONT_URL || process.env.NEXT_PUBLIC_BASE_URL || "https://strickerei-jutta.at"
    
    const sendcloudParcelItems: SendcloudParcelItem[] = itemsForSendcloudParcel.map(item => ({
      description: item.title,
      quantity: item.quantity,
      weight: (Math.max(item.weight, 1) / 1000).toFixed(3), 
      sku: item.sku || undefined, 
      value: item.unitPrice.toFixed(2), 
      hs_code: item.hs_code || undefined,
      origin_country: item.origin_country?.toUpperCase() || undefined, // Must be uppercase (e.g., "AT")
      product_id: item.product_id || undefined,
      // Use thumbnail URL or construct product page URL
      product_url: item.thumbnail || (item.product_handle ? `${storefrontUrl}/products/${item.product_handle}` : undefined),
    }));

    const orderNumberString = String(order.display_id || order.id!);

    const parcelData: SendcloudCreateParcelRequest = {
      parcel: {
        name: `${order.shipping_address.first_name || ""} ${order.shipping_address.last_name || ""}`.trim(),
        address: order.shipping_address.address_1,
        house_number: order.shipping_address.address_2 || "0",
        city: order.shipping_address.city,
        postal_code: order.shipping_address.postal_code,
        telephone: order.shipping_address.phone || undefined,
        email: order.email || undefined,
        country: countryCode,
        shipment: {
          id: Number(sendcloudMethodId)
        },
        weight: totalWeightKgString,
        order_number: orderNumberString, 
        request_label: true, 
        parcel_items: sendcloudParcelItems 
      }
    };

    try {
      const response = await this.client_.createParcel(parcelData);

      // Use FULL URL for label download
      // Use /labels/ endpoint (public, no auth required)
      const backendUrl = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"
      const proxyLabelUrl = `${backendUrl}/labels/${response.parcel.id}`
      
      return {
        data: {
          parcel_id: response.parcel.id,
          tracking_number: response.parcel.tracking_number,
          tracking_url: response.parcel.tracking_url,
          label_url: proxyLabelUrl, // Full URL for admin panel
          sendcloud_label_url: response.parcel.label?.normal_printer?.[0], // Direct Sendcloud URL as backup
          carrier: response.parcel.carrier?.code,
          status: response.parcel.status?.message
        },
        labels: [
          {
            tracking_number: response.parcel.tracking_number || "",
            tracking_url: response.parcel.tracking_url || "",
            label_url: proxyLabelUrl
          }
        ]
      };
    } catch (error) {
      console.error("[SendcloudProvider] Error creating Sendcloud parcel:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA, 
        `Error creating Sendcloud parcel: ${errorMessage}`
      );
    }
  }

  async cancelFulfillment(
    data: Record<string, unknown> 
  ): Promise<Record<string, unknown>> {
    const parcelId = (data as any)?.parcel_id; 
    
    console.log("[SendcloudProvider] cancelFulfillment called with parcel_id:", parcelId);
    
    // If no parcel ID, we can still "cancel" in Medusa - just return success
    if (!parcelId) {
      console.warn("[SendcloudProvider] No parcel ID found - cancelling only in Medusa");
      return { 
        ...data, 
        cancelled_at: new Date().toISOString(),
        cancel_note: "No Sendcloud parcel ID - cancelled in Medusa only" 
      };
    }
  
    try {
      const result = await this.client_.cancelOrDeleteParcel(Number(parcelId));
      console.log("[SendcloudProvider] Parcel cancelled in Sendcloud:", parcelId, result);
      return { 
        ...data, 
        cancelled_at: new Date().toISOString(),
        sendcloud_cancel_status: result.status,
        sendcloud_cancel_message: result.message
      }; 
    } catch (error) {
      const errorMessage = (error instanceof Error ? error.message : String(error)).toLowerCase();
      
      console.log("[SendcloudProvider] Cancel error:", errorMessage);
      
      // Handle cases where parcel is already deleted/cancelled or doesn't exist
      // These should all be treated as "success" for the cancel operation
      const successPatterns = [
        "parcel has been deleted",
        "parcel is deleted",
        "no parcel matches",
        "parcel not found",
        "not found",
        "gone",
        "404",
        "does not exist",
        "already being cancelled",
        "shipment is already being cancelled",
        "this shipment is already being cancelled",
        "already cancelled",
        "already canceled",
        "cannot be cancelled",
        "status does not allow",
        "cancellation not possible",
        "parcel was cancelled",
        "is being cancelled",
        "shipment is being cancelled",
        "bad request",  // Often means already cancelled
      ];
      
      for (const pattern of successPatterns) {
        if (errorMessage.includes(pattern)) {
          console.log("[SendcloudProvider] Parcel", parcelId, "already cancelled/deleted - treating as success");
          return { 
            ...data, 
            cancelled_at: new Date().toISOString(),
            cancel_note: "Parcel was already cancelled or deleted in Sendcloud" 
          };
        }
      }
      
      // Only throw for genuine unexpected errors
      console.error("[SendcloudProvider] Unexpected error cancelling Sendcloud parcel:", errorMessage);
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Failed to cancel parcel in Sendcloud: ${errorMessage}`
      );
    }
  }

  mapSendcloudStatusToFulfillmentStatus(sendcloudStatus: string): string | null {
    const normalizedStatus = (sendcloudStatus || "").toLowerCase().trim();
    switch (normalizedStatus) {
      case "ready to send": case "ready for order": case "awaiting label": case "new": case "data received":
        return "created";
      case "announced": case "registered": case "announced at carrier": case "sent to carrier": case "handed to carrier": case "picked up by carrier":
        return "shipped";
      case "at sorting": case "sorting": case "in transit": case "with delivery courier": case "out for delivery": case "ready for pickup": case "at pickup point":
        return "shipped";
      case "delivered": case "delivered to pickup point": case "picked up at pickup point":
        return "delivered";
      case "delivery attempt failed": case "not delivered": case "delivery failed": case "unable to deliver": case "not collected":
        return "not_delivered";
      case "cancelled": case "canceled": case "deleted": case "parcel deleted":
        return "canceled";
      case "return to sender": case "returned": case "returned to sender":
        return "returned";
      default:
        return "shipped"; 
    }
  }

  async updateFulfillmentStatus(
    parcelId: number | string, 
    trackingNumber: string, 
    status: string
  ): Promise<void> {
    if (!parcelId && !trackingNumber) return;
    if (!status) return;
    
    try {
      const fulfillmentStatus = this.mapSendcloudStatusToFulfillmentStatus(status);
      if (!fulfillmentStatus) return;
      
      const fulfillmentModuleService = this.container_.resolve(Modules.FULFILLMENT);
      let query: Record<string, any> = {};
      
      if (parcelId) {
        query = { "data.parcel_id": parcelId.toString() }; 
      } else if (trackingNumber) {
        return; 
      }
      
      const result = await fulfillmentModuleService.listFulfillments({ query }); 
      const fulfillments = result?.fulfillments || result || []; 
        
      if (fulfillments.length === 0) return;
      
      await this.updateMultipleFulfillments(fulfillments, fulfillmentStatus, fulfillmentModuleService);
        
    } catch (error) {
      console.error("[SendcloudProvider] Error updating fulfillment status:", error);
    }
  }

  private async updateMultipleFulfillments(
    fulfillments: any[], 
    fulfillmentStatus: string,
    fulfillmentModuleService: any 
  ): Promise<void> {
    for (const fulfillment of fulfillments) {
      if (fulfillment.status === fulfillmentStatus) continue;
      
      try {
        // TODO: Implement actual status update when Medusa v2 provides the API
      } catch (error) {
        console.error(`[SendcloudProvider] Error updating fulfillment ${fulfillment.id}:`, error);
      }
    }
  }
}

export default SendcloudFulfillmentProviderService;