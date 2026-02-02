import { MedusaService } from "@medusajs/framework/utils"
import { InvoiceConfig } from "./models/invoice_config"
import { Invoice, InvoiceStatus } from "./models/invoice"
import PdfPrinter from "pdfmake"
import { 
  InferTypeOf, 
  OrderDTO, 
  OrderLineItemDTO,
} from "@medusajs/framework/types"
import axios from "axios"
import { georgiaNormal, georgiaBold, georgiaItalic, georgiaBoldItalic } from "../../fonts/georgia-base64"

// Helper function to convert Base64 string to Buffer for pdfmake
const base64ToBuffer = (base64: string): Buffer => {
  if (!base64) return Buffer.from("")
  // Remove data URI prefix if present
  const base64Data = base64.includes(",") ? base64.split(",")[1] : base64
  return Buffer.from(base64Data, "base64")
}

// Configure fonts for pdfmake
// Use Georgia if available, otherwise fallback to Helvetica
const fonts: any = {
  Helvetica: {
    normal: "Helvetica",
    bold: "Helvetica-Bold",
    italics: "Helvetica-Oblique",
    bolditalics: "Helvetica-BoldOblique",
  },
}

// Add Georgia font if Base64 strings are provided
if (georgiaNormal && georgiaBold) {
  fonts.Georgia = {
    normal: base64ToBuffer(georgiaNormal),
    bold: base64ToBuffer(georgiaBold),
    italics: georgiaItalic ? base64ToBuffer(georgiaItalic) : base64ToBuffer(georgiaNormal),
    bolditalics: georgiaBoldItalic ? base64ToBuffer(georgiaBoldItalic) : base64ToBuffer(georgiaBold),
  }
}

const printer = new PdfPrinter(fonts)

type GeneratePdfParams = {
  order: OrderDTO
  items: OrderLineItemDTO[]
}
class InvoiceGeneratorService extends MedusaService({
  InvoiceConfig,
  Invoice,
}) {
  private async formatAmount(amount: number, currency: string): Promise<string> {
    // Note: Medusa returns prices already in the main currency unit (Euro), not in cents
    const formatted = new Intl.NumberFormat("de-DE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
    
    // Replace currency code with symbol
    if (currency.toLowerCase() === 'eur' || currency === 'EUR') {
      return `${formatted} €`
    }
    return `${formatted} ${currency}`
  }

  private async imageUrlToBase64(url: string): Promise<string | null> {
    try {
      // Security: Validate URL protocol (only HTTPS allowed)
      const parsed = new URL(url)
      if (parsed.protocol !== "https:") {
        console.warn(`[InvoiceGenerator] Invalid logo URL protocol: ${parsed.protocol}`)
        return null
      }
      
      const response = await axios.get(url, { 
        responseType: "arraybuffer",
        timeout: 5000, // 5 second timeout
        maxContentLength: 2 * 1024 * 1024, // 2MB max
        maxBodyLength: 2 * 1024 * 1024,
      })
      const base64 = Buffer.from(response.data).toString("base64")
      const mimeType = response.headers["content-type"] || "image/png"
      return `data:${mimeType};base64,${base64}`
    } catch (error) {
      console.warn(`[InvoiceGenerator] Failed to fetch logo: ${error}`)
      return null
    }
  }

  private async createInvoiceContent(
    params: GeneratePdfParams, 
    invoice: InferTypeOf<typeof Invoice>
  ): Promise<Record<string, any>> {
    // Get invoice configuration
    const invoiceConfigs = await this.listInvoiceConfigs()
    const config = invoiceConfigs[0] || {
      company_name: "Jutta Strickerei",
      company_address: "Wiener Neustädterstraße 47, 7021, Draßburg",
      company_phone: "+43 22686 2259",
      company_email: "office@strickerei-jutta.at",
      company_logo: null,
      notes: null,
    }

    // Pre-fetch company logo (if configured)
    const companyLogoBase64 = config.company_logo 
      ? await this.imageUrlToBase64(config.company_logo) 
      : null

    // Create table for order items
    const itemsTable = [
      [
        { text: "Artikel", style: "tableHeader" },
        { text: "Menge", style: "tableHeader", alignment: "center" },
        { text: "Einzelpreis", style: "tableHeader", alignment: "right" },
        { text: "Gesamt", style: "tableHeader", alignment: "right" },
      ],
      ...(await Promise.all(params.items.map(async (item) => [
        { text: item.title || "Unbekannter Artikel", style: "tableRow" },
        { text: item.quantity.toString(), style: "tableRow", alignment: "center" },
        { text: await this.formatAmount(
          item.unit_price, 
          params.order.currency_code
        ), style: "tableRow", alignment: "right" },
        { text: await this.formatAmount(
          Number(item.total), 
          params.order.currency_code
        ), style: "tableRow", alignment: "right" },
      ]))),
    ]

    const invoiceId = `RE-${invoice.display_id.toString().padStart(6, "0")}`
    const invoiceDate = new Date(invoice.created_at).toLocaleDateString("de-DE")

    // return the PDF content structure
    return {
      pageSize: "A4",
      pageMargins: [50, 70, 50, 70],
      header: {
        margin: [50, 30, 50, 0],
        columns: [
          /** Company Logo */
          {
            width: "*",
            stack: [
              ...(companyLogoBase64 ? [
                {
                  image: companyLogoBase64,
                  width: 100,
                  height: 50,
                  fit: [100, 50],
                  margin: [0, 0, 0, 15],
                },
              ] : []),
              {
                text: config.company_name || "Ihr Firmenname",
                style: "companyName",
                margin: [0, 0, 0, 0],
              },
            ],
          },
          /** Invoice Title */
          {
            width: "auto",
            stack: [
              {
                text: "RECHNUNG",
                style: "invoiceTitle",
                alignment: "right",
                margin: [0, 10, 0, 0],
              },
            ],
          },
        ],
      },
      content: [
        {
          margin: [0, 30, 0, 0],
          columns: [
            /** Company Details */
            {
              width: "50%",
              stack: [
                {
                  text: "ABSENDERADRESSE",
                  style: "sectionHeader",
                  margin: [0, 0, 0, 10],
                },
                config.company_address && {
                  text: config.company_address,
                  style: "companyAddress",
                  margin: [0, 0, 0, 5],
                },
                config.company_phone && {
                  text: `Tel: ${config.company_phone}`,
                  style: "companyContact",
                  margin: [0, 0, 0, 3],
                },
                config.company_email && {
                  text: `E-Mail: ${config.company_email}`,
                  style: "companyContact",
                  margin: [0, 0, 0, 0],
                },
              ],
            },
            /** Invoice Details */
            {
              width: "50%",
              alignment: "right",
              stack: [
                {
                  table: {
                    widths: [100, 120],
                    body: [
                      [
                        { text: "Rechnungsnr:", style: "label", border: [true, true, false, false] },
                        { text: invoiceId, style: "value", border: [false, true, true, false] },
                      ],
                      [
                        { text: "Rechnungsdatum:", style: "label", border: [true, false, false, false] },
                        { text: invoiceDate, style: "value", border: [false, false, true, false] },
                      ],
                      [
                        { text: "Bestellnr:", style: "label", border: [true, false, false, false] },
                        { 
                          text: params.order.display_id.toString().padStart(6, "0"), 
                          style: "value",
                          border: [false, false, true, false],
                        },
                      ],
                      [
                        { text: "Bestelldatum:", style: "label", border: [true, false, false, true] },
                        { 
                          text: new Date(params.order.created_at).toLocaleDateString("de-DE"), 
                          style: "value",
                          border: [false, false, true, true],
                        },
                      ],
                    ],
                  },
                  layout: {
                    hLineWidth: function(i: number, node: any) {
                      return 0.5
                    },
                    vLineWidth: function() {
                      return 0.5
                    },
                    hLineColor: function() {
                      return "#e7e5e4"
                    },
                    vLineColor: function() {
                      return "#e7e5e4"
                    },
                    paddingLeft: function() { return 10 },
                    paddingRight: function() { return 10 },
                    paddingTop: function() { return 8 },
                    paddingBottom: function() { return 8 },
                  },
                },
              ],
            },
          ],
        },
        {
          text: "\n\n",
        },
        /** Billing and Shipping Addresses */
        {
          columns: [
            {
              width: "*",
              stack: [
                {
                  text: "RECHNUNGSADRESSE",
                  style: "addressHeader",
                  margin: [0, 0, 0, 10],
                },
                {
                  text: params.order.billing_address ? 
                    `${params.order.billing_address.first_name || ""} ${params.order.billing_address.last_name || ""}
${params.order.billing_address.address_1 || ""}${params.order.billing_address.address_2 ? `\n${params.order.billing_address.address_2}` : ""}
${params.order.billing_address.postal_code || ""} ${params.order.billing_address.city || ""}
${params.order.billing_address.province || ""} ${params.order.billing_address.country_code?.toUpperCase() || ""}${params.order.billing_address.phone ? `\nTel: ${params.order.billing_address.phone}` : ""}` : 
                    "Keine Rechnungsadresse angegeben",
                  style: "addressText",
                },
              ],
            },
            {
              width: "*",
              stack: [
                {
                  text: "LIEFERADRESSE",
                  style: "addressHeader",
                  margin: [0, 0, 0, 10],
                },
                {
                  text: params.order.shipping_address ? 
                    `${params.order.shipping_address.first_name || ""} ${params.order.shipping_address.last_name || ""}
${params.order.shipping_address.address_1 || ""} ${params.order.shipping_address.address_2 ? `\n${params.order.shipping_address.address_2}` : ""}
${params.order.shipping_address.postal_code || ""} ${params.order.shipping_address.city || ""}
${params.order.shipping_address.province || ""} ${params.order.shipping_address.country_code?.toUpperCase() || ""}${params.order.shipping_address.phone ? `\nTel: ${params.order.shipping_address.phone}` : ""}` : 
                    "Keine Lieferadresse angegeben",
                  style: "addressText",
                },
              ],
            },
          ],
        },
        {
          text: "\n\n\n",
        },
        /** Items Table */
        {
          table: {
            headerRows: 1,
            widths: ["*", 60, 80, 80],
            body: itemsTable,
          },
          layout: {
            fillColor: function (rowIndex: number) {
              return (rowIndex === 0) ? "#fafaf9" : null
            },
            hLineWidth: function (i: number, node: any) {
              return i === 0 || i === node.table.body.length ? 0 : 0.5
            },
            vLineWidth: function () {
              return 0
            },
            hLineColor: function () {
              return "#e7e5e4"
            },
            paddingLeft: function (i: number) {
              return i === 0 ? 12 : 8
            },
            paddingRight: function (i: number) {
              return i === 3 ? 12 : 8
            },
            paddingTop: function () {
              return 10
            },
            paddingBottom: function () {
              return 10
            },
          },
        },
        {
          text: "\n\n",
        },
        /** Totals Section */
        {
          columns: [
            { width: "*", text: "" },
            {
              width: 250,
              table: {
                widths: [140, 90],
                body: [
                  [
                    { text: "Artikel", style: "totalLabel" },
                    { 
                      text: await this.formatAmount(
                        Number(params.order.subtotal), 
                        params.order.currency_code), 
                      style: "totalValue",
                      alignment: "right",
                    },
                  ],
                  [
                    { text: "Versand", style: "totalLabel" },
                    { 
                      text: await this.formatAmount(
                        Number(params.order.shipping_methods?.[0]?.total || 0), 
                        params.order.currency_code), 
                      style: "totalValue",
                      alignment: "right",
                    },
                  ],
                  ...(Number(params.order.discount_total) > 0 ? [[
                    { text: "Rabatt", style: "totalLabel" },
                    { 
                      text: await this.formatAmount(
                        Number(params.order.discount_total), 
                        params.order.currency_code), 
                      style: "totalValue",
                      alignment: "right",
                    },
                  ]] : []),
                  [
                    { text: "", style: "totalLabel", margin: [0, 8, 0, 8], colSpan: 2, border: [false, true, false, false] },
                    {},  
                  ],
                  [
                    { text: "Gesamt", style: "grandTotalLabel" },
                    { 
                      text: await this.formatAmount(
                        Number(params.order.total), 
                        params.order.currency_code), 
                      style: "grandTotalValue",
                      alignment: "right",
                    },
                  ],
                ],
              },
              layout: {
                hLineWidth: function (i: number, node: any) {
                  const discountRow = Number(params.order.discount_total) > 0 ? 1 : 0
                  const totalRowIndex = 3 + discountRow
                  return i === totalRowIndex ? 1 : 0
                },
                vLineWidth: function () {
                  return 0
                },
                hLineColor: function () {
                  return "#e7e5e4"
                },
                paddingLeft: function () {
                  return 0
                },
                paddingRight: function () {
                  return 0
                },
                paddingTop: function (i: number, node: any) {
                  const discountRow = Number(params.order.discount_total) > 0 ? 1 : 0
                  const totalRowIndex = 3 + discountRow
                  return i === totalRowIndex ? 10 : 4
                },
                paddingBottom: function () {
                  return 4
                },
              },
            },
          ],
        },
        {
          text: "\n\n",
        },
        /** Notes Section */
        ...(config.notes ? [
          {
            stack: [
              {
                canvas: [
                  {
                    type: "rect",
                    x: 0,
                    y: 0,
                    w: 495,
                    h: 1,
                    lineColor: "#cccccc",
                  },
                ],
                margin: [0, 0, 0, 20],
              },
              {
                text: "ANMERKUNGEN",
                style: "notesHeader",
                margin: [0, 0, 0, 10],
              },
              {
                text: config.notes,
                style: "notesText",
                margin: [0, 0, 0, 20],
              },
            ],
          },
        ] : []),
        {
          text: "Vielen Dank für Ihre Bestellung!",
          style: "thankYouText",
          alignment: "center",
          margin: [0, 40, 0, 0],
        },
      ],
      styles: {
        companyName: {
          fontSize: 24,
          bold: false,
          color: "#1c1917",
          font: georgiaNormal ? "Georgia" : "Helvetica",
        },
        companyAddress: {
          fontSize: 10,
          color: "#57534e",
          lineHeight: 1.4,
        },
        companyContact: {
          fontSize: 10,
          color: "#57534e",
          lineHeight: 1.2,
        },
        invoiceTitle: {
          fontSize: 24,
          bold: false,
          color: "#1c1917",
          font: georgiaNormal ? "Georgia" : "Helvetica",
        },
        label: {
          fontSize: 10,
          color: "#57534e",
          margin: [0, 0, 8, 0],
        },
        value: {
          fontSize: 10,
          bold: true,
          color: "#1c1917",
        },
        sectionHeader: {
          fontSize: 11,
          bold: true,
          color: "#1c1917",
          letterSpacing: 1,
          font: georgiaNormal ? "Georgia" : "Helvetica",
        },
        addressHeader: {
          fontSize: 11,
          bold: true,
          color: "#1c1917",
          letterSpacing: 0.5,
          font: georgiaNormal ? "Georgia" : "Helvetica",
        },
        addressText: {
          fontSize: 10,
          color: "#57534e",
          lineHeight: 1.5,
        },
        tableHeader: {
          fontSize: 10,
          bold: true,
          color: "#1c1917",
        },
        tableRow: {
          fontSize: 10,
          color: "#1c1917",
        },
        totalLabel: {
          fontSize: 10,
          color: "#57534e",
        },
        totalValue: {
          fontSize: 10,
          color: "#1c1917",
        },
        grandTotalLabel: {
          fontSize: 12,
          bold: true,
          color: "#1c1917",
        },
        grandTotalValue: {
          fontSize: 12,
          bold: true,
          color: "#1c1917",
        },
        notesHeader: {
          fontSize: 11,
          bold: true,
          color: "#1c1917",
          letterSpacing: 1,
          font: georgiaNormal ? "Georgia" : "Helvetica",
        },
        notesText: {
          fontSize: 10,
          color: "#57534e",
          lineHeight: 1.5,
        },
        thankYouText: {
          fontSize: 12,
          color: "#1c1917",
          bold: false,
          font: georgiaNormal ? "Georgia" : "Helvetica",
        },
      },
      defaultStyle: {
        font: georgiaNormal ? "Georgia" : "Helvetica",
      },
    }
  }

  async generatePdf(params: GeneratePdfParams & {
    invoice_id: string
  }): Promise<Buffer> {
    const invoice = await this.retrieveInvoice(params.invoice_id)

    // Generate new content
    const pdfContent = Object.keys(invoice.pdfContent).length ? 
      invoice.pdfContent : 
      await this.createInvoiceContent(params, invoice)

    await this.updateInvoices({
      id: invoice.id,
      pdfContent,
    })

    // get PDF as a Buffer
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = []
  
      const pdfDoc = printer.createPdfKitDocument(pdfContent as any)
      
      pdfDoc.on("data", (chunk) => chunks.push(chunk))
      pdfDoc.on("end", () => {
        const result = Buffer.concat(chunks)
        resolve(result)
      })
      pdfDoc.on("error", (err) => reject(err))
  
      pdfDoc.end() // Finalize PDF stream
    })
  }
}

export default InvoiceGeneratorService