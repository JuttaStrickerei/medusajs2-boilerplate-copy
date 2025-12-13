import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

/**
 * GET /admin/fulfillments/:id/label
 * 
 * Downloads the shipping label for a fulfillment.
 * This endpoint proxies the request to Sendcloud (with auth) and returns the PDF.
 * 
 * Works for both order fulfillments and return fulfillments.
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const fulfillment_id = req.params.id

  console.log("[LabelDownload] Downloading label for fulfillment:", fulfillment_id)

  try {
    const fulfillmentService = req.scope.resolve(Modules.FULFILLMENT)

    // Get the fulfillment to find the label URL or parcel ID
    const fulfillment = await fulfillmentService.retrieveFulfillment(fulfillment_id, {
      relations: ["labels"],
    })

    if (!fulfillment) {
      return res.status(404).json({ message: "Fulfillment not found" })
    }

    // Try to get label URL from labels array first, then from data
    let labelUrl = fulfillment.labels?.[0]?.label_url
    
    if (!labelUrl && fulfillment.data) {
      labelUrl = (fulfillment.data as any)?.label_url
    }

    // If we have a parcel_id but no label_url, fetch from Sendcloud
    const parcelId = (fulfillment.data as any)?.parcel_id
    
    if (!labelUrl && parcelId) {
      console.log("[LabelDownload] Fetching label from Sendcloud for parcel:", parcelId)
      
      const publicKey = process.env.SENDCLOUD_PUBLIC_KEY
      const secretKey = process.env.SENDCLOUD_SECRET_KEY
      
      if (!publicKey || !secretKey) {
        return res.status(500).json({ message: "Sendcloud credentials not configured" })
      }

      const auth = Buffer.from(`${publicKey}:${secretKey}`).toString("base64")
      
      // Fetch label PDF directly from Sendcloud
      const labelResponse = await fetch(
        `https://panel.sendcloud.sc/api/v2/labels/normal_printer/${parcelId}`,
        {
          headers: {
            Authorization: `Basic ${auth}`,
            Accept: "application/pdf",
          },
        }
      )

      if (!labelResponse.ok) {
        console.error("[LabelDownload] Sendcloud error:", labelResponse.status, labelResponse.statusText)
        return res.status(502).json({ 
          message: `Failed to fetch label from Sendcloud: ${labelResponse.statusText}` 
        })
      }

      // Get the PDF data
      const pdfBuffer = await labelResponse.arrayBuffer()
      
      // Set headers for PDF download
      const orderNumber = (fulfillment.data as any)?.order?.display_id || fulfillment_id
      const isReturn = (fulfillment.data as any)?.is_return
      const filename = isReturn 
        ? `return-label-${orderNumber}.pdf`
        : `shipping-label-${orderNumber}.pdf`
      
      res.setHeader("Content-Type", "application/pdf")
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`)
      res.setHeader("Content-Length", pdfBuffer.byteLength)
      
      return res.send(Buffer.from(pdfBuffer))
    }

    // If we have a direct label URL, try to fetch it
    if (labelUrl) {
      console.log("[LabelDownload] Fetching from label URL:", labelUrl)
      
      // Check if the URL is a Sendcloud URL that needs auth
      const needsAuth = labelUrl.includes("sendcloud.sc")
      
      const fetchOptions: RequestInit = {
        headers: {
          Accept: "application/pdf",
        },
      }
      
      if (needsAuth) {
        const publicKey = process.env.SENDCLOUD_PUBLIC_KEY
        const secretKey = process.env.SENDCLOUD_SECRET_KEY
        
        if (publicKey && secretKey) {
          const auth = Buffer.from(`${publicKey}:${secretKey}`).toString("base64")
          fetchOptions.headers = {
            ...fetchOptions.headers,
            Authorization: `Basic ${auth}`,
          }
        }
      }
      
      const labelResponse = await fetch(labelUrl, fetchOptions)
      
      if (!labelResponse.ok) {
        console.error("[LabelDownload] Failed to fetch label:", labelResponse.status)
        return res.status(502).json({ 
          message: `Failed to fetch label: ${labelResponse.statusText}` 
        })
      }

      const pdfBuffer = await labelResponse.arrayBuffer()
      
      const orderNumber = (fulfillment.data as any)?.order?.display_id || fulfillment_id
      const isReturn = (fulfillment.data as any)?.is_return
      const filename = isReturn 
        ? `return-label-${orderNumber}.pdf`
        : `shipping-label-${orderNumber}.pdf`
      
      res.setHeader("Content-Type", "application/pdf")
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`)
      res.setHeader("Content-Length", pdfBuffer.byteLength)
      
      return res.send(Buffer.from(pdfBuffer))
    }

    // No label available
    console.error("[LabelDownload] No label URL or parcel ID found")
    return res.status(404).json({ 
      message: "No label available for this fulfillment" 
    })

  } catch (error) {
    console.error("[LabelDownload] Error:", error)
    const message = error instanceof Error ? error.message : "Unknown error"
    return res.status(500).json({ message: `Failed to download label: ${message}` })
  }
}

