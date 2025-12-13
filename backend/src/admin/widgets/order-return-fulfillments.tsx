import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Text, Badge, Button, clx, toast, Prompt } from "@medusajs/ui"
import { DetailWidgetProps, AdminOrder } from "@medusajs/framework/types"
import { useEffect, useState } from "react"
import { 
  ArrowUturnLeft, 
  DocumentText,
  TruckFast,
  XCircle,
  CheckCircle,
  Clock,
  Trash
} from "@medusajs/icons"

type ReturnFulfillment = {
  id: string
  created_at: string
  canceled_at: string | null
  shipped_at: string | null
  delivered_at: string | null
  data: {
    tracking_number?: string
    tracking_url?: string
    label_url?: string
    parcel_id?: number
    sendcloud_announced?: boolean
    is_return?: boolean
    order?: {
      display_id?: string | number
    }
  } | null
  labels?: Array<{
    tracking_number: string
    tracking_url: string
    label_url: string
  }>
}

type ReturnWithFulfillments = {
  id: string
  status: string
  created_at: string
  fulfillments: ReturnFulfillment[]
}

const getStatusBadge = (fulfillment: ReturnFulfillment) => {
  if (fulfillment.canceled_at) {
    return <Badge color="red" size="xsmall">Storniert</Badge>
  }
  if (fulfillment.delivered_at) {
    return <Badge color="green" size="xsmall">Zugestellt</Badge>
  }
  if (fulfillment.shipped_at) {
    return <Badge color="blue" size="xsmall">Unterwegs</Badge>
  }
  return <Badge color="orange" size="xsmall">Wartet auf Abholung</Badge>
}

const getStatusIcon = (fulfillment: ReturnFulfillment) => {
  if (fulfillment.canceled_at) {
    return <XCircle className="text-ui-fg-error" />
  }
  if (fulfillment.delivered_at) {
    return <CheckCircle className="text-ui-fg-success" />
  }
  if (fulfillment.shipped_at) {
    return <TruckFast className="text-ui-fg-interactive" />
  }
  return <Clock className="text-ui-fg-warning" />
}

const OrderReturnFulfillmentsWidget = ({ 
  data: order 
}: DetailWidgetProps<AdminOrder>) => {
  const [returns, setReturns] = useState<ReturnWithFulfillments[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cancelingReturn, setCancelingReturn] = useState<string | null>(null)
  const [downloadingLabel, setDownloadingLabel] = useState<string | null>(null)

  const fetchReturns = async () => {
    try {
      setLoading(true)
      
      // Fetch returns for this order with their fulfillments
      const response = await fetch(
        `/admin/returns?order_id=${order.id}&fields=id,status,created_at,fulfillments.*`,
        {
          credentials: "include",
        }
      )
      
      if (!response.ok) {
        throw new Error("Failed to fetch returns")
      }
      
      const data = await response.json()
      setReturns(data.returns || [])
    } catch (err) {
      console.error("Error fetching returns:", err)
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (order?.id) {
      fetchReturns()
    } else {
      setLoading(false)
    }
  }, [order?.id])

  // Download label via our proxy endpoint
  const handleDownloadLabel = async (fulfillmentId: string) => {
    setDownloadingLabel(fulfillmentId)
    
    try {
      const response = await fetch(`/admin/fulfillments/${fulfillmentId}/label`, {
        credentials: "include",
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || "Failed to download label")
      }
      
      // Get the blob and trigger download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      
      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get("Content-Disposition")
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/)
      a.download = filenameMatch?.[1] || `return-label-${fulfillmentId}.pdf`
      
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success("Label wurde heruntergeladen")
    } catch (err) {
      console.error("Error downloading label:", err)
      toast.error(err instanceof Error ? err.message : "Fehler beim Herunterladen")
    } finally {
      setDownloadingLabel(null)
    }
  }

  // Cancel return (which also cancels fulfillments)
  const handleCancelReturn = async (returnId: string) => {
    setCancelingReturn(returnId)
    
    try {
      const response = await fetch(`/admin/returns/${returnId}/cancel`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || "Failed to cancel return")
      }
      
      toast.success("Retoure wurde storniert")
      
      // Refresh the data
      await fetchReturns()
    } catch (err) {
      console.error("Error canceling return:", err)
      toast.error(err instanceof Error ? err.message : "Fehler beim Stornieren")
    } finally {
      setCancelingReturn(null)
    }
  }

  // Filter returns that have fulfillments
  const returnsWithFulfillments = returns.filter(
    (r) => r.fulfillments && r.fulfillments.length > 0
  )

  // Don't show widget while loading, on error, or if no return fulfillments
  if (loading || error || returnsWithFulfillments.length === 0) {
    return null
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <ArrowUturnLeft className="text-ui-fg-subtle" />
          <Heading level="h2">Retouren Fulfillments</Heading>
        </div>
        <Badge color="grey" size="xsmall">
          {returnsWithFulfillments.reduce((acc, r) => acc + r.fulfillments.length, 0)} Sendung(en)
        </Badge>
      </div>

      <div className="divide-y">
        {returnsWithFulfillments.map((returnData) => (
          <div key={returnData.id}>
            {returnData.fulfillments.map((fulfillment, index) => {
              // Get tracking info from labels array (preferred) or data field
              const trackingNumber = 
                fulfillment.labels?.[0]?.tracking_number || 
                fulfillment.data?.tracking_number || 
                null
              const trackingUrl = 
                fulfillment.labels?.[0]?.tracking_url || 
                fulfillment.data?.tracking_url || 
                null
              const hasLabel = 
                fulfillment.labels?.[0]?.label_url || 
                fulfillment.data?.label_url ||
                fulfillment.data?.parcel_id

              const isCanceled = !!fulfillment.canceled_at
              const canCancel = !isCanceled && !fulfillment.shipped_at

              return (
                <div 
                  key={fulfillment.id} 
                  className={clx(
                    "px-6 py-4",
                    isCanceled && "opacity-60"
                  )}
                >
                  {/* Header with status */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(fulfillment)}
                      <Text className="font-medium">
                        Retouren-Sendung #{index + 1}
                      </Text>
                    </div>
                    {getStatusBadge(fulfillment)}
                  </div>

                  {/* Tracking Info */}
                  {trackingNumber && (
                    <div className="bg-ui-bg-field rounded-lg p-3 mb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <Text className="text-ui-fg-subtle text-sm">
                            Tracking Nummer
                          </Text>
                          <Text className="font-mono font-medium">
                            {trackingNumber}
                          </Text>
                        </div>
                        {trackingUrl && (
                          <Button
                            variant="secondary"
                            size="small"
                            onClick={() => window.open(trackingUrl, "_blank")}
                          >
                            <TruckFast className="mr-1" />
                            Tracking
                          </Button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  {!isCanceled && (
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Label Download - use our proxy endpoint */}
                      {hasLabel && (
                        <Button
                          variant="secondary"
                          size="small"
                          onClick={() => handleDownloadLabel(fulfillment.id)}
                          isLoading={downloadingLabel === fulfillment.id}
                          disabled={downloadingLabel === fulfillment.id}
                        >
                          <DocumentText className="mr-1" />
                          Label herunterladen
                        </Button>
                      )}

                      {/* Cancel Button */}
                      {canCancel && (
                        <Prompt>
                          <Prompt.Trigger asChild>
                            <Button
                              variant="danger"
                              size="small"
                              disabled={cancelingReturn === returnData.id}
                            >
                              <Trash className="mr-1" />
                              Stornieren
                            </Button>
                          </Prompt.Trigger>
                          <Prompt.Content>
                            <Prompt.Header>
                              <Prompt.Title>Retoure stornieren?</Prompt.Title>
                              <Prompt.Description>
                                Diese Aktion storniert die Retoure und das zugehörige 
                                Sendcloud-Paket. Diese Aktion kann nicht rückgängig gemacht werden.
                              </Prompt.Description>
                            </Prompt.Header>
                            <Prompt.Footer>
                              <Prompt.Cancel>Abbrechen</Prompt.Cancel>
                              <Prompt.Action 
                                onClick={() => handleCancelReturn(returnData.id)}
                              >
                                {cancelingReturn === returnData.id ? "Wird storniert..." : "Stornieren"}
                              </Prompt.Action>
                            </Prompt.Footer>
                          </Prompt.Content>
                        </Prompt>
                      )}
                    </div>
                  )}

                  {/* No tracking info message */}
                  {!trackingNumber && !isCanceled && (
                    <div className="bg-ui-bg-field-hover rounded-lg p-3 mt-3">
                      <Text className="text-ui-fg-subtle text-sm">
                        Tracking-Informationen werden geladen...
                      </Text>
                    </div>
                  )}

                  {/* Canceled message */}
                  {isCanceled && (
                    <div className="bg-ui-bg-field-hover rounded-lg p-3">
                      <Text className="text-ui-fg-subtle text-sm">
                        Diese Sendung wurde storniert am{" "}
                        {new Date(fulfillment.canceled_at!).toLocaleDateString("de-DE", {
                          day: "2-digit",
                          month: "2-digit", 
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </Text>
                    </div>
                  )}

                  {/* Meta info */}
                  <div className="mt-3 pt-3 border-t border-ui-border-base">
                    <Text className="text-ui-fg-muted text-xs">
                      Erstellt: {new Date(fulfillment.created_at).toLocaleDateString("de-DE", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                      {fulfillment.data?.parcel_id && (
                        <> • Sendcloud ID: {fulfillment.data.parcel_id}</>
                      )}
                    </Text>
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "order.details.side.after",
})

export default OrderReturnFulfillmentsWidget
