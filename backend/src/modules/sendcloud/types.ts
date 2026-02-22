// src/modules/sendcloud/types.ts
export type SendcloudOptions = {
  public_key: string
  secret_key: string
  brand_domain?: string;
  return_address?: {
    name: string;
    company_name?: string;
    address: string;
    house_number: string;
    city: string;
    postal_code: string;
    country: string;
    email?: string;
    telephone?: string;
  };
}

// Price and Currency Types
export type SendcloudPriceBreakdown = {
  type: 'price_without_insurance' | 'fuel' | string
  label: string
  value: number
}

// Shipping Method Types
export type SendcloudShippingMethod = {
  id: number
  name: string
  carrier: string
  min_weight: string
  max_weight: string
  service_point_input: 'required' | 'none'
  price: number
  countries: SendcloudCountry[]
}

export type SendcloudCountry = {
  id: number
  name: string
  price: number
  iso_2: string
  iso_3: string
  lead_time_hours: number | null
  price_breakdown?: SendcloudPriceBreakdown[]
}

export type SendcloudShippingMethodsResponse = {
  shipping_methods: SendcloudShippingMethod[]
}

// Parcel Types
export type SendcloudParcelStatus = {
  id: number
  message: string
}

export type SendcloudLabel = {
  normal_printer: string[]
  label_printer?: string
}

export type SendcloudParcelResponse = {
  id: number
  name: string
  company_name?: string
  address: string
  address_divided?: {
    street: string
    house_number: string
  }
  city: string
  postal_code: string
  telephone?: string
  email?: string
  status: SendcloudParcelStatus
  tracking_number?: string
  tracking_url?: string
  label?: SendcloudLabel
  weight: string
  carrier: {
    code: string
  }
  documents?: Array<{
    type: string
    size: string
    link: string
  }>
  shipment: {
    id: number
    name: string
  }
  order_number?: string
  colli_uuid?: string
}

/**
 * Parcel item structure for Sendcloud
 * See: https://api.sendcloud.dev/docs/sendcloud-public-api/parcels/operations/create-a-parcel
 */
export interface SendcloudParcelItem {
  description: string;
  quantity: number;
  weight: string;           // Weight in KG (e.g., "0.500")
  sku?: string;             // Stock Keeping Unit
  value: string;            // Price per item (e.g., "10.00")
  hs_code?: string;         // Harmonized System code for customs
  origin_country?: string;  // Country of origin (ISO 2)
  product_id?: string;      // External product ID
  product_url?: string;     // URL to product page or image
  mid_code?: string;        // Manufacturer ID code
  properties?: Record<string, string>; // Custom properties
}

export type SendcloudCreateParcelRequest = {
  parcel: {
    name: string
    company_name?: string
    address: string
    house_number: string
    city: string
    postal_code: string
    telephone?: string
    email?: string
    country: string
    shipment: {
      id: number
    }
    weight: string
    order_number?: string
    request_label: boolean
    is_return?: boolean
    parcel_items?: SendcloudParcelItem[]
    
    // Return-spezifische Felder (from_* = Absender bei Retouren)
    from_name?: string
    from_company_name?: string
    from_address_1?: string
    from_address_2?: string
    from_house_number?: string
    from_city?: string
    from_postal_code?: string
    from_country?: string
    from_email?: string
    from_telephone?: string
  }
}

export type SendcloudCreateParcelResponse = {
  parcel: SendcloudParcelResponse
}

export type SendcloudCancelResponse = {
  status: string
  message: string
}

// Error Types
export type SendcloudError = {
  message: string
  code?: string
}

export type SendcloudErrorResponse = {
  error: SendcloudError
  errors?: SendcloudError[]
}
