import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { PDFDocument } from "pdf-lib"
import PdfPrinter from "pdfmake"

const fonts: any = {
  Helvetica: {
    normal: "Helvetica",
    bold: "Helvetica-Bold",
    italics: "Helvetica-Oblique",
    bolditalics: "Helvetica-BoldOblique",
  },
}
const printer = new PdfPrinter(fonts)

function pdfmakeToBuffer(docDefinition: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = printer.createPdfKitDocument(docDefinition)
    const chunks: Buffer[] = []
    doc.on("data", (chunk: Buffer) => chunks.push(chunk))
    doc.on("end", () => resolve(Buffer.concat(chunks)))
    doc.on("error", reject)
    doc.end()
  })
}

type OrderItem = {
  title: string
  variant_title?: string | null
  variant_sku?: string | null
  quantity: number
}

function buildPackingSlipDefinition(
  orderDisplayId: string | number,
  orderDate: string,
  recipientName: string,
  recipientAddress: string[],
  items: OrderItem[]
): any {
  const dateStr = new Date(orderDate).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })

  const tableBody: any[][] = [
    [
      { text: "Pos.", style: "tableHeader" },
      { text: "Artikel", style: "tableHeader" },
      { text: "Variante", style: "tableHeader" },
      { text: "Menge", style: "tableHeader", alignment: "right" },
    ],
  ]

  items.forEach((item, idx) => {
    tableBody.push([
      { text: String(idx + 1), fontSize: 8 },
      { text: item.title || "—", fontSize: 8 },
      { text: item.variant_title || "—", fontSize: 8, color: "#666666" },
      { text: String(item.quantity), fontSize: 8, alignment: "right" },
    ])
  })

  return {
    pageSize: "A6" as any,
    pageMargins: [16, 16, 16, 16] as [number, number, number, number],
    defaultStyle: { font: "Helvetica", fontSize: 8 },
    content: [
      {
        columns: [
          { text: "Jutta Strickerei", bold: true, fontSize: 10 },
          {
            text: "LIEFERSCHEIN",
            bold: true,
            fontSize: 10,
            alignment: "right",
            color: "#333333",
          },
        ],
      },
      {
        canvas: [
          { type: "line", x1: 0, y1: 2, x2: 263, y2: 2, lineWidth: 0.5, lineColor: "#CCCCCC" },
        ],
        margin: [0, 4, 0, 6] as [number, number, number, number],
      },
      {
        columns: [
          {
            width: "50%",
            stack: [
              { text: recipientName, bold: true, fontSize: 8 },
              ...recipientAddress.map((line) => ({ text: line, fontSize: 7, color: "#444444" })),
            ],
          },
          {
            width: "50%",
            alignment: "right" as const,
            stack: [
              { text: `Bestellung #${orderDisplayId}`, fontSize: 8, bold: true },
              { text: `Datum: ${dateStr}`, fontSize: 7, color: "#444444" },
            ],
          },
        ],
        margin: [0, 0, 0, 8] as [number, number, number, number],
      },
      {
        table: {
          headerRows: 1,
          widths: [20, "*", 60, 30],
          body: tableBody,
        },
        layout: {
          hLineWidth: (i: number, node: any) =>
            i === 0 || i === 1 || i === node.table.body.length ? 0.5 : 0,
          vLineWidth: () => 0,
          hLineColor: () => "#CCCCCC",
          paddingLeft: () => 4,
          paddingRight: () => 4,
          paddingTop: () => 3,
          paddingBottom: () => 3,
        },
      },
      {
        text: `${items.reduce((s, i) => s + i.quantity, 0)} Artikel insgesamt`,
        fontSize: 7,
        color: "#666666",
        margin: [0, 6, 0, 0] as [number, number, number, number],
      },
      {
        text: "Vielen Dank für Ihre Bestellung!",
        fontSize: 7,
        italics: true,
        color: "#888888",
        margin: [0, 8, 0, 0] as [number, number, number, number],
        alignment: "center",
      },
    ],
    styles: {
      tableHeader: { bold: true, fontSize: 7, color: "#333333" },
    },
  }
}

/**
 * GET /admin/sendcloud/shipping-documents/:parcel_id
 *
 * Returns a combined PDF: page 1 = Lieferschein (packing slip), page 2 = shipping label.
 * Query params: order_id (required)
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const parcelId = req.params.parcel_id
  const orderId = req.query.order_id as string

  if (!orderId) {
    return res.status(400).json({ message: "order_id query parameter is required" })
  }

  try {
    const query = req.scope.resolve("query") as any
    const { data: orders } = await query.graph({
      entity: "order",
      fields: [
        "id",
        "display_id",
        "created_at",
        "shipping_address.*",
        "items.title",
        "items.variant_title",
        "items.variant_sku",
        "items.quantity",
      ],
      filters: { id: orderId },
    })

    if (!orders?.length) {
      return res.status(404).json({ message: "Order not found" })
    }

    const order = orders[0] as any
    const addr = order.shipping_address || {}
    const recipientName =
      [addr.first_name, addr.last_name].filter(Boolean).join(" ") || addr.company || "Kunde"
    const recipientAddress = [
      addr.company,
      [addr.address_1, addr.address_2].filter(Boolean).join(" "),
      [addr.postal_code, addr.city].filter(Boolean).join(" "),
      addr.country_code?.toUpperCase(),
    ].filter(Boolean)

    const packingSlipDef = buildPackingSlipDefinition(
      order.display_id || order.id,
      order.created_at,
      recipientName,
      recipientAddress,
      (order.items || []).map((i: any) => ({
        title: i.title || "Artikel",
        variant_title: i.variant_title,
        variant_sku: i.variant_sku,
        quantity: i.quantity,
      }))
    )

    const packingSlipBuffer = await pdfmakeToBuffer(packingSlipDef)

    const publicKey = process.env.SENDCLOUD_PUBLIC_KEY
    const secretKey = process.env.SENDCLOUD_SECRET_KEY

    if (!publicKey || !secretKey) {
      return res.status(500).json({ message: "Sendcloud credentials not configured" })
    }

    const auth = Buffer.from(`${publicKey}:${secretKey}`).toString("base64")
    const labelResponse = await fetch(
      `https://panel.sendcloud.sc/api/v2/labels/label_printer/${parcelId}`,
      {
        headers: { Authorization: `Basic ${auth}`, Accept: "application/pdf" },
      }
    )

    if (!labelResponse.ok) {
      return res.status(502).json({ message: "Failed to fetch label from Sendcloud" })
    }

    const labelBuffer = Buffer.from(await labelResponse.arrayBuffer())

    const packingSlipPdf = await PDFDocument.load(packingSlipBuffer)
    const labelPdf = await PDFDocument.load(labelBuffer)
    const merged = await PDFDocument.create()

    const [packingPage] = await merged.copyPages(packingSlipPdf, [0])
    merged.addPage(packingPage)

    const labelPages = await merged.copyPages(labelPdf, labelPdf.getPageIndices())
    for (const page of labelPages) {
      merged.addPage(page)
    }

    const mergedBytes = await merged.save()
    const filename = `versand-${order.display_id || parcelId}.pdf`

    res.setHeader("Content-Type", "application/pdf")
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`)
    res.setHeader("Content-Length", mergedBytes.length)
    return res.send(Buffer.from(mergedBytes))
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return res.status(500).json({ message: `Failed to generate shipping documents: ${message}` })
  }
}
