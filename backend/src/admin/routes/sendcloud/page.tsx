import { defineRouteConfig } from "@medusajs/admin-sdk"
import {
  Container,
  Heading,
  Table,
  Text,
  Badge,
  Button,
  Select,
} from "@medusajs/ui"
import { TruckFast, ArrowDownTray, ArrowPath } from "@medusajs/icons"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"

type SendcloudShipment = {
  id: string
  order_id: string
  sendcloud_id: string | null
  tracking_number: string | null
  tracking_url: string | null
  carrier: string | null
  status: string
  is_return: boolean
  recipient_name: string
  recipient_city: string
  recipient_postal_code: string
  recipient_country: string
  error_message: string | null
  label_url: string | null
  shipped_at: string | null
  delivered_at: string | null
  created_at: string
}

type ShipmentsResponse = {
  sendcloud_shipments: SendcloudShipment[]
  count: number
  offset: number
  limit: number
}

const STATUS_COLORS: Record<string, "green" | "blue" | "red" | "orange" | "grey" | "purple"> = {
  delivered: "green",
  en_route: "blue",
  sorted: "blue",
  en_route_to_sorting_center: "blue",
  delivered_at_sorting_center: "blue",
  announced: "blue",
  exception: "red",
  canceled: "red",
  returned: "purple",
  pending: "orange",
  created: "grey",
  unknown: "grey",
}

const STATUS_LABELS: Record<string, string> = {
  created: "Erstellt",
  pending: "Wartend",
  announced: "Angemeldet",
  en_route_to_sorting_center: "Zum Sortierzentrum",
  delivered_at_sorting_center: "Im Sortierzentrum",
  sorted: "Sortiert",
  en_route: "Unterwegs",
  delivered: "Zugestellt",
  exception: "Problem",
  canceled: "Storniert",
  returned: "Retourniert",
  unknown: "Unbekannt",
}

const formatDate = (dateString: string | null) => {
  if (!dateString) return "-"
  return new Date(dateString).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

const SendcloudOverviewPage = () => {
  const [currentPage, setCurrentPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string>("")
  const [returnFilter, setReturnFilter] = useState<string>("")
  const pageSize = 20

  const queryParams = new URLSearchParams({
    limit: pageSize.toString(),
    offset: ((currentPage - 1) * pageSize).toString(),
  })
  if (statusFilter) queryParams.set("status", statusFilter)
  if (returnFilter) queryParams.set("is_return", returnFilter)

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["sendcloud-shipments", currentPage, statusFilter, returnFilter],
    queryFn: async () => {
      const response = await fetch(
        `/admin/sendcloud-shipments?${queryParams}`,
        {
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        }
      )
      if (!response.ok) throw new Error("Fehler beim Laden der Sendungen")
      return response.json() as Promise<ShipmentsResponse>
    },
  })

  const shipments = data?.sendcloud_shipments || []
  const totalCount = data?.count || 0
  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h1">Sendcloud Sendungen</Heading>
          <Text className="text-ui-fg-subtle mt-1">
            {totalCount} Sendung{totalCount !== 1 ? "en" : ""} insgesamt
          </Text>
        </div>
        <Button variant="secondary" size="small" onClick={() => refetch()}>
          <ArrowPath className="mr-1" />
          Aktualisieren
        </Button>
      </div>

      <div className="flex items-center gap-3 px-6 py-3">
        <Select
          size="small"
          value={statusFilter}
          onValueChange={(val) => {
            setStatusFilter(val)
            setCurrentPage(1)
          }}
        >
          <Select.Trigger>
            <Select.Value placeholder="Alle Status" />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="">Alle Status</Select.Item>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <Select.Item key={value} value={value}>
                {label}
              </Select.Item>
            ))}
          </Select.Content>
        </Select>

        <Select
          size="small"
          value={returnFilter}
          onValueChange={(val) => {
            setReturnFilter(val)
            setCurrentPage(1)
          }}
        >
          <Select.Trigger>
            <Select.Value placeholder="Alle Typen" />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="">Alle Typen</Select.Item>
            <Select.Item value="false">Versand</Select.Item>
            <Select.Item value="true">Retoure</Select.Item>
          </Select.Content>
        </Select>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Text className="text-ui-fg-subtle">Laden...</Text>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-center py-12">
          <Text className="text-ui-fg-error">
            Fehler: {error instanceof Error ? error.message : "Unbekannter Fehler"}
          </Text>
        </div>
      )}

      {!isLoading && !error && shipments.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <Text className="text-ui-fg-subtle">
            Keine Sendungen gefunden
          </Text>
        </div>
      )}

      {!isLoading && !error && shipments.length > 0 && (
        <>
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Bestellung</Table.HeaderCell>
                <Table.HeaderCell>Empfänger</Table.HeaderCell>
                <Table.HeaderCell>Ziel</Table.HeaderCell>
                <Table.HeaderCell>Carrier</Table.HeaderCell>
                <Table.HeaderCell>Status</Table.HeaderCell>
                <Table.HeaderCell>Typ</Table.HeaderCell>
                <Table.HeaderCell>Tracking</Table.HeaderCell>
                <Table.HeaderCell>Erstellt</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {shipments.map((shipment) => (
                <Table.Row key={shipment.id}>
                  <Table.Cell>
                    <a
                      href={`/app/orders/${shipment.order_id}`}
                      className="text-ui-fg-interactive hover:underline"
                    >
                      {shipment.order_id.slice(0, 8)}...
                    </a>
                  </Table.Cell>
                  <Table.Cell>
                    <Text size="small" weight="plus">
                      {shipment.recipient_name}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Text size="small">
                      {shipment.recipient_postal_code} {shipment.recipient_city}
                    </Text>
                    <Text size="xsmall" className="text-ui-fg-muted">
                      {shipment.recipient_country}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    {shipment.carrier ? (
                      <Badge color="grey" size="xsmall">
                        {shipment.carrier}
                      </Badge>
                    ) : (
                      <Text size="small" className="text-ui-fg-muted">-</Text>
                    )}
                  </Table.Cell>
                  <Table.Cell>
                    <Badge
                      color={STATUS_COLORS[shipment.status] || "grey"}
                      size="xsmall"
                    >
                      {STATUS_LABELS[shipment.status] || shipment.status}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge
                      color={shipment.is_return ? "purple" : "blue"}
                      size="xsmall"
                    >
                      {shipment.is_return ? "Retoure" : "Versand"}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    {shipment.tracking_url ? (
                      <Button
                        variant="transparent"
                        size="small"
                        onClick={() =>
                          window.open(shipment.tracking_url!, "_blank")
                        }
                      >
                        <TruckFast className="mr-1" />
                        Tracking
                      </Button>
                    ) : shipment.tracking_number ? (
                      <Text size="small" className="font-mono">
                        {shipment.tracking_number}
                      </Text>
                    ) : (
                      <Text size="small" className="text-ui-fg-muted">
                        -
                      </Text>
                    )}
                  </Table.Cell>
                  <Table.Cell>
                    <Text size="small">{formatDate(shipment.created_at)}</Text>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-3">
              <Text size="small" className="text-ui-fg-subtle">
                Seite {currentPage} von {totalPages}
              </Text>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="small"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  Zurück
                </Button>
                <Button
                  variant="secondary"
                  size="small"
                  disabled={currentPage >= totalPages}
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                >
                  Weiter
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Sendcloud",
  icon: TruckFast,
})

export default SendcloudOverviewPage
