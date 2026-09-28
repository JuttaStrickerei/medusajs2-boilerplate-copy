import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"

interface UploadImageListBody {
  csv: string
  // Local image filename -> URL, for files the admin widget already uploaded
  // via /admin/bulk-images/upload. CSV cells may contain the plain filename instead of a URL.
  localImageUrls?: Record<string, string>
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

function normalizeHeader(value: string): string {
  return value
    .replace(/\u00A0/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
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
    // Keep quotes in the line so parseLine can still tell quoted delimiters apart
    if (char === '"') {
      if (inQuotes && normalized[i + 1] === '"') {
        current += '""'
        i++
      } else {
        current += '"'
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

function serializeCSV(
  headers: string[],
  rows: string[][],
  delimiter: "," | ";" | "\t",
  lineEnding: string
): string {
  const escapeField = (value: string) =>
    value.includes(delimiter) ||
    value.includes('"') ||
    value.includes("\n") ||
    value.includes("\r")
      ? `"${value.replace(/"/g, '""')}"`
      : value
  return [headers, ...rows]
    .map((fields) => fields.map((f) => escapeField(f ?? "")).join(delimiter))
    .join(lineEnding)
}

// "fotos/Jacke-Rot-1.JPG" -> "jacke-rot-1.jpg"
function normalizeLocalFilename(value: string): string {
  return value.trim().split(/[\\/]/).pop()!.toLowerCase()
}

function isValidUrl(value: string): boolean {
  return /^https?:\/\/.+/.test(value)
}

export async function POST(
  req: AuthenticatedMedusaRequest<UploadImageListBody>,
  res: MedusaResponse
) {
  const { csv: rawCsv, localImageUrls } = req.body
  let csv = rawCsv

  if (!csv) {
    res.status(400).json({ message: "CSV content is required" })
    return
  }

  const productService = req.scope.resolve(Modules.PRODUCT)

  try {
    const { headers, rows, delimiter } = parseCSV(csv)
    const normalizedHeaders = headers.map(normalizeHeader)

    const imageColumns = normalizedHeaders
      .map((h, idx) => ({ name: h, idx }))
      .filter(({ name }) => {
        return (
          name === "look img" ||
          name === "product thumbnail" ||
          /^product image \d+ url$/.test(name)
        )
      })

    if (imageColumns.length === 0) {
      res.status(400).json({
        message:
          'No image columns found. Expected "Look IMG", "Product Thumbnail", or "Product Image N Url" columns.',
      })
      return
    }

    // Replace local filenames in image cells with the URLs of the files the
    // widget uploaded. Cell-level (not text replace) so a short name like
    // "1.jpg" can't hit other columns.
    const localUrlByName = new Map<string, string>(
      Object.entries(localImageUrls ?? {}).map(([name, url]) => [
        normalizeLocalFilename(name),
        url,
      ])
    )
    const missingLocalFiles = new Set<string>()
    let localImagesLinked = 0
    for (const row of rows) {
      for (const col of imageColumns) {
        const val = row[col.idx]?.trim()
        if (!val || isValidUrl(val)) continue
        const url = localUrlByName.get(normalizeLocalFilename(val))
        if (url) {
          row[col.idx] = url
          localImagesLinked++
        } else {
          missingLocalFiles.add(val)
        }
      }
    }
    if (localImagesLinked > 0) {
      csv = serializeCSV(
        headers,
        rows,
        delimiter,
        csv.includes("\r\n") ? "\r\n" : "\n"
      )
    }

    let processedCsv = csv
    const fileErrors: string[] = []

    // Look up missing Product IDs by handle so the CSV can be used for import
    const productIdIdx = normalizedHeaders.findIndex((h) => h === "product id")
    const handleIdx = normalizedHeaders.findIndex((h) => h === "product handle")
    const thumbnailIdx = normalizedHeaders.findIndex(
      (h) => h === "product thumbnail"
    )

    // Collect all handles that are missing a Product Id
    const handlesWithoutId: string[] = []
    for (const row of rows) {
      const pid = productIdIdx >= 0 ? row[productIdIdx]?.trim() : ""
      const handle = handleIdx >= 0 ? row[handleIdx]?.trim() : ""
      if (handle && (!pid || !pid.startsWith("prod_"))) {
        handlesWithoutId.push(handle)
      }
    }

    // Batch lookup products by handle to fill in missing IDs
    const handleToProductId = new Map<string, string>()
    let idsFilledIn = 0
    if (handlesWithoutId.length > 0 && handleIdx >= 0) {
      const batchSize = 50
      for (let i = 0; i < handlesWithoutId.length; i += batchSize) {
        const batch = handlesWithoutId.slice(i, i + batchSize)
        try {
          const products = await productService.listProducts(
            { handle: batch },
            { select: ["id", "handle"] }
          )
          for (const p of products) {
            if (p.handle) handleToProductId.set(p.handle, p.id)
          }
        } catch {
          // Fallback: look up one by one
          for (const h of batch) {
            try {
              const products = await productService.listProducts(
                { handle: h },
                { select: ["id", "handle"] }
              )
              if (products.length > 0) {
                handleToProductId.set(h, products[0].id)
              }
            } catch {
              // Product doesn't exist yet
            }
          }
        }
      }

      // Replace empty Product Id cells in the CSV for each handle we found
      if (handleToProductId.size > 0 && productIdIdx >= 0) {
        const { rows: parsedRows } = parseCSV(processedCsv, delimiter)
        const escapedDelimiter = delimiter.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
        for (const row of parsedRows) {
          const pid = row[productIdIdx]?.trim()
          const handle = row[handleIdx]?.trim()
          if (handle && (!pid || !pid.startsWith("prod_")) && handleToProductId.has(handle)) {
            const foundId = handleToProductId.get(handle)!
            // Find this row's handle in the raw CSV and insert the product ID
            // We need to find the pattern: the empty Product Id field before this handle
            const escapedHandle = handle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
            // Match: start of line (or after newline) with empty first field, then comma, then the handle
            const pattern = new RegExp(
              `(^|\\n|\\r\\n)(${escapedDelimiter}${escapedHandle}${escapedDelimiter})`,
              "g"
            )
            processedCsv = processedCsv.replace(
              pattern,
              `$1${foundId}${delimiter}${handle}${delimiter}`
            )
            idsFilledIn++
          }
        }
      }
    }

    // Update existing products (with Product Id) directly
    let productsUpdated = 0
    let productsFailed = 0
    const updateErrors: string[] = []

    const { rows: updatedRows } = parseCSV(processedCsv, delimiter)

    for (const row of updatedRows) {
      const productId = productIdIdx >= 0 ? row[productIdIdx]?.trim() : ""
      if (!productId || !productId.startsWith("prod_")) continue

      const imageUrls: { url: string }[] = []
      for (const col of imageColumns) {
        const val = row[col.idx]?.trim()
        if (
          val &&
          isValidUrl(val) &&
          col.name.toLowerCase() !== "product thumbnail"
        ) {
          imageUrls.push({ url: val })
        }
      }

      const rawThumbnail =
        thumbnailIdx >= 0 ? row[thumbnailIdx]?.trim() : undefined
      const thumbnail = rawThumbnail && isValidUrl(rawThumbnail) ? rawThumbnail : undefined
      const lookImgCol = imageColumns.find(
        (c) => c.name === "look img"
      )
      const rawLookImg = lookImgCol ? row[lookImgCol.idx]?.trim() : undefined
      const lookImgUrl = rawLookImg && isValidUrl(rawLookImg) ? rawLookImg : undefined

      const finalThumbnail = thumbnail || lookImgUrl || imageUrls[0]?.url

      if (lookImgUrl && !imageUrls.some((img) => img.url === lookImgUrl)) {
        imageUrls.unshift({ url: lookImgUrl })
      }

      if (!finalThumbnail && imageUrls.length === 0) continue

      const handle = handleIdx >= 0 ? row[handleIdx]?.trim() : productId

      try {
        const updateData: Record<string, unknown> = {}
        if (finalThumbnail) updateData.thumbnail = finalThumbnail
        if (imageUrls.length > 0) updateData.images = imageUrls
        await productService.updateProducts(productId, updateData)
        productsUpdated++
      } catch (err) {
        productsFailed++
        updateErrors.push(`${handle}: ${(err as Error).message}`)
      }
    }

    for (const name of missingLocalFiles) {
      fileErrors.push(`${name}: no matching local image file selected`)
    }

    const handles =
      handleIdx >= 0
        ? Array.from(new Set(rows.map((r) => r[handleIdx]?.trim()).filter(Boolean)))
        : []

    res.json({
      processedCsv,
      handles,
      summary: {
        totalRows: rows.length,
        delimiter,
        idsFilledIn,
        productsUpdated,
        productsFailed,
        localImagesLinked,
      },
      errors:
        fileErrors.length > 0 || updateErrors.length > 0
          ? { files: fileErrors, updates: updateErrors }
          : undefined,
    })
  } catch (err) {
    res.status(500).json({
      message: `Image upload failed: ${(err as Error).message}`,
    })
  }
}
