// src/modules/sendcloud/types.ts

export type SendcloudPriceBreakdown = {
  type: string
  label: string
  value: number
}

export type SendcloudCountry = {
  id: number
  name: string
  price: number
  iso_2: string
  iso_3: string
  lead_time_hours: number | null
  price_breakdown: SendcloudPriceBreakdown[]
}

export type SendcloudShippingMethod = {
  id: number
  name: string
  carrier: string
  min_weight: string
  max_weight: string
  service_point_input: string
  price: number
  countries: SendcloudCountry[]
}

export type SendcloudShippingMethodsResponse = {
  shipping_methods: SendcloudShippingMethod[]
}

// Added these to types.ts

export type SendcloudParcelStatus = {
  id: number
  message: string
}

export type SendcloudParcelLabel = {
  normal_printer: string[]
  label_printer: string
}

export type SendcloudParcelDocument = {
  type: string
  size: string
  link: string
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
  tracking_number?: string
  weight: string
  label: SendcloudParcelLabel
  documents: SendcloudParcelDocument[]
  status: SendcloudParcelStatus
  country: {
    iso_3: string
    iso_2: string
    name: string
  }
  shipment: {
    id: number
    name: string
  }
  carrier: {
    code: string
  }
  order_number?: string
  reference?: string
}

export type SendcloudCreateParcelRequest = {
  parcel: {
    name: string
    company_name?: string
    address: string
    house_number?: string
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
    request_label?: boolean
    shipping_method_checkout_name?: string
    reference?: string
  }
}

export type SendcloudCreateParcelResponse = {
  parcel: SendcloudParcelResponse
}

export type SendcloudCancelParcelResponse = {
  status: string
  message: string
}

export type SendcloudParcelsResponse = {
  next: string | null
  previous: string | null
  parcels: SendcloudParcelResponse[]
}