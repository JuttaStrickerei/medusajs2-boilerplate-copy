import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Text, Button, Select } from "@medusajs/ui"
import { TruckFast, ArrowPath } from "@medusajs/icons"
import { useState, useCallback, useMemo } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { sdk } from "../../lib/sdk"
import { OpenOrdersSection } from "./components/open-orders-section"
import { PickupOrdersSection } from "./components/pickup-orders-section"
import { ActiveShipmentsSection } from "./components/active-shipments-section"
import { FulfillmentWizard } from "./components/fulfillment-wizard"
import { LABELS } from "./components/dashboard-labels"
import type { OpenOrder, DashboardShipmentsResponse } from "./components/types"

type TabId = "open" | "pickup" | "shipments"

function isPickupOrder(
  order: OpenOrder,
  pickupOptionIds: Set<string>
): boolean {
  // PRIMARY: customer's checkout choice is the source of truth — immutable
  // for the lifetime of the order, does NOT change when a fulfillment is
  // created later. Cross-reference against the pre-fetched set of pickup
  // option IDs (sourced from /admin/shipping-options).
  const methodIds = (order.shipping_methods || [])
    .map((sm) => sm.shipping_option_id)
    .filter((id): id is string => !!id)
  if (methodIds.length > 0) {
    return methodIds.every((id) => pickupOptionIds.has(id))
  }
  // FALLBACK: rare legacy orders without shipping methods on file —
  // inspect any active fulfillment's requires_shipping flag.
  const ffs = (order.fulfillments || []).filter((f) => !f.canceled_at)
  if (ffs.length > 0) {
    return ffs.every((f) => f.requires_shipping === false)
  }
  return false
}

const REFETCH_INTERVAL = 60_000
const SHIPPING_OPTIONS_STALE_MS = 5 * 60_000
const SHIPMENT_PAGE_SIZE = 20

// Statuses returned by the shared /admin/orders fetch. "fulfilled" is included
// so pickup orders stay visible in the Abholungen tab as "Bereit zur Abholung".
// Delivery's "fulfilled" orders are dropped per-tab below — they surface in
// "Aktive Sendungen" via the sync-sendcloud-shipment subscriber.
const FETCH_STATUSES = new Set([
  "not_fulfilled",
  "partially_fulfilled",
  "fulfilled",
  "canceled",
])

// Statuses kept in the Offene Bestellungen (delivery) tab. Excludes "fulfilled"
// so existing UX is preserved: once a delivery fulfillment is created, the row
// flows into "Aktive Sendungen" rather than double-displaying here.
const DELIVERY_TAB_STATUSES = new Set([
  "not_fulfilled",
  "partially_fulfilled",
  "canceled",
])

const SendcloudDashboardPage = () => {
  const [activeTab, setActiveTab] = useState<TabId>("open")
  const [wizardOrderId, setWizardOrderId] = useState<string | null>(null)
  const [shipmentPage, setShipmentPage] = useState(1)
  const [shipmentStatusFilter, setShipmentStatusFilter] = useState("")
  const [shipmentTypeFilter, setShipmentTypeFilter] = useState("")
  const queryClient = useQueryClient()

  const openOrdersQuery = useQuery({
    queryKey: ["dashboard-open-orders"],
    queryFn: async () => {
      const response = await sdk.client.fetch("/admin/orders", {
        method: "GET",
        query: {
          fields:
            "id,display_id,created_at,email,fulfillment_status,shipping_address.*,items.*,items.variant.*,items.variant.product.*,shipping_methods.*,fulfillments.*,fulfillments.items.*",
          order: "-created_at",
          limit: 100,
        },
      })
      const data = response as any
      const orders = (data.orders || []) as OpenOrder[]
      return orders.filter((o) => FETCH_STATUSES.has(o.fulfillment_status))
    },
    refetchInterval: REFETCH_INTERVAL,
  })

  // Pickup-option IDs are derived from /admin/shipping-options, which can
  // safely traverse fulfillment_set.type because shipping_option lives in
  // the Fulfillment Module's own graph (no read-only cross-module link).
  // Cached aggressively — admin-managed config, changes rarely.
  const pickupOptionsQuery = useQuery({
    queryKey: ["admin-shipping-options-pickup"],
    queryFn: async () => {
      const response = await sdk.client.fetch("/admin/shipping-options", {
        method: "GET",
        query: {
          fields: "id,service_zone.fulfillment_set.type",
          limit: 200,
        },
      })
      const data = response as any
      const opts = (data.shipping_options || []) as Array<{
        id: string
        service_zone?: {
          fulfillment_set?: { type?: string | null } | null
        } | null
      }>
      const ids = new Set<string>()
      for (const opt of opts) {
        const t = opt.service_zone?.fulfillment_set?.type?.toLowerCase()
        // Codebase seed uses "pickup"; Medusa docs use "pick-up". Accept both.
        if (t === "pickup" || t === "pick-up") ids.add(opt.id)
      }
      return ids
    },
    staleTime: SHIPPING_OPTIONS_STALE_MS,
  })

  const shipmentsQuery = useQuery({
    queryKey: [
      "dashboard-shipments",
      shipmentPage,
      shipmentStatusFilter,
      shipmentTypeFilter,
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: String(SHIPMENT_PAGE_SIZE),
        offset: String((shipmentPage - 1) * SHIPMENT_PAGE_SIZE),
      })
      if (shipmentStatusFilter) params.set("status", shipmentStatusFilter)
      if (shipmentTypeFilter) params.set("is_return", shipmentTypeFilter)

      const response = await fetch(
        `/admin/sendcloud/dashboard/shipments?${params}`,
        { credentials: "include" }
      )
      if (!response.ok) throw new Error("Failed to load shipments")
      return (await response.json()) as DashboardShipmentsResponse
    },
    refetchInterval: REFETCH_INTERVAL,
  })

  const refreshAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["dashboard-open-orders"] })
    queryClient.invalidateQueries({ queryKey: ["dashboard-shipments"] })
  }, [queryClient])

  const handleFulfill = useCallback((orderId: string) => {
    setWizardOrderId(orderId)
  }, [])

  const handleWizardClose = useCallback(() => {
    setWizardOrderId(null)
  }, [])

  const handleWizardCompleted = useCallback(() => {
    setWizardOrderId(null)
    refreshAll()
  }, [refreshAll])

  const openOrders = openOrdersQuery.data ?? []
  const pickupOptionIds = pickupOptionsQuery.data ?? new Set<string>()
  const { deliveryOrders, pickupOrders } = useMemo(() => {
    const delivery: OpenOrder[] = []
    const pickup: OpenOrder[] = []
    for (const order of openOrders) {
      if (isPickupOrder(order, pickupOptionIds)) {
        // Pickup tab keeps the wider set including "fulfilled" so operators
        // can mark orders "Als abgeholt markieren" after preparing them.
        pickup.push(order)
      } else if (DELIVERY_TAB_STATUSES.has(order.fulfillment_status)) {
        // Delivery "fulfilled" orders are intentionally dropped here —
        // they surface in "Aktive Sendungen" via sync-sendcloud-shipment.
        delivery.push(order)
      }
    }
    return { deliveryOrders: delivery, pickupOrders: pickup }
  }, [openOrders, pickupOptionIds])
  const ordersIsLoading =
    openOrdersQuery.isLoading || pickupOptionsQuery.isLoading
  const ordersIsError =
    openOrdersQuery.isError || pickupOptionsQuery.isError
  const shipments = shipmentsQuery.data?.shipments ?? []
  const shipmentsCount = shipmentsQuery.data?.count ?? 0

  return (
    <>
      <Container className="divide-y p-0">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <Heading level="h1">{LABELS.page.title}</Heading>
            <Text className="text-ui-fg-subtle mt-1">{LABELS.page.subtitle}</Text>
          </div>
          <Button variant="secondary" size="small" onClick={refreshAll}>
            <ArrowPath className="mr-1" />
            {LABELS.page.refreshButton}
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-x-0 border-b border-ui-border-base">
          <TabButton
            active={activeTab === "open"}
            onClick={() => setActiveTab("open")}
            count={deliveryOrders.length}
          >
            {LABELS.page.tabOpenOrders}
          </TabButton>
          <TabButton
            active={activeTab === "pickup"}
            onClick={() => setActiveTab("pickup")}
            count={pickupOrders.length}
          >
            {LABELS.page.tabPickups}
          </TabButton>
          <TabButton
            active={activeTab === "shipments"}
            onClick={() => setActiveTab("shipments")}
            count={shipmentsCount}
          >
            {LABELS.page.tabActiveShipments}
          </TabButton>
        </div>

        {/* Shipment filters (only visible on shipments tab) */}
        {activeTab === "shipments" && (
          <div className="flex items-center gap-3 px-6 py-3">
            <Select
              size="small"
              value={shipmentStatusFilter || "all"}
              onValueChange={(val) => {
                setShipmentStatusFilter(val === "all" ? "" : val)
                setShipmentPage(1)
              }}
            >
              <Select.Trigger>
                <Select.Value placeholder="Alle Status" />
              </Select.Trigger>
              <Select.Content>
                <Select.Item value="all">Alle Status</Select.Item>
                {Object.entries(LABELS.status).map(([value, label]) => (
                  <Select.Item key={value} value={value}>
                    {label}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select>

            <Select
              size="small"
              value={shipmentTypeFilter || "all"}
              onValueChange={(val) => {
                setShipmentTypeFilter(val === "all" ? "" : val)
                setShipmentPage(1)
              }}
            >
              <Select.Trigger>
                <Select.Value placeholder="Alle Typen" />
              </Select.Trigger>
              <Select.Content>
                <Select.Item value="all">Alle Typen</Select.Item>
                <Select.Item value="false">{LABELS.shipments.typeOutbound}</Select.Item>
                <Select.Item value="true">{LABELS.shipments.typeReturn}</Select.Item>
              </Select.Content>
            </Select>
          </div>
        )}

        {/* Tab content */}
        {activeTab === "open" && (
          <OpenOrdersSection
            orders={deliveryOrders}
            isLoading={ordersIsLoading}
            isError={ordersIsError}
            onFulfill={handleFulfill}
          />
        )}

        {activeTab === "pickup" && (
          <PickupOrdersSection
            orders={pickupOrders}
            isLoading={ordersIsLoading}
            isError={ordersIsError}
            onRefresh={refreshAll}
          />
        )}

        {activeTab === "shipments" && (
          <ActiveShipmentsSection
            shipments={shipments}
            totalCount={shipmentsCount}
            currentPage={shipmentPage}
            pageSize={SHIPMENT_PAGE_SIZE}
            isLoading={shipmentsQuery.isLoading}
            isError={shipmentsQuery.isError}
            onPageChange={setShipmentPage}
          />
        )}
      </Container>

      {/* Fulfillment Wizard Modal */}
      <FulfillmentWizard
        orderId={wizardOrderId}
        onClose={handleWizardClose}
        onCompleted={handleWizardCompleted}
      />
    </>
  )
}

function TabButton({
  active,
  onClick,
  count,
  children,
}: {
  active: boolean
  onClick: () => void
  count: number
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative px-6 py-3 text-sm font-medium transition-colors ${
        active
          ? "text-ui-fg-base"
          : "text-ui-fg-subtle hover:text-ui-fg-base"
      }`}
    >
      <span className="flex items-center gap-x-2">
        {children}
        {count > 0 && (
          <span
            className={`inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-xs ${
              active
                ? "bg-ui-bg-interactive text-ui-fg-on-color"
                : "bg-ui-bg-field text-ui-fg-subtle"
            }`}
          >
            {count}
          </span>
        )}
      </span>
      {active && (
        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-ui-fg-base" />
      )}
    </button>
  )
}

export const config = defineRouteConfig({
  label: "Versand",
  icon: TruckFast,
})

export default SendcloudDashboardPage
