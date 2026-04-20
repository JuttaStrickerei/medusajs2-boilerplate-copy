import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"

interface ImportCsvBody {
  csv: string
}

function normalizeCsvInput(content: string): string {
  return content.replace(/^\uFEFF/, "")
}

function detectDelimiter(line: string): "," | ";" | "\t" {
  const candidates: Array<"," | ";" | "\t"> = [",", ";", "\t"]
  let best: "," | ";" | "\t" = ","
  let bestCount = -1

  for (const delimiter of candidates) {
    let inQuotes = false
    let count = 0
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          i++
        } else {
          inQuotes = !inQuotes
        }
      } else if (char === delimiter && !inQuotes) {
        count++
      }
    }
    if (count > bestCount) {
      best = delimiter
      bestCount = count
    }
  }

  return best
}

function parseLine(line: string, delimiter: "," | ";" | "\t"): string[] {
  const result: string[] = []
  let current = ""
  let inQ = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === '"') {
      if (inQ && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQ = !inQ
      }
    } else if (c === delimiter && !inQ) {
      result.push(current)
      current = ""
    } else {
      current += c
    }
  }
  result.push(current)
  return result
}

function parseCSV(
  content: string,
  explicitDelimiter?: "," | ";" | "\t"
): { headers: string[]; rows: string[][]; delimiter: "," | ";" | "\t" } {
  const normalized = normalizeCsvInput(content)
  const lines: string[] = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < normalized.length; i++) {
    const char = normalized[i]
    if (char === '"') {
      if (inQuotes && normalized[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (current.trim()) lines.push(current)
      current = ""
      if (char === "\r" && normalized[i + 1] === "\n") i++
    } else {
      current += char
    }
  }
  if (current.trim()) lines.push(current)
  if (lines.length === 0) return { headers: [], rows: [], delimiter: "," }

  const delimiter = explicitDelimiter || detectDelimiter(lines[0])
  const headers = parseLine(lines[0], delimiter)
  const rows = lines.slice(1).map((l) => parseLine(l, delimiter))
  return { headers, rows, delimiter }
}

function normalizeHeader(value: string): string {
  return value
    .replace(/\u00A0/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
}

function escapeCsvField(value: string): string {
  if (value === "") return ""
  if (
    value.includes(",") ||
    value.includes('"') ||
    value.includes("\n") ||
    value.includes("\r") ||
    value.includes(";") ||
    value.includes("\t")
  ) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export async function POST(
  req: AuthenticatedMedusaRequest<ImportCsvBody>,
  res: MedusaResponse
) {
  const { csv } = req.body

  if (!csv) {
    res.status(400).json({ message: "CSV content is required" })
    return
  }

  const productService = req.scope.resolve(Modules.PRODUCT)

  try {
    const { headers, rows, delimiter } = parseCSV(csv)
    const normalizedHeaders = headers.map(normalizeHeader)

    const productIdIdx = normalizedHeaders.findIndex(
      (h) => h === "product id"
    )
    const handleIdx = normalizedHeaders.findIndex(
      (h) => h === "product handle"
    )
    const thumbnailIdx = normalizedHeaders.findIndex(
      (h) => h === "product thumbnail"
    )

    const imageColumnIndices: number[] = []
    normalizedHeaders.forEach((h, idx) => {
      if (/^product image \d+ url$/.test(h)) {
        imageColumnIndices.push(idx)
      }
    })

    const productIdsInCsv = new Set<string>()
    for (const row of rows) {
      const pid = productIdIdx >= 0 ? row[productIdIdx]?.trim() : ""
      if (pid && pid.startsWith("prod_")) {
        productIdsInCsv.add(pid)
      }
    }

    const existingImagesByProduct = new Map<
      string,
      { thumbnail?: string; images: { url: string }[] }
    >()

    if (productIdsInCsv.size > 0 && imageColumnIndices.length > 0) {
      const productIds = [...productIdsInCsv]
      const batchSize = 50
      for (let i = 0; i < productIds.length; i += batchSize) {
        const batch = productIds.slice(i, i + batchSize)
        try {
          const products = await productService.listProducts(
            { id: batch },
            { select: ["id", "thumbnail"], relations: ["images"] }
          )
          for (const p of products) {
            existingImagesByProduct.set(p.id, {
              thumbnail: p.thumbnail || undefined,
              images: (p.images || [])
                .sort(
                  (a: { rank?: number }, b: { rank?: number }) =>
                    (a.rank ?? 0) - (b.rank ?? 0)
                )
                .map((img: { url: string }) => ({ url: img.url })),
            })
          }
        } catch {
          // fallback: skip image preservation for this batch
        }
      }
    }

    const processedRows: string[][] = []
    let imagesPreservedCount = 0

    const productRowsSeen = new Map<string, boolean>()

    for (const row of rows) {
      const productId =
        productIdIdx >= 0 ? row[productIdIdx]?.trim() : ""
      const isUpdate = productId && productId.startsWith("prod_")

      if (!isUpdate || imageColumnIndices.length === 0) {
        processedRows.push(row)
        continue
      }

      const thumbnailValue =
        thumbnailIdx >= 0 ? row[thumbnailIdx]?.trim() : ""
      const allImageValues = imageColumnIndices.map(
        (idx) => row[idx]?.trim() || ""
      )
      const hasAnyImage =
        allImageValues.some((v) => v.length > 0) ||
        thumbnailValue.length > 0

      if (hasAnyImage) {
        processedRows.push(row)
        continue
      }

      if (productRowsSeen.has(productId)) {
        processedRows.push(row)
        continue
      }
      productRowsSeen.set(productId, true)

      const existing = existingImagesByProduct.get(productId)
      if (!existing || existing.images.length === 0) {
        processedRows.push(row)
        continue
      }

      const newRow = [...row]

      if (
        thumbnailIdx >= 0 &&
        !newRow[thumbnailIdx]?.trim() &&
        existing.thumbnail
      ) {
        newRow[thumbnailIdx] = existing.thumbnail
      }

      for (let i = 0; i < imageColumnIndices.length; i++) {
        const colIdx = imageColumnIndices[i]
        if (i < existing.images.length) {
          newRow[colIdx] = existing.images[i].url
        }
      }

      imagesPreservedCount++
      processedRows.push(newRow)
    }

    const outputLines = [
      headers.map(escapeCsvField).join(delimiter),
      ...processedRows.map(
        (row) => row.map(escapeCsvField).join(delimiter)
      ),
    ]
    const processedCsv = "\uFEFF" + outputLines.join("\r\n")

    res.json({
      processedCsv,
      summary: {
        totalRows: rows.length,
        productsToUpdate: productIdsInCsv.size,
        imagesPreserved: imagesPreservedCount,
      },
    })
  } catch (err) {
    res.status(500).json({
      message: `Import pre-processing failed: ${(err as Error).message}`,
    })
  }
}
