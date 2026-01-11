"use client"

import { HttpTypes } from "@medusajs/types"
import { useState } from "react"
import { 
  Truck, 
  Package, 
  CheckCircle, 
  ExternalLink, 
  RotateCcw, 
  Copy,
  Clock,
  FileText,
  ChevronRight
} from "@components/icons"
import { Button } from "@components/ui"
import { cn } from "@lib/utils"
import {
  getTrackingUrl,
  getTrackingNumber,
  getCarrierName,
  getFulfillmentStatus,
  SendcloudFulfillmentData,
} from "@lib/util/sendcloud"
import { orderHasReturnableItems } from "@lib/util/returns"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type TrackingSectionProps = {
  order: HttpTypes.StoreOrder
}

type FulfillmentWithData = HttpTypes.StoreOrderFulfillment & {
  data?: SendcloudFulfillmentData | null
  labels?: Array<{
    tracking_number?: string
    tracking_url?: string
    label_url?: string
  }>
}

const TrackingSection = ({ order }: TrackingSectionProps) => {
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const fulfillments = (order.fulfillments || []) as FulfillmentWithData[]
  
  // Separate regular fulfillments from return fulfillments
  // WICHTIG: Gecancelte Fulfillments ausfiltern!
  const regularFulfillments = fulfillments.filter(f => {
    const data = f.data as SendcloudFulfillmentData | null
    const isCanceled = !!f.canceled_at
    return !data?.is_return && !isCanceled
  })
  
  const returnFulfillments = fulfillments.filter(f => {
    const data = f.data as SendcloudFulfillmentData | null
    const isCanceled = !!f.canceled_at
    return data?.is_return === true && !isCanceled
  })

  // Check if order is fully delivered (nur aktive Fulfillments berücksichtigen)
  const isOrderDelivered = order.fulfillment_status === "delivered" || 
    (regularFulfillments.length > 0 && regularFulfillments.every(f => getFulfillmentStatus(f) === "delivered"))
  
  // Check if there's an active return
  const hasActiveReturn = returnFulfillments.length > 0

  // Check if order is delivered (via fulfillment_status or individual fulfillments)
  const orderIsDelivered = order.fulfillment_status === "delivered"
  
  // Check if order has returnable items
  const canRequestReturn = orderHasReturnableItems(order)

  const handleCopyTracking = async (trackingNumber: string, fulfillmentId: string) => {
    try {
      await navigator.clipboard.writeText(trackingNumber)
      setCopiedId(fulfillmentId)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const formatDate = (dateStr: string | Date | null | undefined) => {
    if (!dateStr) return null
    return new Date(dateStr).toLocaleDateString("de-AT", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // === CASE 1: No fulfillments at all - Order in preparation ===
  if (fulfillments.length === 0) {
    return (
      <div className="pt-6 border-t border-stone-200">
        <h2 className="font-serif text-xl font-medium text-stone-800 mb-4">
          Bestellstatus
        </h2>
        <div className="bg-stone-50 rounded-xl p-6 text-center">
          <Package size={32} className="mx-auto mb-3 text-stone-400" />
          <p className="text-stone-600 mb-1">Ihre Bestellung wird vorbereitet</p>
          <p className="text-sm text-stone-500">
            Sobald Ihre Bestellung versendet wurde, erhalten Sie eine Benachrichtigung.
          </p>
        </div>
      </div>
    )
  }

  // === CASE 2: Order is DELIVERED - Show returns options only ===
  if ((isOrderDelivered || orderIsDelivered) && !hasActiveReturn) {
    return (
      <div className="pt-6 border-t border-stone-200">
        <h2 className="font-serif text-xl font-medium text-stone-800 mb-4">
          Bestellung & Service
        </h2>
        
        {/* Delivered Status Banner */}
        <div className="bg-green-50 rounded-xl p-5 mb-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle size={24} className="text-green-600" />
          </div>
          <div>
            <p className="font-medium text-green-800">Erfolgreich zugestellt</p>
            {regularFulfillments[0]?.delivered_at && (
              <p className="text-sm text-green-700">
                am {formatDate(regularFulfillments[0].delivered_at)}
              </p>
            )}
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 small:grid-cols-2 gap-4">
          {/* Returns Request - Internal page */}
          {canRequestReturn && (
            <LocalizedClientLink
              href={`/account/orders/details/${order.id}/return`}
              className="flex items-center gap-4 p-4 bg-white rounded-xl border border-amber-200 hover:border-amber-300 hover:shadow-sm transition-all group"
            >
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center group-hover:bg-amber-200 transition-colors">
                <RotateCcw size={20} className="text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-stone-800">Retoure anmelden</p>
                <p className="text-sm text-stone-500">Artikel zurücksenden</p>
              </div>
              <ChevronRight size={16} className="text-amber-500" />
            </LocalizedClientLink>
          )}

          {/* Invoice / Documents (Placeholder) */}
          <button
            disabled
            className="flex items-center gap-4 p-4 bg-white rounded-xl border border-stone-200 opacity-60 cursor-not-allowed"
          >
            <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center">
              <FileText size={20} className="text-stone-600" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-stone-800">Rechnung</p>
              <p className="text-sm text-stone-500">Demnächst verfügbar</p>
            </div>
          </button>
        </div>
      </div>
    )
  }

  // === CASE 3: Has active return - Show return tracking ===
  if (hasActiveReturn) {
    return (
      <div className="pt-6 border-t border-stone-200">
        <h2 className="font-serif text-xl font-medium text-stone-800 mb-4">
          Retouren-Verfolgung
        </h2>

        {returnFulfillments.map((fulfillment, index) => {
          const fulfillmentData = fulfillment.data as SendcloudFulfillmentData | null
          const status = getFulfillmentStatus(fulfillment)
          const trackingUrl = fulfillment.labels?.[0]?.tracking_url || getTrackingUrl(fulfillmentData)
          const trackingNumber = fulfillment.labels?.[0]?.tracking_number || getTrackingNumber(fulfillmentData)
          const carrier = getCarrierName(fulfillmentData)

          return (
            <div 
              key={fulfillment.id} 
              className="bg-white rounded-xl border border-amber-200 overflow-hidden"
            >
              {/* Status Header */}
              <div className="px-5 py-4 flex items-center justify-between bg-amber-50 border-b border-amber-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                    <RotateCcw size={20} className="text-amber-600" />
                  </div>
                  <div>
                    <p className="font-medium text-amber-800">
                      Retoure {status === "delivered" ? "angekommen" : "unterwegs"}
                    </p>
                    {carrier && (
                      <p className="text-sm text-amber-600">via {carrier}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Tracking Info */}
              <div className="p-5 space-y-4">
                {trackingNumber && (
                  <div className="flex items-center gap-3 bg-stone-50 rounded-lg px-4 py-3">
                    <div className="flex-1">
                      <p className="text-xs text-stone-500 mb-0.5">Retouren-Sendungsnummer</p>
                      <p className="font-mono text-stone-800 font-medium">{trackingNumber}</p>
                    </div>
                    <button
                      onClick={() => handleCopyTracking(trackingNumber, fulfillment.id)}
                      className="p-2 text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
                      title="Kopieren"
                    >
                      {copiedId === fulfillment.id ? (
                        <CheckCircle size={18} className="text-green-600" />
                      ) : (
                        <Copy size={18} />
                      )}
                    </button>
                  </div>
                )}

                {trackingUrl && (
                  <a
                    href={trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex"
                  >
                    <Button variant="secondary" size="sm">
                      <Truck size={16} className="mr-2" />
                      Retoure verfolgen
                      <ExternalLink size={14} className="ml-2 opacity-60" />
                    </Button>
                  </a>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // === CASE 4: Order is IN TRANSIT - Show tracking ===
  return (
    <div className="pt-6 border-t border-stone-200">
      <h2 className="font-serif text-xl font-medium text-stone-800 mb-4">
        Sendungsverfolgung
      </h2>

      <div className="space-y-4">
        {regularFulfillments.map((fulfillment, index) => {
          const fulfillmentData = fulfillment.data as SendcloudFulfillmentData | null
          const status = getFulfillmentStatus(fulfillment)
          const trackingUrl = fulfillment.labels?.[0]?.tracking_url || getTrackingUrl(fulfillmentData)
          const trackingNumber = fulfillment.labels?.[0]?.tracking_number || getTrackingNumber(fulfillmentData)
          const carrier = getCarrierName(fulfillmentData)

          // Skip pending fulfillments
          if (status === "pending") {
            return (
              <div key={fulfillment.id} className="bg-stone-50 rounded-xl p-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center">
                  <Clock size={20} className="text-stone-500" />
                </div>
                <div>
                  <p className="font-medium text-stone-700">Wird vorbereitet</p>
                  <p className="text-sm text-stone-500">
                    Sendung {index + 1} wird für den Versand vorbereitet
                  </p>
                </div>
              </div>
            )
          }

          // Delivered fulfillment - show green success state
          if (status === "delivered") {
            return (
              <div 
                key={fulfillment.id} 
                className="bg-white rounded-xl border border-green-200 overflow-hidden"
              >
                {/* Status Header - Delivered */}
                <div className="px-5 py-4 flex items-center justify-between bg-green-50 border-b border-green-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle size={20} className="text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-green-800">Erfolgreich zugestellt</p>
                      {carrier && (
                        <p className="text-sm text-green-600">via {carrier}</p>
                      )}
                    </div>
                  </div>
                  
                  {regularFulfillments.length > 1 && (
                    <span className="text-sm text-green-600">
                      Sendung {index + 1} von {regularFulfillments.length}
                    </span>
                  )}
                </div>

                {/* Tracking Info */}
                <div className="p-5 space-y-4">
                  {/* Delivered Date */}
                  {fulfillment.delivered_at && (
                    <div className="text-sm">
                      <span className="text-stone-500">Zugestellt:</span>
                      <span className="ml-2 text-green-700 font-medium">
                        {formatDate(fulfillment.delivered_at)}
                      </span>
                    </div>
                  )}

                  {/* Tracking Number */}
                  {trackingNumber && (
                    <div className="flex items-center gap-3 bg-stone-50 rounded-lg px-4 py-3">
                      <div className="flex-1">
                        <p className="text-xs text-stone-500 mb-0.5">Sendungsnummer</p>
                        <p className="font-mono text-stone-800 font-medium">{trackingNumber}</p>
                      </div>
                      <button
                        onClick={() => handleCopyTracking(trackingNumber, fulfillment.id)}
                        className="p-2 text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
                        title="Kopieren"
                      >
                        {copiedId === fulfillment.id ? (
                          <CheckCircle size={18} className="text-green-600" />
                        ) : (
                          <Copy size={18} />
                        )}
                      </button>
                    </div>
                  )}

                  {/* Action Button */}
                  {trackingUrl && (
                    <a
                      href={trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex"
                    >
                      <Button variant="secondary" size="sm">
                        <Truck size={16} className="mr-2" />
                        Sendungsverlauf
                        <ExternalLink size={14} className="ml-2 opacity-60" />
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            )
          }

          // In transit fulfillment - show blue state
          return (
            <div 
              key={fulfillment.id} 
              className="bg-white rounded-xl border border-blue-200 overflow-hidden"
            >
              {/* Status Header */}
              <div className="px-5 py-4 flex items-center justify-between bg-blue-50 border-b border-blue-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Truck size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-blue-800">Unterwegs zu Ihnen</p>
                    {carrier && (
                      <p className="text-sm text-blue-600">via {carrier}</p>
                    )}
                  </div>
                </div>
                
                {regularFulfillments.length > 1 && (
                  <span className="text-sm text-blue-600">
                    Sendung {index + 1} von {regularFulfillments.length}
                  </span>
                )}
              </div>

              {/* Tracking Info */}
              <div className="p-5 space-y-4">
                {/* Shipped Date */}
                {fulfillment.shipped_at && (
                  <div className="text-sm">
                    <span className="text-stone-500">Versendet:</span>
                    <span className="ml-2 text-stone-800 font-medium">
                      {formatDate(fulfillment.shipped_at)}
                    </span>
                  </div>
                )}

                {/* Tracking Number */}
                {trackingNumber && (
                  <div className="flex items-center gap-3 bg-stone-50 rounded-lg px-4 py-3">
                    <div className="flex-1">
                      <p className="text-xs text-stone-500 mb-0.5">Sendungsnummer</p>
                      <p className="font-mono text-stone-800 font-medium">{trackingNumber}</p>
                    </div>
                    <button
                      onClick={() => handleCopyTracking(trackingNumber, fulfillment.id)}
                      className="p-2 text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
                      title="Kopieren"
                    >
                      {copiedId === fulfillment.id ? (
                        <CheckCircle size={18} className="text-green-600" />
                      ) : (
                        <Copy size={18} />
                      )}
                    </button>
                  </div>
                )}

                {/* Action Button */}
                {trackingUrl && (
                  <a
                    href={trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex"
                  >
                    <Button variant="primary" size="sm">
                      <Truck size={16} className="mr-2" />
                      Sendung verfolgen
                      <ExternalLink size={14} className="ml-2 opacity-60" />
                    </Button>
                  </a>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default TrackingSection
