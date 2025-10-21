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

const fonts = {
  Helvetica: {
    normal: "Helvetica",
    bold: "Helvetica-Bold",
    italics: "Helvetica-Oblique",
    bolditalics: "Helvetica-BoldOblique",
  },
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
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: currency,
    }).format(amount)
  }

  private async imageUrlToBase64(url: string): Promise<string> {
    const response = await axios.get(url, { responseType: "arraybuffer" })
    const base64 = Buffer.from(response.data).toString("base64")
    const mimeType = response.headers["content-type"] || "image/png"
    return `data:${mimeType};base64,${base64}`
  }

  private async createInvoiceContent(
    params: GeneratePdfParams, 
    invoice: InferTypeOf<typeof Invoice>
  ): Promise<Record<string, any>> {
    // Get invoice configuration
    const invoiceConfigs = await this.listInvoiceConfigs()
    const config = invoiceConfigs[0] || {
      company_name: "Jutta Strickerei",
      company_address: "Wiener Neustädterstraße 47, 7021 Drassburg",
      company_phone: "+43 22686 2259",
      company_email: "office@strickerei-jutta.at",
      company_logo: null,
      notes: null,
    }

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
              ...(config.company_logo ? [
                {
                  image: await this.imageUrlToBase64(config.company_logo),
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
                      return "#d1d5db"
                    },
                    vLineColor: function() {
                      return "#d1d5db"
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
              return (rowIndex === 0) ? "#000000" : null
            },
            hLineWidth: function (i: number, node: any) {
              return i === 0 || i === node.table.body.length ? 0 : 0.5
            },
            vLineWidth: function () {
              return 0
            },
            hLineColor: function () {
              return "#e2e8f0"
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
                    { text: "Zwischensumme (inkl. MwSt):", style: "totalLabel" },
                    { 
                      text: await this.formatAmount(
                        Number(params.order.subtotal), 
                        params.order.currency_code), 
                      style: "totalValue",
                      alignment: "right",
                    },
                  ],
                  [
                    { text: "Versand:", style: "totalLabel" },
                    { 
                      text: await this.formatAmount(
                        Number(params.order.shipping_methods?.[0]?.total || 0), 
                        params.order.currency_code), 
                      style: "totalValue",
                      alignment: "right",
                    },
                  ],
                  [
                    { text: "Rabatt:", style: "totalLabel" },
                    { 
                      text: await this.formatAmount(
                        Number(params.order.discount_total), 
                        params.order.currency_code), 
                      style: "totalValue",
                      alignment: "right",
                    },
                  ],
                    [
                    { text: "", style: "totalLabel", margin: [0, 5, 0, 5] },
                  ],
                  [
                    { text: "GESAMTBETRAG:", style: "grandTotalLabel" },
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
                hLineWidth: function (i: number) {
                  return i === 4 ? 1 : 0
                },
                vLineWidth: function () {
                  return 0
                },
                hLineColor: function () {
                  return "#000000"
                },
                paddingLeft: function () {
                  return 0
                },
                paddingRight: function () {
                  return 0
                },
                paddingTop: function (i: number) {
                  return i === 4 ? 10 : 4
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
          bold: true,
          color: "#000000",
        },
        companyAddress: {
          fontSize: 10,
          color: "#333333",
          lineHeight: 1.4,
        },
        companyContact: {
          fontSize: 10,
          color: "#333333",
          lineHeight: 1.2,
        },
        invoiceTitle: {
          fontSize: 24,
          bold: false,
          color: "#000000",
        },
        label: {
          fontSize: 10,
          color: "#555555",
          margin: [0, 0, 8, 0],
        },
        value: {
          fontSize: 10,
          bold: true,
          color: "#000000",
        },
        sectionHeader: {
          fontSize: 11,
          bold: true,
          color: "#333333",
          letterSpacing: 1,
        },
        addressHeader: {
          fontSize: 11,
          bold: true,
          color: "#000000",
          letterSpacing: 0.5,
        },
        addressText: {
          fontSize: 10,
          color: "#333333",
          lineHeight: 1.5,
        },
        tableHeader: {
          fontSize: 10,
          bold: true,
          color: "#ffffff",
        },
        tableRow: {
          fontSize: 10,
          color: "#333333",
        },
        totalLabel: {
          fontSize: 10,
          color: "#333333",
        },
        totalValue: {
          fontSize: 10,
          color: "#000000",
        },
        grandTotalLabel: {
          fontSize: 10,
          bold: false,
          color: "#000000",
        },
        grandTotalValue: {
          fontSize: 10,
          bold: false,
          color: "#000000",
        },
        notesHeader: {
          fontSize: 11,
          bold: true,
          color: "#333333",
          letterSpacing: 1,
        },
        notesText: {
          fontSize: 10,
          color: "#555555",
          lineHeight: 1.5,
        },
        thankYouText: {
          fontSize: 10,
          color: "#000000",
          bold: true,
        },
      },
      defaultStyle: {
        font: "Helvetica",
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