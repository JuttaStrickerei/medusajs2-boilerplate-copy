// src/modules/sendcloud/types.ts

// ──────────────────────────────────────────────────────────────
// Carrier Group Types (weight-based dynamic method selection)
// ──────────────────────────────────────────────────────────────

/**
 * A single Sendcloud shipping method within a carrier group,
 * identified by its Sendcloud method ID and a weight range in KG.
 *
 * Weight boundaries are inclusive on both sides: min <= weight <= max.
 */
export type CarrierGroupMethod = {
  sendcloud_id: number
  name?: string
  min_weight_kg: number
  max_weight_kg: number
}

/**
 * A carrier group bundles multiple Sendcloud shipping methods
 * that belong to the same carrier/service but cover different weight tiers.
 *
 * Configured in medusa-config.js under the sendcloud provider options.
 */
export type CarrierGroup = {
  id: string
  name: string
  methods: CarrierGroupMethod[]
}

/**
 * Shape of the data field stored in a shipping option when a carrier group
 * fulfillment option is selected. The `carrier_group` flag distinguishes
 * it from legacy single-method data.
 */
export type CarrierGroupData = {
  carrier_group: true
  carrier_group_id: string
  carrier_group_name: string
  sendcloud_id: number
  methods: CarrierGroupMethod[]
  countries: SendcloudCountry[]
  is_return: boolean
}

/**
 * Result of the weight-based method selection.
 */
export type WeightMethodSelection = {
  sendcloud_id: number
  method_name: string
  min_weight_kg: number
  max_weight_kg: number
  actual_weight_kg: number
}

// ──────────────────────────────────────────────────────────────
// Module Options
// ──────────────────────────────────────────────────────────────

export type SendcloudOptions = {
  public_key: string
  secret_key: string
  brand_domain?: string
  carrier_groups?: CarrierGroup[]
  return_address?: {
    name: string
    company_name?: string
    address: string
    house_number: string
    city: string
    postal_code: string
    country: string
    email?: string
    telephone?: string
  }
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

// Contract Types
export type SendcloudContract = {
  id: number
  name: string
  carrier: {
    code: string
    name: string
  }
  country: string
  is_active: boolean
}

export type SendcloudContractsResponse = {
  contracts: SendcloudContract[]
}

// Sender Address Types
export type SendcloudSenderAddress = {
  id: number
  company_name: string
  contact_name: string
  email: string
  telephone: string
  street: string
  house_number: string
  postal_code: string
  city: string
  country: string
}

export type SendcloudSenderAddressesResponse = {
  sender_addresses: SendcloudSenderAddress[]
}

// Shipping Price Types
export type SendcloudShippingPrice = {
  shipping_method_id: number
  price: number
  currency: string
}

// Service Point Types
export type SendcloudServicePoint = {
  id: number
  name: string
  street: string
  house_number: string
  postal_code: string
  city: string
  country: string
  carrier: string
  latitude: string
  longitude: string
  open_tomorrow: boolean
  open_upcoming_week: boolean
  distance: number
  formatted_opening_times: Record<string, { open: string; close: string }[]>
}

export type SendcloudServicePointsResponse = {
  service_points: SendcloudServicePoint[]
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
