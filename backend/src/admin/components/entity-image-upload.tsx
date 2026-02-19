import { Button, Container, Text, toast } from "@medusajs/ui"
import { sdk } from "../lib/sdk"
import { useCallback, useRef, useState } from "react"

type EntityType = "collection" | "category"

interface EntityImageUploadProps {
  entityId: string
  entityType: EntityType
  metadata: Record<string, unknown> | null | undefined
}

const API_PATHS: Record<EntityType, string> = {
  collection: "/admin/collections",
  category: "/admin/product-categories",
}

const LABELS: Record<EntityType, { title: string; description: string }> = {
  collection: {
    title: "Kollektionsbild",
    description: "Vorschaubild für die Kollektions-Übersichtsseite",
  },
  category: {
    title: "Kategoriebild",
    description: "Vorschaubild für die Kategorien-Übersichtsseite",
  },
}

const EntityImageUpload = ({
  entityId,
  entityType,
  metadata,
}: EntityImageUploadProps) => {
  const [isUploading, setIsUploading] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [currentImage, setCurrentImage] = useState<string | null>(
    (metadata?.image as string) || null
  )
  const fileInputRef = useRef<HTMLInputElement>(null)

  const labels = LABELS[entityType]
  const apiPath = API_PATHS[entityType]

  const updateMetadata = useCallback(
    async (imageUrl: string | "") => {
      await sdk.client.fetch(`${apiPath}/${entityId}`, {
        method: "POST",
        body: {
          metadata: {
            ...metadata,
            image: imageUrl,
          },
        },
      })
    },
    [apiPath, entityId, metadata]
  )

  const handleUpload = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        toast.error("Bitte nur Bilddateien hochladen (JPG, PNG, WebP)")
        return
      }

      if (file.size > 10 * 1024 * 1024) {
        toast.error("Die Datei ist zu groß (max. 10 MB)")
        return
      }

      setIsUploading(true)
      try {
        const { files } = await sdk.admin.upload.create({ files: [file] })
        const uploadedUrl = files[0].url

        await updateMetadata(uploadedUrl)
        setCurrentImage(uploadedUrl)
        toast.success("Bild erfolgreich hochgeladen")
      } catch (error) {
        toast.error(
          `Fehler beim Hochladen: ${error instanceof Error ? error.message : "Unbekannter Fehler"}`
        )
      } finally {
        setIsUploading(false)
      }
    },
    [updateMetadata]
  )

  const handleRemove = useCallback(async () => {
    setIsRemoving(true)
    try {
      await updateMetadata("")
      setCurrentImage(null)
      toast.success("Bild erfolgreich entfernt")
    } catch (error) {
      toast.error(
        `Fehler beim Entfernen: ${error instanceof Error ? error.message : "Unbekannter Fehler"}`
      )
    } finally {
      setIsRemoving(false)
    }
  }, [updateMetadata])

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (file) {
        handleUpload(file)
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    },
    [handleUpload]
  )

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      setIsDragOver(false)
      const file = event.dataTransfer.files?.[0]
      if (file) {
        handleUpload(file)
      }
    },
    [handleUpload]
  )

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    setIsDragOver(false)
  }, [])

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Text size="small" leading="compact" weight="plus">
            {labels.title}
          </Text>
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            {labels.description}
          </Text>
        </div>
      </div>

      <div className="px-6 py-4">
        {currentImage ? (
          <div className="flex flex-col gap-3">
            <div className="relative overflow-hidden rounded-lg border border-ui-border-base">
              <img
                src={currentImage}
                alt={labels.title}
                className="h-48 w-full object-cover"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="small"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                isLoading={isUploading}
              >
                Bild ersetzen
              </Button>
              <Button
                variant="danger"
                size="small"
                onClick={handleRemove}
                disabled={isRemoving}
                isLoading={isRemoving}
              >
                Bild entfernen
              </Button>
            </div>
          </div>
        ) : (
          <div
            className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors cursor-pointer ${
              isDragOver
                ? "border-ui-fg-interactive bg-ui-bg-interactive"
                : "border-ui-border-strong bg-ui-bg-subtle"
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => !isUploading && fileInputRef.current?.click()}
          >
            {isUploading ? (
              <Text size="small" className="text-ui-fg-subtle">
                Wird hochgeladen...
              </Text>
            ) : (
              <>
                <Text size="small" weight="plus" className="mb-1">
                  Bild hierher ziehen
                </Text>
                <Text size="small" className="text-ui-fg-subtle">
                  oder klicken zum Auswählen (JPG, PNG, WebP, max. 10 MB)
                </Text>
              </>
            )}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </Container>
  )
}

export default EntityImageUpload
