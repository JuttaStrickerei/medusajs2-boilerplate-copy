import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

/**
 * GET /labels/:parcel_id
 * 
 * Public endpoint to download shipping labels for Sendcloud parcels.
 * This endpoint proxies the request to Sendcloud with authentication.
 * 
 * Query parameters:
 * - format: "a4" or "a6" (default: "a6" for label printers)
 * 
 * Note: This is a public endpoint but parcel IDs are random Sendcloud IDs.
 * Security through obscurity - the IDs are not guessable.
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const parcel_id = req.params.parcel_id
  const format = (req.query.format as string)?.toLowerCase() || "a6" // Default to A6

  console.log("[SendcloudLabel] Downloading label for parcel:", parcel_id, "format:", format)

  try {
    const publicKey = process.env.SENDCLOUD_PUBLIC_KEY
    const secretKey = process.env.SENDCLOUD_SECRET_KEY
    
    if (!publicKey || !secretKey) {
      console.error("[SendcloudLabel] Missing credentials")
      return res.status(500).json({ message: "Sendcloud credentials not configured" })
    }

    const auth = Buffer.from(`${publicKey}:${secretKey}`).toString("base64")
    
    // Choose label format based on query parameter
    // normal_printer = A4 (4 labels per page)
    // label_printer = A6 (single label, ideal for thermal printers)
    const printerType = format === "a4" ? "normal_printer" : "label_printer"
    const labelUrl = `https://panel.sendcloud.sc/api/v2/labels/${printerType}/${parcel_id}`
    
    console.log("[SendcloudLabel] Fetching from:", labelUrl)
    
    const labelResponse = await fetch(labelUrl, {
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: "application/pdf",
      },
    })

    console.log("[SendcloudLabel] Sendcloud response status:", labelResponse.status)

    if (!labelResponse.ok) {
      console.error("[SendcloudLabel] Sendcloud error:", labelResponse.status, labelResponse.statusText)
      
      // Try to get error message from response
      const errorText = await labelResponse.text().catch(() => "")
      console.error("[SendcloudLabel] Error details:", errorText)
      
      return res.status(labelResponse.status).json({ 
        message: `Failed to fetch label from Sendcloud: ${labelResponse.statusText}`,
        details: errorText
      })
    }

    // Get the PDF data
    const pdfBuffer = await labelResponse.arrayBuffer()
    
    console.log("[SendcloudLabel] PDF size:", pdfBuffer.byteLength, "bytes")
    
    // Set headers for PDF download
    const filename = `shipping-label-${parcel_id}-${format.toUpperCase()}.pdf`
    
    res.setHeader("Content-Type", "application/pdf")
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`)
    res.setHeader("Content-Length", pdfBuffer.byteLength)
    res.setHeader("Access-Control-Allow-Origin", "*") // Allow cross-origin for admin panel
    
    return res.send(Buffer.from(pdfBuffer))

  } catch (error) {
    console.error("[SendcloudLabel] Error:", error)
    const message = error instanceof Error ? error.message : "Unknown error"
    return res.status(500).json({ message: `Failed to download label: ${message}` })
  }
}

// Handle CORS preflight
export const OPTIONS = async (req: MedusaRequest, res: MedusaResponse) => {
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type")
  return res.status(200).end()
}

