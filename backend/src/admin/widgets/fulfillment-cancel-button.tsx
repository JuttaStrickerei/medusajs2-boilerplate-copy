import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Text, Button, toast, Prompt, Badge } from "@medusajs/ui"
import { DetailWidgetProps, AdminOrder } from "@medusajs/framework/types"
import { useState, useEffect } from "react"
import { Trash, CheckCircle, DocumentText, ArrowDownTray } from "@medusajs/icons"

type Fulfillment = {
  id: string
  canceled_at: string | null
  shipped_at: string | null
  delivered_at: string | null
  data: {
    parcel_id?: number
    label_url?: string
    sendcloud_label_url?: string
    tracking_number?: string
    is_return?: boolean
  } | null
  labels?: Array<{ label_url: string; tracking_number?: string }>
}

type FulfillmentWithStatus = Fulfillment & {
  status: "cancellable" | "delivered" | "shipped"
}

/**
 * Widget that adds a "Cancel Fulfillment" button with confirmation for Sendcloud parcels
 * 
 * Shows only for active Sendcloud fulfillments (not canceled, not return).
 * - If delivered: shows "Delivered" badge
 * - If shipped: shows "Shipped" badge  
 * - Otherwise: shows cancel button with confirmation dialog
 */
const FulfillmentCancelButtonWidget = ({ 
  data: order 
}: DetailWidgetProps<AdminOrder>) => {
  const [fulfillments, setFulfillments] = useState<FulfillmentWithStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [cancelingId, setCancelingId] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  // Fetch fulfillments for this order
  useEffect(() => {
    const fetchFulfillments = async () => {
      if (!order?.id) {
        setLoading(false)
        return
      }
      
      try {
        const response = await fetch(
          `/admin/orders/${order.id}?fields=fulfillments.*`,
          { credentials: "include" }
        )
        
        if (response.ok) {
          const data = await response.json()
          const allFulfillments = (data.order?.fulfillments || []) as Fulfillment[]
          
          // Filter: only non-canceled, non-return fulfillments with parcel_id
          const sendcloudFulfillments = allFulfillments
            .filter(f => 
              !f.canceled_at && 
              !f.data?.is_return &&
              f.data?.parcel_id
            )
            .map(f => ({
              ...f,
              status: f.delivered_at 
                ? "delivered" as const
                : f.shipped_at 
                  ? "shipped" as const
                  : "cancellable" as const
            }))
          
          setFulfillments(sendcloudFulfillments)
        }
      } catch (err) {
        console.error("Error fetching fulfillments:", err)
      } finally {
        setLoading(false)
      }
    }
    
    fetchFulfillments()
  }, [order?.id])

  // Download label for a fulfillment
  const handleDownloadLabel = async (fulfillment: FulfillmentWithStatus) => {
    const parcelId = fulfillment.data?.parcel_id
    if (!parcelId) {
      toast.error("Keine Parcel-ID gefunden")
      return
    }
    
    setDownloadingId(fulfillment.id)
    
    try {
      // Use our public label endpoint (A6 format by default)
      const backendUrl = window.location.origin
      const labelUrl = `${backendUrl}/labels/${parcelId}`
      
      const response = await fetch(labelUrl)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || "Fehler beim Laden des Labels")
      }
      
      // Get the blob and trigger download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `shipping-label-${parcelId}-A6.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success("Label wurde heruntergeladen")
    } catch (err) {
      console.error("Error downloading label:", err)
      toast.error(err instanceof Error ? err.message : "Fehler beim Herunterladen")
    } finally {
      setDownloadingId(null)
    }
  }

  // Cancel fulfillment - confirmation is handled by the Prompt dialog in the UI
  const handleCancel = async (fulfillmentId: string) => {
    setCancelingId(fulfillmentId)
    
    try {
      // Call our custom cancel endpoint (no query params needed - confirmation is done in UI)
      const response = await fetch(`/admin/orders/${order.id}/fulfillments/${fulfillmentId}/cancel`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to cancel")
      }
      
      toast.success("Fulfillment erfolgreich storniert")
      
      // Remove from list
      setFulfillments(prev => prev.filter(f => f.id !== fulfillmentId))
      
      // Refresh the page to show updated data
      window.location.reload()
      
    } catch (err) {
      console.error("Error canceling fulfillment:", err)
      toast.error(err instanceof Error ? err.message : "Fehler beim Stornieren")
    } finally {
      setCancelingId(null)
    }
  }

  // Don't show if loading or no cancellable fulfillments
  if (loading || fulfillments.length === 0) {
    return null
  }

  // Check if there are any cancellable fulfillments
  const hasCancellable = fulfillments.some(f => f.status === "cancellable")

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h2">Sendcloud Fulfillments</Heading>
          <Text className="text-ui-fg-subtle text-sm">
            {hasCancellable ? "Stornieren von Sendcloud Paketen" : "Status der Sendcloud Pakete"}
          </Text>
        </div>
      </div>

      <div className="px-6 py-4 space-y-3">
        {fulfillments.map((fulfillment, index) => {
          const hasLabel = fulfillment.data?.label_url || 
                          fulfillment.data?.sendcloud_label_url ||
                          (fulfillment.labels && fulfillment.labels.length > 0)
          const trackingNumber = fulfillment.data?.tracking_number
          const isAnnounced = hasLabel

          return (
            <div 
              key={fulfillment.id}
              className="p-3 bg-ui-bg-field rounded-lg"
            >
              {/* Header row */}
              <div className="flex items-center justify-between mb-2">
                <div>
                  <Text className="font-medium">
                    Sendung #{index + 1}
                  </Text>
                  {trackingNumber && (
                    <Text className="text-ui-fg-subtle text-sm font-mono">
                      {trackingNumber}
                    </Text>
                  )}
                  {fulfillment.status === "cancellable" && isAnnounced && (
                    <Text className="text-ui-fg-warning text-xs">
                      ⚠️ Label bereits erstellt
                    </Text>
                  )}
                </div>

                {/* Status badges */}
                {fulfillment.status === "delivered" && (
                  <Badge color="green" className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Zugestellt
                  </Badge>
                )}
                {fulfillment.status === "shipped" && (
                  <Badge color="blue">
                    Unterwegs
                  </Badge>
                )}
              </div>

              {/* Action buttons row */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Label Download Button */}
                {hasLabel && (
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={() => handleDownloadLabel(fulfillment)}
                    disabled={downloadingId === fulfillment.id}
                    isLoading={downloadingId === fulfillment.id}
                  >
                    <ArrowDownTray className="mr-1" />
                    Label (A6)
                  </Button>
                )}

                {/* Cancellable - show cancel button */}
                {fulfillment.status === "cancellable" && isAnnounced && (
                  <Prompt>
                    <Prompt.Trigger asChild>
                      <Button
                        variant="danger"
                        size="small"
                        disabled={cancelingId === fulfillment.id}
                        isLoading={cancelingId === fulfillment.id}
                      >
                        <Trash className="mr-1" />
                        Stornieren
                      </Button>
                    </Prompt.Trigger>
                    <Prompt.Content>
                      <Prompt.Header>
                        <Prompt.Title>Fulfillment stornieren?</Prompt.Title>
                        <Prompt.Description>
                          ⚠️ <strong>ACHTUNG:</strong> Das Paket wurde bereits bei Sendcloud 
                          angemeldet (Label erstellt). Das Stornieren <strong>löscht das Paket 
                          dauerhaft</strong> aus Sendcloud. Diese Aktion kann nicht rückgängig 
                          gemacht werden.
                          {trackingNumber && (
                            <><br /><br />Tracking: <code>{trackingNumber}</code></>
                          )}
                        </Prompt.Description>
                      </Prompt.Header>
                      <Prompt.Footer>
                        <Prompt.Cancel>Abbrechen</Prompt.Cancel>
                        <Prompt.Action 
                          onClick={() => handleCancel(fulfillment.id)}
                        >
                          Ja, dauerhaft löschen
                        </Prompt.Action>
                      </Prompt.Footer>
                    </Prompt.Content>
                  </Prompt>
                )}

                {/* Cancellable without label */}
                {fulfillment.status === "cancellable" && !isAnnounced && (
                  <Prompt>
                    <Prompt.Trigger asChild>
                      <Button
                        variant="danger"
                        size="small"
                        disabled={cancelingId === fulfillment.id}
                        isLoading={cancelingId === fulfillment.id}
                      >
                        <Trash className="mr-1" />
                        Stornieren
                      </Button>
                    </Prompt.Trigger>
                    <Prompt.Content>
                      <Prompt.Header>
                        <Prompt.Title>Fulfillment stornieren?</Prompt.Title>
                        <Prompt.Description>
                          Das Fulfillment und das Sendcloud-Paket werden storniert.
                        </Prompt.Description>
                      </Prompt.Header>
                      <Prompt.Footer>
                        <Prompt.Cancel>Abbrechen</Prompt.Cancel>
                        <Prompt.Action onClick={() => handleCancel(fulfillment.id)}>
                          Stornieren
                        </Prompt.Action>
                      </Prompt.Footer>
                    </Prompt.Content>
                  </Prompt>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "order.details.side.after",
})

export default FulfillmentCancelButtonWidget
