import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { uploadFilesWorkflow } from "@medusajs/medusa/core-flows"
import { shrinkImage } from "../../../../lib/shrink-image"

type BulkImageUploadBody = {
  filename: string
  mimeType: string
  // base64 file content
  content: string
}

// Used by the Bulk Image Upload widget instead of /admin/uploads: shrinks the
// image first, then stores it through the regular file module (MinIO in prod,
// local files in dev). One file per request keeps the body size predictable.
export async function POST(
  req: AuthenticatedMedusaRequest<BulkImageUploadBody>,
  res: MedusaResponse
) {
  const { filename, mimeType, content } = req.body ?? ({} as BulkImageUploadBody)

  if (!filename || !content) {
    res.status(400).json({ message: "filename and content are required" })
    return
  }

  const image = await shrinkImage(
    Buffer.from(content, "base64"),
    filename,
    mimeType || "application/octet-stream"
  )

  const { result } = await uploadFilesWorkflow(req.scope).run({
    input: {
      files: [
        {
          filename: image.filename,
          mimeType: image.mimeType,
          content: image.buffer.toString("base64"),
          access: "public",
        },
      ],
    },
  })

  res.status(200).json({
    file: {
      original_filename: filename,
      url: result[0]?.url,
      original_size: image.originalSize,
      size: image.buffer.length,
      shrunk: image.shrunk,
    },
  })
}
