import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

/**
 * GET /admin/sendcloud/labels/:parcel_id
 * 
 * Downloads the shipping label for a Sendcloud parcel.
 * This endpoint proxies the request to Sendcloud with authentication.
 * 
 * Query parameters:
 * - format: "a4" or "a6" (default: "a6" for label printers)
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const parcel_id = req.params.parcel_id
  const format = (req.query.format as string)?.toLowerCase() || "a6" // Default to A6

  console.log("[SendcloudLabel] Downloading label for parcel:", parcel_id, "format:", format)

  try {
    const publicKey = process.env.SENDCLOUD_PUBLIC_KEY
    const secretKey = process.env.SENDCLOUD_SECRET_KEY
    
    if (!publicKey || !secretKey) {
      return res.status(500).json({ message: "Sendcloud credentials not configured" })
    }

    const auth = Buffer.from(`${publicKey}:${secretKey}`).toString("base64")
    
    // Choose label format based on query parameter
    // normal_printer = A4 (4 labels per page)
    // label_printer = A6 (single label, ideal for thermal printers)
    const printerType = format === "a4" ? "normal_printer" : "label_printer"
    
    // Fetch label PDF directly from Sendcloud
    const labelResponse = await fetch(
      `https://panel.sendcloud.sc/api/v2/labels/${printerType}/${parcel_id}`,
      {
        headers: {
          Authorization: `Basic ${auth}`,
          Accept: "application/pdf",
        },
      }
    )

    if (!labelResponse.ok) {
      console.error("[SendcloudLabel] Sendcloud error:", labelResponse.status, labelResponse.statusText)
      
      // Try to get error message from response
      const errorText = await labelResponse.text().catch(() => "")
      console.error("[SendcloudLabel] Error details:", errorText)
      
      return res.status(labelResponse.status).json({ 
        message: `Failed to fetch label from Sendcloud: ${labelResponse.statusText}` 
      })
    }

    // Get the PDF data
    const pdfBuffer = await labelResponse.arrayBuffer()
    
    // Set headers for PDF download
    const filename = `shipping-label-${parcel_id}-${format.toUpperCase()}.pdf`
    
    res.setHeader("Content-Type", "application/pdf")
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`)
    res.setHeader("Content-Length", pdfBuffer.byteLength)
    
    return res.send(Buffer.from(pdfBuffer))

  } catch (error) {
    console.error("[SendcloudLabel] Error:", error)
    const message = error instanceof Error ? error.message : "Unknown error"
    return res.status(500).json({ message: `Failed to download label: ${message}` })
  }
}

