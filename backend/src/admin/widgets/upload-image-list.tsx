import { defineWidgetConfig } from "@medusajs/admin-sdk"
import {
  Container,
  Button,
  Text,
  FocusModal,
  toast,
} from "@medusajs/ui"
import { PhotoSolid, ArrowDownTray, ArrowUpTray } from "@medusajs/icons"
import { useState, useRef, useCallback } from "react"
import { sdk } from "../lib/sdk"

type UploadResult = {
  processedCsv: string
  handles: string[]
  summary: {
    totalRows: number
    idsFilledIn: number
    productsUpdated: number
    productsFailed: number
    localImagesLinked: number
  }
  errors?: {
    files: string[]
    updates: string[]
  }
}

type UploadStats = {
  count: number
  originalBytes: number
  bytes: number
}

type LinkColorsResult = {
  products: {
    handle: string
    colors: Record<string, number>
    colorsWithoutImages: string[]
    generalImages: number
    linksAdded: number
    linksRemoved: number
    thumbnailsSet: number
  }[]
  errors: string[]
}

type ImportPreprocessResult = {
  processedCsv: string
  summary: {
    totalRows: number
    productsToUpdate: number
    imagesPreserved: number
  }
}

const IMAGE_FILE_PATTERN = /\.(jpe?g|png|webp|gif|avif)$/i
const LOCAL_UPLOAD_CONCURRENCY = 3

const formatMb = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`

const readFileAsBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "")
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

// Everything an AI agent (or a person) needs to prepare a bulk upload.
// Keep in sync with /admin/bulk-images/* and lib/shrink-image.ts.
const AGENT_INSTRUCTIONS = `# Jutta – Bulk product upload (CSV + images)

## Workflow
1. Create the product CSV (format below) and name every image file by the naming rules.
2. Admin → Products → Bulk Image Upload: select the CSV, select the images (or the folder), click "Process Images".
   Images are shrunk automatically (WebP, max 2000 px long edge, quality 85) and uploaded.
   Filenames in the CSV are replaced with the uploaded URLs.
3. "Download Processed CSV" → Admin → Products → Import (the native Medusa import).
4. When the import has finished: back in Bulk Image Upload → "Link images to colours".
   Every image is linked to all size variants of its colour; the colour's _1 image becomes the variant thumbnail.
   Safe to run again.

## CSV format (native Medusa import – unknown columns are rejected!)
- One row per variant (colour × size). Product columns are repeated on every row of the same product.
- Columns: Product Handle, Product Title, Product Subtitle, Product Description, Product Status (published|draft),
  Product Thumbnail, Product Weight (grams), Product Material, Product Discountable, Shipping Profile Id,
  Product Sales Channel 1, Product Image 1 Url … Product Image N Url, Variant Title, Variant SKU,
  Variant Manage Inventory, Variant Allow Backorder, Variant Price EUR,
  Variant Option 1 Name, Variant Option 1 Value, Variant Option 2 Name, Variant Option 2 Value
- Options: "Farbe" (colour) and "Größe" (size). Variant Title: "<Farbe> / <Größe>", e.g. "Lila / S".
- Image cells contain only the plain filename, e.g. O02_kleid-viola_lila_1-vorne.png.
- Product Image 1..N: ALL images of ALL colours of the product, each image once, same list on every row.
- Product Thumbnail: the _1 image of the main colour.
- No extra columns (no Look, Nr, notes …).

## Image filename rules
Pattern: <Look>_<product-handle>_<colour>_<N>-<view>.<ext>
- Look: look code, letters/digits only, e.g. O02.
- product-handle: exactly the Product Handle (lowercase, hyphens, no underscores).
- colour: the "Farbe" value converted: lowercase, ä→ae, ö→oe, ü→ue, ß→ss,
  spaces and all other characters → "-".
  Examples: "Lila" → lila, "Dunkelgrün" → dunkelgruen, "Schwarz / Weiß" → schwarz-weiss.
- N: 1, 2, 3 … order within the colour; 1 = main image of that colour.
- view: vorne, 45grad, seite, hinten, detail …
- Underscores only as separators between the parts, nowhere else.
- Images that fit every colour: leave out the colour part (<Look>_<product-handle>_<N>-<view>.<ext>);
  they are shown for all colours.
- Filenames must be unique within one upload.
- Formats: PNG, JPG or WebP, any size (shrunk automatically).

Example (dress in Lila and Schwarz, sizes S/M):
  O02_kleid-viola_lila_1-vorne.png, O02_kleid-viola_lila_2-hinten.png,
  O02_kleid-viola_schwarz_1-vorne.png, O02_kleid-viola_schwarz_2-hinten.png,
  O02_kleid-viola_3-detail.png (all colours)
`

const UploadImageListWidget = () => {
  const [open, setOpen] = useState(false)
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [uploadStats, setUploadStats] = useState<UploadStats | null>(null)
  const [linkResult, setLinkResult] = useState<LinkColorsResult | null>(null)
  const [isLinking, setIsLinking] = useState(false)
  const [localUploadProgress, setLocalUploadProgress] = useState<{
    done: number
    total: number
  } | null>(null)
  const [result, setResult] = useState<UploadResult | null>(null)
  const [isPending, setIsPending] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importResult, setImportResult] = useState<ImportPreprocessResult | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)
  const importFileInputRef = useRef<HTMLInputElement>(null)

  const readFileAsText = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsText(file)
    })
  }, [])

  const downloadProcessedCsv = useCallback(() => {
    if (!result?.processedCsv) return
    const blob = new Blob([result.processedCsv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    const originalName = csvFile?.name?.replace(/\.csv$/i, "") || "products"
    link.href = url
    link.download = `${originalName}-processed.csv`
    link.click()
    URL.revokeObjectURL(url)
  }, [result, csvFile])

  const addImageFiles = useCallback((files: FileList | null) => {
    if (!files) return
    const images = Array.from(files).filter((f) => IMAGE_FILE_PATTERN.test(f.name))
    setImageFiles((prev) => {
      const seen = new Set(prev.map((f) => `${f.name}:${f.size}`))
      return [...prev, ...images.filter((f) => !seen.has(`${f.name}:${f.size}`))]
    })
  }, [])

  // Uploads only the selected images whose filename appears in the CSV. The
  // backend shrinks each image (WebP, max 2000px) before storing it through the
  // regular file module. Returns original filename -> URL.
  const uploadReferencedImages = useCallback(
    async (csv: string): Promise<Record<string, string>> => {
      const csvLower = csv.toLowerCase()
      const referenced = imageFiles.filter((f) =>
        csvLower.includes(f.name.toLowerCase())
      )
      if (referenced.length === 0) return {}

      const byName = new Map<string, File[]>()
      for (const file of referenced) {
        const key = file.name.toLowerCase()
        byName.set(key, [...(byName.get(key) ?? []), file])
      }
      const duplicates = [...byName.entries()]
        .filter(([, files]) => files.length > 1)
        .map(([, files]) => files[0].name)
      if (duplicates.length > 0) {
        throw new Error(
          `Duplicate image filenames selected: ${duplicates.join(", ")}. Filenames must be unique.`
        )
      }

      const urls: Record<string, string> = {}
      const failed: string[] = []
      const stats: UploadStats = { count: 0, originalBytes: 0, bytes: 0 }
      let done = 0
      setLocalUploadProgress({ done, total: referenced.length })

      const queue = [...referenced]
      const worker = async () => {
        let file: File | undefined
        while ((file = queue.shift())) {
          try {
            const { file: uploaded } = await sdk.client.fetch<{
              file: { url?: string; original_size: number; size: number }
            }>("/admin/bulk-images/upload", {
              method: "POST",
              body: {
                filename: file.name,
                mimeType: file.type,
                content: await readFileAsBase64(file),
              },
            })
            if (uploaded?.url) {
              urls[file.name] = uploaded.url
              stats.count++
              stats.originalBytes += uploaded.original_size
              stats.bytes += uploaded.size
            } else failed.push(file.name)
          } catch {
            failed.push(file.name)
          }
          done++
          setLocalUploadProgress({ done, total: referenced.length })
        }
      }
      await Promise.all(
        Array.from({ length: LOCAL_UPLOAD_CONCURRENCY }, worker)
      )

      if (failed.length > 0) {
        toast.error(`Failed to upload: ${failed.join(", ")}`)
      }
      setUploadStats(stats)
      return urls
    },
    [imageFiles]
  )

  const handleProcess = useCallback(async () => {
    if (!csvFile) return
    setIsPending(true)
    try {
      const csv = await readFileAsText(csvFile)
      const localImageUrls = await uploadReferencedImages(csv)
      setLocalUploadProgress(null)
      const data = await sdk.client.fetch<UploadResult>(
        "/admin/products/upload-image-list",
        { method: "POST", body: { csv, localImageUrls } }
      )
      setResult(data)
      const imageCount = Object.keys(localImageUrls).length
      const msg = data.summary.productsUpdated > 0
        ? `Processed ${imageCount} images, updated ${data.summary.productsUpdated} existing products`
        : `Processed ${imageCount} images — download the CSV to import`
      toast.success(msg)
    } catch (err) {
      const error = err as Error
      toast.error(error.message || "Failed to process images")
    } finally {
      setIsPending(false)
      setLocalUploadProgress(null)
    }
  }, [csvFile, readFileAsText, uploadReferencedImages])

  const handleLinkColors = useCallback(async () => {
    setIsLinking(true)
    try {
      const data = await sdk.client.fetch<LinkColorsResult>(
        "/admin/bulk-images/link-colors",
        { method: "POST", body: { handles: result?.handles ?? [] } }
      )
      setLinkResult(data)
      if (data.products.length === 0) {
        toast.warning(
          "No imported products with a colour option found — has the import finished?"
        )
      } else {
        toast.success(`Linked colour images for ${data.products.length} products`)
      }
    } catch (err) {
      toast.error((err as Error).message || "Failed to link images to colours")
    } finally {
      setIsLinking(false)
    }
  }, [result])

  const copyAgentInstructions = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(AGENT_INSTRUCTIONS)
      toast.success("Instructions copied")
    } catch {
      toast.error("Could not copy — select the text manually")
    }
  }, [])

  const handleClose = () => {
    setOpen(false)
    setCsvFile(null)
    setImageFiles([])
    setResult(null)
    setUploadStats(null)
    setLinkResult(null)
  }

  const handleExportCsv = useCallback(async () => {
    setIsExporting(true)
    try {
      const data = await sdk.client.fetch<{
        csv: string
        summary: {
          totalProducts: number
          totalRows: number
          imageColumnsIncluded: number
        }
      }>("/admin/products/export-csv", { method: "GET" })

      const blob = new Blob([data.csv], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `product-export-${new Date().toISOString().slice(0, 10)}.csv`
      link.click()
      URL.revokeObjectURL(url)
      toast.success(
        `Exported ${data.summary.totalProducts} products (${data.summary.totalRows} rows)`
      )
    } catch (err) {
      const error = err as Error
      toast.error(error.message || "Failed to export products")
    } finally {
      setIsExporting(false)
    }
  }, [])

  const handleImportPreprocess = useCallback(async () => {
    if (!importFile) return
    setIsImporting(true)
    try {
      const csv = await readFileAsText(importFile)
      const data = await sdk.client.fetch<ImportPreprocessResult>(
        "/admin/products/import-csv",
        { method: "POST", body: { csv } }
      )
      setImportResult(data)
      toast.success(
        `Preprocessed ${data.summary.totalRows} rows — ${data.summary.imagesPreserved} products had images preserved`
      )
    } catch (err) {
      const error = err as Error
      toast.error(error.message || "Failed to preprocess import")
    } finally {
      setIsImporting(false)
    }
  }, [importFile, readFileAsText])

  const downloadImportCsv = useCallback(() => {
    if (!importResult?.processedCsv) return
    const blob = new Blob([importResult.processedCsv], {
      type: "text/csv;charset=utf-8;",
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    const originalName =
      importFile?.name?.replace(/\.csv$/i, "") || "products"
    link.href = url
    link.download = `${originalName}-safe-import.csv`
    link.click()
    URL.revokeObjectURL(url)
  }, [importResult, importFile])

  const handleImportClose = () => {
    setImportOpen(false)
    setImportFile(null)
    setImportResult(null)
  }

  const hasErrors = result?.errors &&
    ((result.errors.files?.length ?? 0) > 0 ||
      (result.errors.updates?.length ?? 0) > 0)

  return (
    <Container className="flex items-center justify-between px-6 py-4">
      <div className="flex items-center gap-x-3">
        <PhotoSolid className="text-ui-fg-subtle" />
        <div>
          <Text size="small" leading="compact" weight="plus">
            Product CSV Tools
          </Text>
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            Export products, bulk image upload, or safe import with image
            preservation
          </Text>
        </div>
      </div>

      <div className="flex items-center gap-x-2">
        <Button
          variant="secondary"
          size="small"
          onClick={handleExportCsv}
          isLoading={isExporting}
          disabled={isExporting}
        >
          <ArrowDownTray />
          Export CSV
        </Button>
        <Button
          variant="secondary"
          size="small"
          onClick={() => setImportOpen(true)}
        >
          <ArrowUpTray />
          Safe Import
        </Button>
        <Button
          variant="secondary"
          size="small"
          onClick={() => setOpen(true)}
        >
          Bulk Image Upload
        </Button>
      </div>

      {/* Bulk Image Upload Modal (existing) */}
      <FocusModal open={open} onOpenChange={(v) => !v && handleClose()}>
        <FocusModal.Content>
          <FocusModal.Header>
            <div className="flex items-center gap-x-2">
              <FocusModal.Close asChild>
                <Button variant="secondary" size="small">
                  {result ? "Close" : "Cancel"}
                </Button>
              </FocusModal.Close>
              {!result && (
                <Button
                  size="small"
                  onClick={handleProcess}
                  disabled={!csvFile || isPending}
                  isLoading={isPending}
                >
                  Process Images
                </Button>
              )}
              {result && (
                <Button size="small" onClick={downloadProcessedCsv}>
                  <ArrowDownTray />
                  Download Processed CSV
                </Button>
              )}
            </div>
          </FocusModal.Header>

          <FocusModal.Body className="flex flex-col gap-y-6 px-6 py-4 overflow-y-auto">
            {!result ? (
              <>
                <div>
                  <Text size="large" weight="plus">
                    Process Product Image CSV
                  </Text>
                  <Text
                    size="small"
                    leading="compact"
                    className="text-ui-fg-subtle mt-1"
                  >
                    Upload your product CSV with image filenames and select the
                    image files. Images are shrunk (WebP, max 2000 px), uploaded
                    and their filenames replaced with URLs in the CSV. Products
                    that already have a Product Id are updated automatically.
                  </Text>
                </div>

                <details className="rounded-lg border border-ui-border-base p-4">
                  <summary className="cursor-pointer">
                    <Text size="small" leading="compact" weight="plus" as="span">
                      Instructions for preparing CSV and images (AI agent)
                    </Text>
                  </summary>
                  <div className="mt-3 flex flex-col gap-y-2">
                    <div>
                      <Button
                        variant="secondary"
                        size="small"
                        onClick={copyAgentInstructions}
                      >
                        Copy instructions
                      </Button>
                    </div>
                    <pre className="txt-compact-xsmall whitespace-pre-wrap rounded-md bg-ui-bg-subtle p-3 font-mono text-ui-fg-subtle">
                      {AGENT_INSTRUCTIONS}
                    </pre>
                  </div>
                </details>

                <div className="rounded-lg border border-ui-border-base p-4">
                  <Text size="small" leading="compact" weight="plus">
                    Product CSV
                  </Text>
                  <Text
                    size="small"
                    leading="compact"
                    className="text-ui-fg-subtle mb-3"
                  >
                    Image columns: Product Thumbnail, Product Image N Url (and
                    Look IMG)
                  </Text>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                  />
                  <Button
                    variant={csvFile ? "primary" : "secondary"}
                    size="small"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {csvFile ? csvFile.name : "Select CSV file"}
                  </Button>
                </div>

                <div className="rounded-lg border border-ui-border-base p-4">
                  <Text size="small" leading="compact" weight="plus">
                    Local images (optional)
                  </Text>
                  <Text
                    size="small"
                    leading="compact"
                    className="text-ui-fg-subtle mb-3"
                  >
                    Put the filename (e.g. jacke-rot-1.jpg) into an image column
                    of the CSV and select the file here. Only images whose
                    filename appears in the CSV are uploaded.
                  </Text>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      addImageFiles(e.target.files)
                      e.target.value = ""
                    }}
                  />
                  <input
                    ref={folderInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    {...({ webkitdirectory: "" } as Record<string, string>)}
                    onChange={(e) => {
                      addImageFiles(e.target.files)
                      e.target.value = ""
                    }}
                  />
                  <div className="flex items-center gap-x-2">
                    <Button
                      variant="secondary"
                      size="small"
                      onClick={() => imageInputRef.current?.click()}
                    >
                      Select images
                    </Button>
                    <Button
                      variant="secondary"
                      size="small"
                      onClick={() => folderInputRef.current?.click()}
                    >
                      Select folder
                    </Button>
                    {imageFiles.length > 0 && (
                      <>
                        <Text size="small" className="text-ui-fg-subtle">
                          {imageFiles.length} images selected
                        </Text>
                        <Button
                          variant="transparent"
                          size="small"
                          onClick={() => setImageFiles([])}
                        >
                          Clear
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {isPending && (
                  <div className="rounded-lg border border-ui-border-base bg-ui-bg-subtle p-4">
                    <Text
                      size="small"
                      leading="compact"
                      className="text-ui-fg-subtle"
                    >
                      {localUploadProgress
                        ? `Shrinking and uploading images... ${localUploadProgress.done} / ${localUploadProgress.total}`
                        : "Processing CSV..."}
                    </Text>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col gap-y-4">
                <Text size="large" weight="plus">
                  Processing Complete
                </Text>
                <Text
                  size="small"
                  leading="compact"
                  className="text-ui-fg-subtle"
                >
                  Next: 1) download the processed CSV, 2) import it via Products →
                  Import, 3) when the import has finished, link the images to
                  their colours below.
                </Text>

                <div className="grid grid-cols-3 gap-3">
                  <StatCard
                    label="Images Uploaded"
                    value={uploadStats?.count ?? 0}
                    subtitle={
                      uploadStats && uploadStats.count > 0
                        ? `${formatMb(uploadStats.originalBytes)} → ${formatMb(uploadStats.bytes)}`
                        : undefined
                    }
                  />
                  <StatCard
                    label="Local Images Linked"
                    value={result.summary.localImagesLinked ?? 0}
                    subtitle="(CSV cells)"
                  />
                  <StatCard
                    label="Total Rows"
                    value={result.summary.totalRows}
                  />
                  <StatCard
                    label="IDs Auto-Filled"
                    value={result.summary.idsFilledIn}
                    subtitle="(looked up by handle)"
                  />
                  <StatCard
                    label="Products Updated"
                    value={result.summary.productsUpdated}
                  />
                </div>

                {hasErrors && (
                  <div className="rounded-lg border border-ui-border-error p-4">
                    <Text
                      size="small"
                      weight="plus"
                      className="text-ui-fg-error mb-2"
                    >
                      Errors
                    </Text>
                    {result.errors!.files?.map((e, i) => (
                      <Text
                        key={`dl-${i}`}
                        size="small"
                        className="text-ui-fg-subtle"
                      >
                        {e}
                      </Text>
                    ))}
                    {result.errors!.updates?.map((e, i) => (
                      <Text
                        key={`up-${i}`}
                        size="small"
                        className="text-ui-fg-subtle"
                      >
                        {e}
                      </Text>
                    ))}
                  </div>
                )}

                <div className="rounded-lg border border-ui-border-base p-4">
                  <Text size="small" leading="compact" weight="plus">
                    Link images to colours
                  </Text>
                  <Text
                    size="small"
                    leading="compact"
                    className="text-ui-fg-subtle mb-3"
                  >
                    Run after the import has finished. Uses the colour in the
                    image filename (e.g. _lila_) to show the right images per
                    colour in the shop. No images are uploaded again.
                  </Text>
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={handleLinkColors}
                    isLoading={isLinking}
                    disabled={isLinking}
                  >
                    Link images to colours
                  </Button>
                  {linkResult && (
                    <div className="mt-3 flex flex-col gap-y-1">
                      {linkResult.products.map((p) => (
                        <Text key={p.handle} size="small" className="text-ui-fg-subtle">
                          {p.handle}:{" "}
                          {Object.entries(p.colors)
                            .map(([color, n]) => `${color} ${n}`)
                            .join(", ")}
                          {p.generalImages > 0 && ` · ${p.generalImages} for all colours`}
                          {` · +${p.linksAdded} links`}
                          {p.colorsWithoutImages.length > 0 && (
                            <span className="text-ui-fg-error">
                              {` · no images for ${p.colorsWithoutImages.join(", ")}`}
                            </span>
                          )}
                        </Text>
                      ))}
                      {linkResult.errors.map((e, i) => (
                        <Text key={i} size="small" className="text-ui-fg-error">
                          {e}
                        </Text>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </FocusModal.Body>
        </FocusModal.Content>
      </FocusModal>

      {/* Safe Import Modal */}
      <FocusModal
        open={importOpen}
        onOpenChange={(v) => !v && handleImportClose()}
      >
        <FocusModal.Content>
          <FocusModal.Header>
            <div className="flex items-center gap-x-2">
              <FocusModal.Close asChild>
                <Button variant="secondary" size="small">
                  {importResult ? "Close" : "Cancel"}
                </Button>
              </FocusModal.Close>
              {!importResult && (
                <Button
                  size="small"
                  onClick={handleImportPreprocess}
                  disabled={!importFile || isImporting}
                  isLoading={isImporting}
                >
                  Preprocess CSV
                </Button>
              )}
              {importResult && (
                <Button size="small" onClick={downloadImportCsv}>
                  <ArrowDownTray />
                  Download Safe CSV
                </Button>
              )}
            </div>
          </FocusModal.Header>

          <FocusModal.Body className="flex flex-col gap-y-6 px-6 py-4 overflow-y-auto">
            {!importResult ? (
              <>
                <div>
                  <Text size="large" weight="plus">
                    Safe Import (Image Preservation)
                  </Text>
                  <Text
                    size="small"
                    leading="compact"
                    className="text-ui-fg-subtle mt-1"
                  >
                    Upload your product CSV for import. For products being
                    updated, existing images will be preserved when the image
                    columns are empty. Download the preprocessed CSV and use
                    it with the standard Medusa Import function.
                  </Text>
                </div>

                <div className="rounded-lg border border-ui-border-base p-4">
                  <Text size="small" leading="compact" weight="plus">
                    Product CSV
                  </Text>
                  <Text
                    size="small"
                    leading="compact"
                    className="text-ui-fg-subtle mb-3"
                  >
                    Supports up to 10 Product Image columns. Empty image fields
                    will be filled with existing product images.
                  </Text>
                  <input
                    ref={importFileInputRef}
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={(e) =>
                      setImportFile(e.target.files?.[0] || null)
                    }
                  />
                  <Button
                    variant={importFile ? "primary" : "secondary"}
                    size="small"
                    onClick={() => importFileInputRef.current?.click()}
                  >
                    {importFile ? importFile.name : "Select CSV file"}
                  </Button>
                </div>

                {isImporting && (
                  <div className="rounded-lg border border-ui-border-base bg-ui-bg-subtle p-4">
                    <Text
                      size="small"
                      leading="compact"
                      className="text-ui-fg-subtle"
                    >
                      Checking existing product images and preprocessing CSV...
                    </Text>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col gap-y-4">
                <Text size="large" weight="plus">
                  Preprocessing Complete
                </Text>
                <Text
                  size="small"
                  leading="compact"
                  className="text-ui-fg-subtle"
                >
                  Download the preprocessed CSV and import it using the
                  standard Medusa Import button. Existing images have been
                  filled in for products where image columns were empty.
                </Text>

                <div className="grid grid-cols-3 gap-3">
                  <StatCard
                    label="Total Rows"
                    value={importResult.summary.totalRows}
                  />
                  <StatCard
                    label="Products to Update"
                    value={importResult.summary.productsToUpdate}
                  />
                  <StatCard
                    label="Images Preserved"
                    value={importResult.summary.imagesPreserved}
                    subtitle="(filled from existing data)"
                  />
                </div>
              </div>
            )}
          </FocusModal.Body>
        </FocusModal.Content>
      </FocusModal>
    </Container>
  )
}

function StatCard({
  label,
  value,
  subtitle,
}: {
  label: string
  value: number
  subtitle?: string
}) {
  return (
    <div className="rounded-lg border border-ui-border-base p-3">
      <Text size="small" leading="compact" className="text-ui-fg-subtle">
        {label}
      </Text>
      <Text size="large" weight="plus">
        {value}
      </Text>
      {subtitle && (
        <Text size="xsmall" className="text-ui-fg-muted">
          {subtitle}
        </Text>
      )}
    </div>
  )
}

export const config = defineWidgetConfig({
  zone: "product.list.before",
})

export default UploadImageListWidget
