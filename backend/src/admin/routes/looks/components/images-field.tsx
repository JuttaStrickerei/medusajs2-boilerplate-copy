import { Button, IconButton, Text, toast } from "@medusajs/ui"
import { ArrowDownMini, ArrowUpMini, Trash } from "@medusajs/icons"
import { useRef, useState } from "react"
import { sdk } from "../../../lib/sdk"

type ImagesFieldProps = {
  value: string[]
  onChange: (images: string[]) => void
}

const MAX_SIZE = 10 * 1024 * 1024

const move = <T,>(list: T[], from: number, to: number) => {
  const next = [...list]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

// Bilder eines Looks – das erste Bild ist das Hero-Bild
export const ImagesField = ({ value, onChange }: ImagesFieldProps) => {
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFiles = async (fileList: FileList | null) => {
    const files = Array.from(fileList ?? [])
    if (!files.length) return

    const invalid = files.find(
      (f) => !f.type.startsWith("image/") || f.size > MAX_SIZE
    )
    if (invalid) {
      toast.error("Nur Bilddateien (JPG, PNG, WebP) bis max. 10 MB erlaubt")
      return
    }

    setIsUploading(true)
    try {
      const { files: uploaded } = await sdk.admin.upload.create({ files })
      onChange([...value, ...uploaded.map((f) => f.url)])
    } catch (error) {
      toast.error(
        `Fehler beim Hochladen: ${error instanceof Error ? error.message : "Unbekannter Fehler"}`
      )
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {value.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {value.map((url, index) => (
            <li
              key={url}
              className="overflow-hidden rounded-lg border border-ui-border-base bg-ui-bg-subtle"
            >
              <img
                src={url}
                alt=""
                className="aspect-[3/4] w-full object-cover"
              />
              <div className="flex items-center justify-between gap-1 p-2">
                <Text size="xsmall" className="text-ui-fg-subtle">
                  {index === 0 ? "Hero-Bild" : `Bild ${index + 1}`}
                </Text>
                <div className="flex gap-1">
                  <IconButton
                    size="2xsmall"
                    variant="transparent"
                    type="button"
                    disabled={index === 0}
                    onClick={() => onChange(move(value, index, index - 1))}
                  >
                    <ArrowUpMini />
                  </IconButton>
                  <IconButton
                    size="2xsmall"
                    variant="transparent"
                    type="button"
                    disabled={index === value.length - 1}
                    onClick={() => onChange(move(value, index, index + 1))}
                  >
                    <ArrowDownMini />
                  </IconButton>
                  <IconButton
                    size="2xsmall"
                    variant="transparent"
                    type="button"
                    onClick={() => onChange(value.filter((_, i) => i !== index))}
                  >
                    <Trash />
                  </IconButton>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div>
        <Button
          type="button"
          variant="secondary"
          size="small"
          isLoading={isUploading}
          onClick={() => fileInputRef.current?.click()}
        >
          Bilder hochladen
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
    </div>
  )
}
