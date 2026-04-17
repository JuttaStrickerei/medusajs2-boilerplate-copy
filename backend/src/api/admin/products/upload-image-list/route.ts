import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import { Client } from "minio"
import { ulid } from "ulid"
import * as https from "https"
import * as http from "http"

interface UploadImageListBody {
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

function isGoogleDriveUrl(url: string): boolean {
  const lower = url.toLowerCase()
  return lower.includes("drive.google.com") || lower.includes("drive.usercontent.google.com")
}

function isValidUrl(value: string): boolean {
  return /^https?:\/\/.+/.test(value)
}

function extractGoogleDriveFileId(url: string): string | null {
  // Handle /file/d/ID format
  const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)
  if (fileMatch) return fileMatch[1]
  // Handle uc?export=download&id=ID format
  const ucMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/)
  if (ucMatch) return ucMatch[1]
  return null
}

function getDirectDownloadUrl(driveUrl: string): string {
  const fileId = extractGoogleDriveFileId(driveUrl)
  if (!fileId) return driveUrl
  return `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=t`
}

function getFallbackDownloadUrls(driveUrl: string): string[] {
  const fileId = extractGoogleDriveFileId(driveUrl)
  if (!fileId) return []
  return [
    `https://drive.google.com/uc?export=download&id=${fileId}&confirm=t`,
    `https://drive.google.com/uc?export=download&id=${fileId}&confirm=t&authuser=0`,
  ]
}

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"

function isHtmlContent(buffer: Buffer): boolean {
  const head = buffer.slice(0, 1500).toString("utf8").toLowerCase()
  return (
    head.includes("<!doctype") ||
    head.includes("<html") ||
    head.includes("<head") ||
    head.includes("<script") ||
    head.includes("virus scan warning") ||
    head.includes("google-download-warning")
  )
}

function downloadFile(url: string, maxRedirects = 10): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith("https") ? https : http
    const req = protocol.get(
      url,
      { headers: { "User-Agent": BROWSER_UA } },
      (res) => {
        if (
          res.statusCode &&
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location
        ) {
          if (maxRedirects <= 0)
            return reject(new Error("Too many redirects"))
          return resolve(downloadFile(res.headers.location, maxRedirects - 1))
        }
        if (res.statusCode !== 200) {
          return reject(new Error(`HTTP ${res.statusCode} for ${url}`))
        }
        const chunks: Buffer[] = []
        res.on("data", (chunk) => chunks.push(chunk))
        res.on("end", () => {
          const buffer = Buffer.concat(chunks)
          if (isHtmlContent(buffer)) {
            return reject(
              new Error("Got HTML page instead of image - file may require confirmation or is not publicly shared")
            )
          }
          resolve(buffer)
        })
        res.on("error", reject)
      }
    )
    req.on("error", reject)
    req.setTimeout(60000, () => {
      req.destroy()
      reject(new Error(`Timeout downloading ${url}`))
    })
  })
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function downloadWithRetry(
  url: string,
  retries = 3,
  delayMs = 2000
): Promise<Buffer> {
  let lastError: Error | undefined
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await downloadFile(url)
    } catch (err) {
      lastError = err as Error
      const msg = lastError.message || ""
      const isTransient =
        msg.includes("ECONNRESET") ||
        msg.includes("ETIMEDOUT") ||
        msg.includes("ECONNREFUSED") ||
        msg.includes("socket hang up") ||
        msg.includes("Timeout")
      if (!isTransient || attempt === retries - 1) break
      await sleep(delayMs * (attempt + 1))
    }
  }
  throw lastError!
}

async function downloadFromDrive(driveUrl: string): Promise<Buffer> {
  const urls = [
    getDirectDownloadUrl(driveUrl),
    ...getFallbackDownloadUrls(driveUrl),
  ]

  let lastError: Error | undefined
  for (const url of urls) {
    try {
      return await downloadWithRetry(url)
    } catch (err) {
      lastError = err as Error
    }
  }

  throw new Error(
    `All download attempts failed: ${lastError?.message || "unknown error"}`
  )
}

function detectMimeType(buffer: Buffer): string {
  if (buffer[0] === 0x89 && buffer[1] === 0x50) return "image/png"
  if (buffer[0] === 0xff && buffer[1] === 0xd8) return "image/jpeg"
  if (buffer[0] === 0x47 && buffer[1] === 0x49) return "image/gif"
  if (buffer[0] === 0x52 && buffer[1] === 0x49) return "image/webp"
  return "image/jpeg"
}

export async function POST(
  req: AuthenticatedMedusaRequest<UploadImageListBody>,
  res: MedusaResponse
) {
  const { csv } = req.body

  if (!csv) {
    res.status(400).json({ message: "CSV content is required" })
    return
  }

  const minioEndpoint = process.env.MINIO_ENDPOINT
  const minioAccessKey = process.env.MINIO_ACCESS_KEY
  const minioSecretKey = process.env.MINIO_SECRET_KEY
  const minioBucket = process.env.MINIO_BUCKET || "medusa-media"

  if (!minioEndpoint || !minioAccessKey || !minioSecretKey) {
    res.status(500).json({ message: "MinIO is not configured on the server" })
    return
  }

  const minioClient = new Client({
    endPoint: minioEndpoint,
    port: 443,
    useSSL: true,
    accessKey: minioAccessKey,
    secretKey: minioSecretKey,
  })

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

    // Collect all unique Drive URLs from the CSV
    const driveUrls = new Set<string>()
    for (const row of rows) {
      for (const col of imageColumns) {
        const val = row[col.idx]?.trim()
        if (val && isValidUrl(val) && isGoogleDriveUrl(val)) {
          driveUrls.add(val)
        }
      }
    }

    // Download each image from Drive, upload to MinIO
    const driveUrlToMinioUrl = new Map<string, string>()
    const downloadErrors: string[] = []
    let imagesProcessed = 0

    for (const driveUrl of driveUrls) {
      const fileId = extractGoogleDriveFileId(driveUrl) || ulid()
      try {
        const buffer = await downloadFromDrive(driveUrl)

        if (buffer.length < 500) {
          downloadErrors.push(
            `${fileId}: File too small (${buffer.length} bytes), likely not an image`
          )
          continue
        }

        const mimeType = detectMimeType(buffer)
        const ext =
          mimeType === "image/png"
            ? ".png"
            : mimeType === "image/webp"
              ? ".webp"
              : mimeType === "image/gif"
                ? ".gif"
                : ".jpg"
        const fileKey = `products/${fileId}-${ulid()}${ext}`

        await minioClient.putObject(minioBucket, fileKey, buffer, buffer.length, {
          "Content-Type": mimeType,
          "x-amz-acl": "public-read",
        })

        const minioUrl = `https://${minioEndpoint}/${minioBucket}/${fileKey}`
        driveUrlToMinioUrl.set(driveUrl, minioUrl)
        imagesProcessed++
      } catch (err) {
        downloadErrors.push(`${fileId}: ${(err as Error).message}`)
      }
    }

    // Replace Drive URLs in the original CSV text (preserves formatting)
    let processedCsv = csv
    for (const [driveUrl, minioUrl] of driveUrlToMinioUrl) {
      processedCsv = processedCsv.split(driveUrl).join(minioUrl)
    }

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
          !isGoogleDriveUrl(val) &&
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

      const candidateThumbnail = thumbnail || lookImgUrl || imageUrls[0]?.url
      const finalThumbnail =
        candidateThumbnail && !isGoogleDriveUrl(candidateThumbnail)
          ? candidateThumbnail
          : undefined

      if (lookImgUrl && !isGoogleDriveUrl(lookImgUrl) && !imageUrls.some((img) => img.url === lookImgUrl)) {
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

    res.json({
      processedCsv,
      summary: {
        totalRows: rows.length,
        delimiter,
        driveLinksFound: driveUrls.size,
        imagesUploaded: imagesProcessed,
        urlsReplaced: driveUrlToMinioUrl.size,
        idsFilledIn,
        productsUpdated,
        productsFailed,
      },
      errors:
        downloadErrors.length > 0 || updateErrors.length > 0
          ? { downloads: downloadErrors, updates: updateErrors }
          : undefined,
    })
  } catch (err) {
    res.status(500).json({
      message: `Image upload failed: ${(err as Error).message}`,
    })
  }
}
