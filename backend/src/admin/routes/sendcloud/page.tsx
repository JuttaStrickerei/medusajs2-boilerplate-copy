import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Text, Button, Select } from "@medusajs/ui"
import { TruckFast, ArrowPath } from "@medusajs/icons"
import { useState, useCallback } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { sdk } from "../../lib/sdk"
import { OpenOrdersSection } from "./components/open-orders-section"
import { ActiveShipmentsSection } from "./components/active-shipments-section"
import { FulfillmentWizard } from "./components/fulfillment-wizard"
import { LABELS } from "./components/dashboard-labels"
import type { OpenOrder, DashboardShipmentsResponse } from "./components/types"

type TabId = "open" | "shipments"

const REFETCH_INTERVAL = 60_000
const SHIPMENT_PAGE_SIZE = 20

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
      const OPEN_STATUSES = new Set(["not_fulfilled", "partially_fulfilled"])
      return orders.filter((o) => OPEN_STATUSES.has(o.fulfillment_status))
    },
    refetchInterval: REFETCH_INTERVAL,
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
            count={openOrders.length}
          >
            {LABELS.page.tabOpenOrders}
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
            orders={openOrders}
            isLoading={openOrdersQuery.isLoading}
            isError={openOrdersQuery.isError}
            onFulfill={handleFulfill}
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
