"use client"
import { HttpTypes } from "@medusajs/types"
import { Text } from "@medusajs/ui"
import { useTranslations } from "next-intl"
import { Button, toast} from "@medusajs/ui"
import { useState } from "react"
import { sdk } from "@lib/config"

type OrderDetailsProps = {
  order: HttpTypes.StoreOrder
  showStatus?: boolean
}

const OrderDetails = ({ order, showStatus }: OrderDetailsProps) => {
  const t = useTranslations("order")
   const [isDownloading, setIsDownloading] = useState(false)

  const downloadInvoice = async () => {
    setIsDownloading(true)
    
    try {
      const response: Response = await sdk.client.fetch(
        `/store/orders/${order.id}/invoices`, 
        {
          method: "GET",
          headers: {
            "accept": "application/pdf",
          },
        }
      )
  
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `invoice-${order.id}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      setIsDownloading(false)
      toast.success("Invoice generated and downloaded successfully")
    } catch (error) {
      toast.error(`Failed to generate invoice: ${error}`)
      setIsDownloading(false)
    }
  }


  const formatStatus = (str: string) => {
    const formatted = str.split("_").join(" ")

    return formatted.slice(0, 1).toUpperCase() + formatted.slice(1)
  }

  return (
    <div>
      <Text>
        {t("confirmationSentTo")}{" "}
        <span
          className="text-ui-fg-medium-plus font-semibold"
          data-testid="order-email"
        >
          {order.email}
        </span>
        .
      </Text>
      <Text className="mt-2">
        {t("orderDate")}{" "}
        <span data-testid="order-date">
          {new Date(order.created_at).toDateString()}
        </span>
      </Text>
      <div className="flex gap-2 items-center mt-2">
      <Text className="text-ui-fg-interactive">
        Order number: <span data-testid="order-id">{order.display_id}</span>
      </Text>
      <Button 
        variant="secondary" 
        onClick={downloadInvoice} 
        disabled={isDownloading} 
        isLoading={isDownloading}
      >
        Rechnungs-Download
      </Button>
    </div>


      <div className="flex items-center text-compact-small gap-x-4 mt-4">
        {showStatus && (
          <>
            <Text>
              {t("orderStatus")}{" "}
              <span className="text-ui-fg-subtle " data-testid="order-status">
                {/* TODO: Check where the statuses should come from */}
                 {formatStatus(order.status)}
              </span>
            </Text>
            <Text>
              {t("paymentStatus")}{" "}
              <span
                className="text-ui-fg-subtle "
                sata-testid="order-payment-status"
              >
                {formatStatus(order.payment_status)}
              </span>
            </Text>
          </>
        )}
      </div>
    </div>
  )
}

export default OrderDetails
