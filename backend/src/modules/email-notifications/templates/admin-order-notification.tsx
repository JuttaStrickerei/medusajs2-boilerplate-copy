import { Hr, Section, Text } from "@react-email/components"
import * as React from "react"
import { Base } from "./base"
import { OrderAddressDTO, OrderDTO } from "@medusajs/framework/types"

export const ADMIN_ORDER_NOTIFICATION = "admin-order-notification"

type OrderWithSummary = OrderDTO & {
  display_id?: string | number
  summary?: { raw_current_order_total?: { value?: number } }
  shipping_total?: number
  tax_total?: number
  billing_address?: OrderAddressDTO | null
  payment_collections?: Array<{
    payment_sessions?: Array<{
      is_selected?: boolean
      provider_id?: string
    }>
  }>
}

export interface AdminOrderNotificationTemplateProps {
  order: OrderWithSummary
  shippingAddress?: OrderAddressDTO | null
  adminOrderUrl: string
  preview?: string
}

export const isAdminOrderNotificationTemplateData = (
  data: unknown
): data is AdminOrderNotificationTemplateProps => {
  if (!data || typeof data !== "object") {
    return false
  }

  const payload = data as Record<string, unknown>
  return (
    typeof payload.adminOrderUrl === "string" &&
    typeof payload.order === "object" &&
    payload.order !== null
  )
}

const formatCurrency = (amount: number, currencyCode?: string) => {
  const normalizedCurrency = (currencyCode || "EUR").toUpperCase()
  return new Intl.NumberFormat("de-AT", {
    style: "currency",
    currency: normalizedCurrency,
  }).format(amount || 0)
}

const formatAddress = (address?: OrderAddressDTO | null) => {
  if (!address) {
    return "Keine Lieferadresse vorhanden"
  }

  const lines = [
    `${address.first_name || ""} ${address.last_name || ""}`.trim(),
    address.address_1,
    address.address_2,
    `${address.postal_code || ""} ${address.city || ""}`.trim(),
    address.country_code?.toUpperCase(),
  ].filter(Boolean)

  return lines.join(", ")
}

const getPaymentMethod = (order: OrderWithSummary) => {
  const selectedSession = order.payment_collections
    ?.flatMap((collection) => collection.payment_sessions || [])
    .find((session) => session.is_selected)

  return selectedSession?.provider_id || "Nicht verfugbar"
}

export const AdminOrderNotificationTemplate: React.FC<
  AdminOrderNotificationTemplateProps
> = ({ order, shippingAddress, adminOrderUrl, preview = "Neue Bestellung eingegangen" }) => {
  const displayId = order.display_id ?? order.id
  const createdAt = new Date(order.created_at).toLocaleString("de-AT")
  const customerAddress = shippingAddress || order.billing_address || null
  const paymentMethod = getPaymentMethod(order)
  const shippingTotal = Number(order.shipping_total || 0)
  const taxTotal = Number(order.tax_total || 0)
  const grandTotal =
    Number(order.summary?.raw_current_order_total?.value ?? order.total ?? 0)
  const currencyCode = order.currency_code || "EUR"

  return (
    <Base preview={preview}>
      <Section>
        <Text style={{ fontSize: "24px", fontWeight: "600", marginBottom: "8px" }}>
          Neue Bestellung #{displayId}
        </Text>
        <Text style={{ fontSize: "14px", color: "#57534e", marginTop: 0 }}>
          Strickerei Jutta hat eine neue Bestellung erhalten.
        </Text>
      </Section>

      <Hr />

      <Section>
        <Text><strong>Bestellnummer:</strong> #{displayId}</Text>
        <Text><strong>Datum:</strong> {createdAt}</Text>
        <Text><strong>Kunde:</strong> {`${customerAddress?.first_name || ""} ${customerAddress?.last_name || ""}`.trim() || "Unbekannt"}</Text>
        <Text><strong>E-Mail:</strong> {order.email || "Keine E-Mail"}</Text>
        <Text><strong>Lieferadresse:</strong> {formatAddress(customerAddress)}</Text>
      </Section>

      <Hr />

      <Section>
        <Text style={{ fontWeight: "600", marginBottom: "8px" }}>Produkte</Text>
        {(order.items || []).map((item) => {
          const lineTotal = Number(item.total ?? Number(item.unit_price || 0) * Number(item.quantity || 1))
          return (
            <Text key={item.id} style={{ margin: "0 0 8px 0", fontSize: "14px" }}>
              {item.product_title || item.title} ({item.title || "Variante"}) x{item.quantity} -{" "}
              {formatCurrency(lineTotal, currencyCode)}
            </Text>
          )
        })}
      </Section>

      <Hr />

      <Section>
        <Text><strong>Versand:</strong> {formatCurrency(shippingTotal, currencyCode)}</Text>
        <Text><strong>Steuern:</strong> {formatCurrency(taxTotal, currencyCode)}</Text>
        <Text><strong>Gesamtbetrag:</strong> {formatCurrency(grandTotal, currencyCode)}</Text>
        <Text><strong>Zahlungsmethode:</strong> {paymentMethod}</Text>
      </Section>

      <Hr />

      <Section>
        <Text>
          <a href={adminOrderUrl}>Bestellung im Medusa Admin ansehen</a>
        </Text>
      </Section>
    </Base>
  )
}

export default AdminOrderNotificationTemplate
