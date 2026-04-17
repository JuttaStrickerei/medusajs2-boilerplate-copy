import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import type { IProductModuleService, Logger } from "@medusajs/framework/types"
import { Client } from "minio"

const MINIO_ENDPOINT = process.env.MINIO_ENDPOINT || ""
const MINIO_BUCKET = process.env.MINIO_BUCKET || "medusa-media"

let minioClient: Client | null = null

function getMinioClient(): Client | null {
  if (minioClient) return minioClient
  if (!MINIO_ENDPOINT || !process.env.MINIO_ACCESS_KEY || !process.env.MINIO_SECRET_KEY) {
    return null
  }
  minioClient = new Client({
    endPoint: MINIO_ENDPOINT,
    port: 443,
    useSSL: true,
    accessKey: process.env.MINIO_ACCESS_KEY,
    secretKey: process.env.MINIO_SECRET_KEY,
  })
  return minioClient
}

function extractFileKey(url: string): string | null {
  try {
    const u = new URL(url)
    if (!u.hostname.includes(MINIO_ENDPOINT)) {
      return null
    }
    const prefix = `/${MINIO_BUCKET}/`
    if (u.pathname.startsWith(prefix)) {
      return u.pathname.slice(prefix.length)
    }
    return null
  } catch {
    return null
  }
}

/**
 * Middleware for DELETE /admin/products/:id
 *
 * Captures product image URLs before the product is deleted,
 * then removes the corresponding files from MinIO storage
 * after a successful response.
 */
export async function cleanupProductImagesMiddleware(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  const productId = req.params.id
  if (!productId) {
    return next()
  }

  let fileKeys: string[] = []
  const logger: Logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER)

  try {
    const productModule: IProductModuleService = req.scope.resolve(Modules.PRODUCT)
    const product = await productModule.retrieveProduct(productId, {
      relations: ["images"],
    })

    const imageUrls = new Set<string>()
    if (product.images) {
      for (const img of product.images) {
        if (img.url) imageUrls.add(img.url)
      }
    }
    if (product.thumbnail) {
      imageUrls.add(product.thumbnail)
    }

    for (const url of imageUrls) {
      const key = extractFileKey(url)
      if (key) fileKeys.push(key)
    }
  } catch {
    // Don't block deletion if we can't fetch images
  }

  if (fileKeys.length > 0) {
    res.on("finish", async () => {
      if (res.statusCode < 200 || res.statusCode >= 300) return

      const client = getMinioClient()
      if (!client) {
        logger.warn("[ImageCleanup] MinIO client not available, skipping cleanup")
        return
      }

      for (const fileKey of fileKeys) {
        try {
          await client.removeObject(MINIO_BUCKET, fileKey)
          logger.info(`[ImageCleanup] Deleted file: ${fileKey}`)
        } catch (err) {
          logger.warn(
            `[ImageCleanup] Failed to delete ${fileKey}: ${(err as Error).message}`
          )
        }
      }
    })
  }

  next()
}
