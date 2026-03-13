import { Text, Button, Badge, Table, toast } from "@medusajs/ui"
import { DocumentText, TruckFast } from "@medusajs/icons"
import { useCallback, useState } from "react"
import { StatusBadge } from "./status-badge"
import { LABELS } from "./dashboard-labels"
import type { DashboardShipment } from "./types"

type ActiveShipmentsSectionProps = {
  shipments: DashboardShipment[]
  totalCount: number
  currentPage: number
  pageSize: number
  isLoading: boolean
  isError: boolean
  onPageChange: (page: number) => void
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "—"
  return new Date(dateString).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function ActiveShipmentsSection({
  shipments,
  totalCount,
  currentPage,
  pageSize,
  isLoading,
  isError,
  onPageChange,
}: ActiveShipmentsSectionProps) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const totalPages = Math.ceil(totalCount / pageSize)

  const downloadLabel = useCallback(async (shipment: DashboardShipment) => {
    if (!shipment.parcel_id) {
      toast.error(LABELS.shipments.labelNotAvailable)
      return
    }

    setDownloadingId(shipment.fulfillment_id)
    try {
      const response = await fetch(`/labels/${shipment.parcel_id}?format=a6`)
      if (!response.ok) throw new Error("Download failed")
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `versandlabel-${shipment.parcel_id}-A6.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success("Label heruntergeladen")
    } catch {
      toast.error("Label konnte nicht heruntergeladen werden")
    } finally {
      setDownloadingId(null)
    }
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Text className="text-ui-fg-subtle">{LABELS.shipments.loading}</Text>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-ui-border-error bg-ui-bg-field-component p-4">
        <Text className="text-ui-fg-error">{LABELS.shipments.errorLoad}</Text>
      </div>
    )
  }

  if (shipments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Text size="large" weight="plus" className="text-ui-fg-subtle">
          {LABELS.shipments.emptyTitle}
        </Text>
        <Text size="small" className="text-ui-fg-muted mt-1">
          {LABELS.shipments.emptyDescription}
        </Text>
      </div>
    )
  }

  return (
    <>
      <div className="px-6 py-2">
        <Text size="small" className="text-ui-fg-subtle">
          {totalCount} {totalCount === 1 ? LABELS.shipments.totalSingular : LABELS.shipments.total}
        </Text>
      </div>

      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>{LABELS.shipments.colOrder}</Table.HeaderCell>
            <Table.HeaderCell>{LABELS.shipments.colRecipient}</Table.HeaderCell>
            <Table.HeaderCell>{LABELS.shipments.colDestination}</Table.HeaderCell>
            <Table.HeaderCell>{LABELS.shipments.colCarrier}</Table.HeaderCell>
            <Table.HeaderCell>{LABELS.shipments.colStatus}</Table.HeaderCell>
            <Table.HeaderCell>{LABELS.shipments.colType}</Table.HeaderCell>
            <Table.HeaderCell>{LABELS.shipments.colActions}</Table.HeaderCell>
            <Table.HeaderCell>{LABELS.shipments.colCreated}</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {shipments.map((shipment) => (
            <Table.Row key={shipment.fulfillment_id}>
              <Table.Cell>
                <a
                  href={`/app/orders/${shipment.order_id}`}
                  className="text-ui-fg-interactive hover:underline"
                >
                  #{shipment.order_display_id}
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
                  <Text size="small" className="text-ui-fg-muted">—</Text>
                )}
              </Table.Cell>
              <Table.Cell>
                <StatusBadge status={shipment.status} />
              </Table.Cell>
              <Table.Cell>
                <Badge
                  color={shipment.is_return ? "purple" : "blue"}
                  size="xsmall"
                >
                  {shipment.is_return ? LABELS.shipments.typeReturn : LABELS.shipments.typeOutbound}
                </Badge>
              </Table.Cell>
              <Table.Cell>
                <div className="flex items-center gap-1">
                  {shipment.label_available && (
                    <Button
                      variant="transparent"
                      size="small"
                      onClick={() => downloadLabel(shipment)}
                      disabled={downloadingId === shipment.fulfillment_id}
                      isLoading={downloadingId === shipment.fulfillment_id}
                    >
                      <DocumentText className="mr-1" />
                      {LABELS.shipments.labelButton}
                    </Button>
                  )}
                  {shipment.tracking_url && (
                    <Button
                      variant="transparent"
                      size="small"
                      onClick={() => window.open(shipment.tracking_url!, "_blank")}
                    >
                      <TruckFast className="mr-1" />
                      {LABELS.shipments.trackingButton}
                    </Button>
                  )}
                  {!shipment.label_available && !shipment.tracking_url && (
                    <Text size="small" className="text-ui-fg-muted">—</Text>
                  )}
                </div>
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
            {LABELS.shipments.page} {currentPage} {LABELS.shipments.of} {totalPages}
          </Text>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="small"
              disabled={currentPage === 1}
              onClick={() => onPageChange(currentPage - 1)}
            >
              {LABELS.shipments.prev}
            </Button>
            <Button
              variant="secondary"
              size="small"
              disabled={currentPage >= totalPages}
              onClick={() => onPageChange(currentPage + 1)}
            >
              {LABELS.shipments.next}
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
