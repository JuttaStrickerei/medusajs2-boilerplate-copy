import { defineWidgetConfig } from "@medusajs/admin-sdk"
import {
  Container,
  Button,
  Text,
  FocusModal,
  toast,
} from "@medusajs/ui"
import { PhotoSolid, ArrowDownTray } from "@medusajs/icons"
import { useState, useRef, useCallback } from "react"
import { sdk } from "../lib/sdk"

type UploadResult = {
  processedCsv: string
  summary: {
    totalRows: number
    driveLinksFound: number
    imagesUploaded: number
    urlsReplaced: number
    idsFilledIn: number
    productsUpdated: number
    productsFailed: number
  }
  errors?: {
    downloads: string[]
    updates: string[]
  }
}

const UploadImageListWidget = () => {
  const [open, setOpen] = useState(false)
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [result, setResult] = useState<UploadResult | null>(null)
  const [isPending, setIsPending] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const handleProcess = useCallback(async () => {
    if (!csvFile) return
    setIsPending(true)
    try {
      const csv = await readFileAsText(csvFile)
      const data = await sdk.client.fetch<UploadResult>(
        "/admin/products/upload-image-list",
        { method: "POST", body: { csv } }
      )
      setResult(data)
      const msg = data.summary.productsUpdated > 0
        ? `Processed ${data.summary.imagesUploaded} images, updated ${data.summary.productsUpdated} existing products`
        : `Processed ${data.summary.imagesUploaded} images — download the CSV to import`
      toast.success(msg)
    } catch (err) {
      const error = err as Error
      toast.error(error.message || "Failed to process images")
    } finally {
      setIsPending(false)
    }
  }, [csvFile, readFileAsText])

  const handleClose = () => {
    setOpen(false)
    setCsvFile(null)
    setResult(null)
  }

  const hasErrors = result?.errors &&
    ((result.errors.downloads?.length ?? 0) > 0 ||
      (result.errors.updates?.length ?? 0) > 0)

  return (
    <Container className="flex items-center justify-between px-6 py-4">
      <div className="flex items-center gap-x-3">
        <PhotoSolid className="text-ui-fg-subtle" />
        <div>
          <Text size="small" leading="compact" weight="plus">
            Bulk Image Upload
          </Text>
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            Process a product CSV — replaces Google Drive links with hosted images
          </Text>
        </div>
      </div>

      <Button variant="secondary" size="small" onClick={() => setOpen(true)}>
        Upload Image List
      </Button>

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
                    Upload your product CSV containing Google Drive image links.
                    All Drive URLs will be downloaded, uploaded to your storage,
                    and replaced in the CSV. Products that already have a Product
                    Id will be updated automatically.
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
                    Columns with Google Drive URLs will be detected automatically
                    (Look IMG, Product Thumbnail, Product Image N Url)
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

                {isPending && (
                  <div className="rounded-lg border border-ui-border-base bg-ui-bg-subtle p-4">
                    <Text
                      size="small"
                      leading="compact"
                      className="text-ui-fg-subtle"
                    >
                      Downloading images from Google Drive and uploading to
                      storage... This may take a few minutes depending on the
                      number of images.
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
                  Download the processed CSV below. Google Drive URLs have been
                  replaced with hosted image URLs. You can use this CSV for
                  product import.
                </Text>

                <div className="grid grid-cols-3 gap-3">
                  <StatCard
                    label="Drive Links Found"
                    value={result.summary.driveLinksFound}
                  />
                  <StatCard
                    label="Images Uploaded"
                    value={result.summary.imagesUploaded}
                  />
                  <StatCard
                    label="URLs Replaced"
                    value={result.summary.urlsReplaced}
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
                    {result.errors!.downloads?.map((e, i) => (
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
