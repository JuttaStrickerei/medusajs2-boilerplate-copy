export type DashboardShipment = {
  fulfillment_id: string
  order_id: string
  order_display_id: string | number
  sendcloud_id: string | null
  parcel_id: number | null
  tracking_number: string | null
  tracking_url: string | null
  carrier: string | null
  status: "preparing" | "shipped" | "delivered" | "canceled" | "exception" | "returned"
  sendcloud_status: string | null
  is_return: boolean
  recipient_name: string
  recipient_city: string
  recipient_postal_code: string
  recipient_country: string
  label_available: boolean
  shipped_at: string | null
  delivered_at: string | null
  canceled_at: string | null
  created_at: string
}

export type DashboardShipmentsResponse = {
  shipments: DashboardShipment[]
  count: number
  offset: number
  limit: number
}

export type OpenOrder = {
  id: string
  display_id: number
  created_at: string
  email: string
  fulfillment_status: string
  shipping_address: {
    first_name: string | null
    last_name: string | null
    company: string | null
    address_1: string | null
    address_2: string | null
    city: string | null
    postal_code: string | null
    country_code: string | null
    phone: string | null
  } | null
  items: OrderItem[]
  shipping_methods: ShippingMethod[]
  fulfillments: OrderFulfillment[]
}

export type OrderItem = {
  id: string
  title: string
  product_title: string | null
  variant_title: string | null
  variant_sku: string | null
  variant_id: string | null
  thumbnail: string | null
  quantity: number
  fulfilled_quantity: number
  unit_price: number
  variant?: {
    id: string
    title: string | null
    sku: string | null
    weight: number | null
    product?: {
      id: string
      handle: string | null
      thumbnail: string | null
    } | null
  } | null
}

export type ShippingMethod = {
  id: string
  shipping_option_id: string
  name: string | null
  data: Record<string, unknown>
}

export type OrderFulfillment = {
  id: string
  provider_id: string
  data: Record<string, unknown> | null
  shipped_at: string | null
  delivered_at: string | null
  canceled_at: string | null
  labels: Array<{
    tracking_number: string | null
    tracking_url: string | null
    label_url: string | null
  }>
  items: Array<{
    line_item_id: string
    quantity: number
  }>
}

export type WizardStep = 1 | 2 | 3

export type SelectedItem = {
  id: string
  quantity: number
}
