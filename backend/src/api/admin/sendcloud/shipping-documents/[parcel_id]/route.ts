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

type SlipItem = {
  title: string
  variant_title: string | null
  sku: string | null
  quantity: number
  unit_price: number
}

type SlipData = {
  displayId: string | number
  date: string
  companyName: string
  companyAddress: string
  companyEmail: string
  recipientName: string
  recipientCompany: string | null
  recipientAddress: string
  recipientHouseNumber: string
  recipientPostalCity: string
  recipientCountry: string
  items: SlipItem[]
  currency: string
}

function buildPackingSlipDefinition(data: SlipData): any {
  const dateStr = new Date(data.date).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })

  const totalItems = data.items.reduce((s, i) => s + (i.quantity || 0), 0)

  const itemsTableBody: any[][] = [
    [
      { text: "Artikel", style: "tableHeader" },
      { text: "Anzahl", style: "tableHeader", alignment: "center" },
      { text: "Preis", style: "tableHeader", alignment: "right" },
    ],
  ]

  for (const item of data.items) {
    const qty = item.quantity || 0
    const price = typeof item.unit_price === "number" ? item.unit_price : 0
    const priceStr = new Intl.NumberFormat("de-DE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price)

    const nameStack: any[] = [{ text: item.title || "Artikel", fontSize: 10 }]
    if (item.variant_title) {
      nameStack.push({ text: item.variant_title, fontSize: 8, color: "#78716c" })
    }
    if (item.sku) {
      nameStack.push({ text: `SKU: ${item.sku}`, fontSize: 7, color: "#a8a29e" })
    }

    itemsTableBody.push([
      { stack: nameStack },
      { text: String(qty), fontSize: 10, alignment: "center" },
      { text: `€ ${priceStr}`, fontSize: 10, alignment: "right" },
    ])
  }

  return {
    pageSize: "A4",
    pageMargins: [50, 50, 50, 50],
    defaultStyle: { font: "Helvetica", fontSize: 10, color: "#1c1917" },
    footer: (currentPage: number, pageCount: number) => ({
      text: `Seite ${currentPage} / ${pageCount}`,
      alignment: "left",
      fontSize: 8,
      color: "#a8a29e",
      margin: [50, 10, 50, 0],
    }),
    content: [
      {
        columns: [
          { text: data.companyName, bold: true, fontSize: 20, width: "*" },
          {
            width: "auto",
            alignment: "right" as const,
            stack: [
              { text: "LIEFERSCHEIN", fontSize: 20, color: "#1c1917" },
              { text: String(data.displayId), fontSize: 12, color: "#78716c", alignment: "right" as const, margin: [0, 4, 0, 0] },
            ],
          },
        ],
      },
      {
        canvas: [{ type: "line", x1: 0, y1: 0, x2: 495, y2: 0, lineWidth: 0.5, lineColor: "#e7e5e4" }],
        margin: [0, 15, 0, 15] as [number, number, number, number],
      },
      {
        table: {
          widths: ["33%", "34%", "33%"],
          body: [
            [
              {
                stack: [
                  { text: "Bestelldatum", fontSize: 9, color: "#78716c", bold: true },
                  { text: dateStr, fontSize: 10, margin: [0, 2, 0, 0] },
                  { text: " ", fontSize: 4 },
                  { text: "Bestellnummer", fontSize: 9, color: "#78716c", bold: true },
                  { text: String(data.displayId), fontSize: 10, margin: [0, 2, 0, 0] },
                ],
                border: [false, false, false, false],
              },
              {
                stack: [
                  { text: "Von", fontSize: 9, color: "#78716c", bold: true },
                  { text: data.companyName, fontSize: 10, bold: true, margin: [0, 2, 0, 0] },
                  { text: data.companyEmail, fontSize: 9, color: "#57534e" },
                  { text: data.companyAddress, fontSize: 9, color: "#57534e" },
                ],
                border: [true, false, true, false],
                borderColor: ["#e7e5e4", "#e7e5e4", "#e7e5e4", "#e7e5e4"],
              },
              {
                stack: [
                  { text: "An", fontSize: 9, color: "#78716c", bold: true },
                  { text: data.recipientName, fontSize: 10, bold: true, margin: [0, 2, 0, 0] },
                  ...(data.recipientCompany ? [{ text: data.recipientCompany, fontSize: 9, color: "#57534e" }] : []),
                  { text: `${data.recipientAddress} ${data.recipientHouseNumber}`.trim(), fontSize: 9, color: "#57534e" },
                  { text: data.recipientPostalCity, fontSize: 9, color: "#57534e" },
                  { text: data.recipientCountry, fontSize: 9, color: "#57534e" },
                ],
                border: [false, false, false, false],
              },
            ],
          ],
        },
        layout: {
          hLineWidth: () => 0,
          vLineWidth: (i: number) => (i === 1 || i === 2 ? 0.5 : 0),
          vLineColor: () => "#e7e5e4",
          paddingLeft: () => 10,
          paddingRight: () => 10,
          paddingTop: () => 8,
          paddingBottom: () => 8,
        },
        margin: [0, 0, 0, 25] as [number, number, number, number],
      },
      {
        table: {
          headerRows: 1,
          widths: ["*", 60, 80],
          body: itemsTableBody,
        },
        layout: {
          fillColor: (rowIndex: number) => (rowIndex === 0 ? "#fafaf9" : null),
          hLineWidth: (i: number, node: any) => (i === 0 || i === node.table.body.length ? 0 : 0.5),
          vLineWidth: () => 0,
          hLineColor: () => "#e7e5e4",
          paddingLeft: (i: number) => (i === 0 ? 12 : 8),
          paddingRight: (i: number) => (i === 2 ? 12 : 8),
          paddingTop: () => 10,
          paddingBottom: () => 10,
        },
      },
      {
        columns: [
          { width: "*", text: "" },
          {
            width: 150,
            table: {
              widths: [80, 50],
              body: [
                [
                  { text: "Artikel gesamt:", fontSize: 10, color: "#57534e", border: [false, true, false, false], borderColor: ["#e7e5e4", "#e7e5e4", "#e7e5e4", "#e7e5e4"] },
                  { text: String(totalItems), fontSize: 10, bold: true, alignment: "right", border: [false, true, false, false], borderColor: ["#e7e5e4", "#e7e5e4", "#e7e5e4", "#e7e5e4"] },
                ],
              ],
            },
            layout: { hLineWidth: (i: number) => (i === 0 ? 0.5 : 0), vLineWidth: () => 0, hLineColor: () => "#e7e5e4", paddingTop: () => 8, paddingBottom: () => 4, paddingLeft: () => 0, paddingRight: () => 0 },
            margin: [0, 10, 0, 0] as [number, number, number, number],
          },
        ],
      },
      {
        text: "Vielen Dank für Ihre Bestellung!",
        fontSize: 11,
        italics: true,
        color: "#78716c",
        alignment: "center",
        margin: [0, 40, 0, 0] as [number, number, number, number],
      },
    ],
    styles: {
      tableHeader: { bold: true, fontSize: 10, color: "#1c1917" },
    },
  }
}

async function fetchLabelBuffer(parcelId: string): Promise<Buffer> {
  const publicKey = process.env.SENDCLOUD_PUBLIC_KEY
  const secretKey = process.env.SENDCLOUD_SECRET_KEY
  if (!publicKey || !secretKey) throw new Error("Sendcloud credentials not configured")

  const auth = Buffer.from(`${publicKey}:${secretKey}`).toString("base64")
  const response = await fetch(
    `https://panel.sendcloud.sc/api/v2/labels/label_printer/${parcelId}`,
    { headers: { Authorization: `Basic ${auth}`, Accept: "application/pdf" } }
  )
  if (!response.ok) throw new Error(`Sendcloud label fetch failed: ${response.status}`)
  return Buffer.from(await response.arrayBuffer())
}

async function fetchOrderData(query: any, orderId: string): Promise<SlipData> {
  const { data: orders } = await query.graph({
    entity: "order",
    fields: [
      "id", "display_id", "created_at", "currency_code",
      "shipping_address.*",
      "items.title", "items.variant_title", "items.variant_sku",
      "items.quantity", "items.unit_price",
    ],
    filters: { id: orderId },
  })
  if (!orders?.length) throw new Error("Order not found")

  const order = orders[0] as any
  const addr = order.shipping_address || {}

  return {
    displayId: order.display_id || order.id,
    date: order.created_at,
    companyName: "Jutta Strickerei",
    companyAddress: "Wiener Neustädterstraße 47, 7021 Draßburg, Österreich",
    companyEmail: "office@strickerei-jutta.at",
    recipientName: [addr.first_name, addr.last_name].filter(Boolean).join(" ") || "Kunde",
    recipientCompany: addr.company || null,
    recipientAddress: addr.address_1 || "",
    recipientHouseNumber: addr.address_2 || "",
    recipientPostalCity: [addr.postal_code, addr.city].filter(Boolean).join(" "),
    recipientCountry: addr.country_code?.toUpperCase() || "",
    items: (order.items || []).map((i: any) => ({
      title: i.title || "Artikel",
      variant_title: i.variant_title || null,
      sku: i.variant_sku || null,
      quantity: Number(i.quantity) || 0,
      unit_price: Number(i.unit_price) || 0,
    })),
    currency: order.currency_code || "eur",
  }
}

/**
 * GET /admin/sendcloud/shipping-documents/:parcel_id
 *
 * Query params:
 *   order_id (required) — the Medusa order ID
 *   type — "combined" (default), "packing-slip", "label"
 *
 * combined: page 1 = label, page 2 = packing slip
 * packing-slip: packing slip only (A4)
 * label: label only (A6)
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const parcelId = req.params.parcel_id
  const orderId = req.query.order_id as string
  const docType = (req.query.type as string) || "combined"

  if (!orderId) {
    return res.status(400).json({ message: "order_id query parameter is required" })
  }

  try {
    const queryService = req.scope.resolve("query") as any
    const orderData = await fetchOrderData(queryService, orderId)

    if (docType === "label") {
      const labelBuffer = await fetchLabelBuffer(parcelId)
      res.setHeader("Content-Type", "application/pdf")
      res.setHeader("Content-Disposition", `attachment; filename="label-${orderData.displayId}.pdf"`)
      res.setHeader("Content-Length", labelBuffer.length)
      return res.send(labelBuffer)
    }

    const slipDef = buildPackingSlipDefinition(orderData)
    const slipBuffer = await pdfmakeToBuffer(slipDef)

    if (docType === "packing-slip") {
      res.setHeader("Content-Type", "application/pdf")
      res.setHeader("Content-Disposition", `attachment; filename="lieferschein-${orderData.displayId}.pdf"`)
      res.setHeader("Content-Length", slipBuffer.length)
      return res.send(slipBuffer)
    }

    const labelBuffer = await fetchLabelBuffer(parcelId)

    const labelPdf = await PDFDocument.load(labelBuffer)
    const slipPdf = await PDFDocument.load(slipBuffer)
    const merged = await PDFDocument.create()

    const labelPages = await merged.copyPages(labelPdf, labelPdf.getPageIndices())
    for (const page of labelPages) merged.addPage(page)

    const [slipPage] = await merged.copyPages(slipPdf, [0])
    merged.addPage(slipPage)

    const mergedBytes = await merged.save()
    const filename = `versand-${orderData.displayId}.pdf`

    res.setHeader("Content-Type", "application/pdf")
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`)
    res.setHeader("Content-Length", mergedBytes.length)
    return res.send(Buffer.from(mergedBytes))
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return res.status(500).json({ message: `Failed to generate document: ${message}` })
  }
}
