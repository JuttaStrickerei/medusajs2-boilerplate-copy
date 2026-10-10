import {
  Button,
  FocusModal,
  Heading,
  Input,
  Label,
  Select,
  Text,
  Textarea,
  toast,
  usePrompt,
} from "@medusajs/ui"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Controller, useForm } from "react-hook-form"
import { useEffect } from "react"
import { sdk } from "../../../lib/sdk"
import { ImagesField } from "./images-field"
import { ProductPicker } from "./product-picker"
import { itemColorsFrom, itemColorsOf, toLookProduct } from "./colors"
import type { AdminLook, LookFormValues } from "./types"

type LookFormModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  // null = neuen Look anlegen
  look: AdminLook | null
}

const toFormValues = (look: AdminLook | null): LookFormValues => {
  const itemColors = itemColorsOf(look?.metadata)
  return {
    title: look?.title ?? "",
    handle: look?.handle ?? "",
    description: look?.description ?? "",
    status: look?.status ?? "draft",
    rank: look?.rank ?? 0,
    images: look?.images ?? [],
    products: (look?.items ?? [])
      .map((item) => item.product)
      .filter((p): p is NonNullable<typeof p> => !!p)
      .map((p) => toLookProduct(p, p.handle ? itemColors[p.handle] : undefined)),
  }
}

// Farben je Teil: als Ganzes ersetzen; "" löscht den Schlüssel (mergeMetadata)
const itemColorsMetadata = (values: LookFormValues, isEdit: boolean) => {
  const itemColors = itemColorsFrom(values.products)
  if (Object.keys(itemColors).length) return { metadata: { item_colors: itemColors } }
  return isEdit ? { metadata: { item_colors: "" } } : {}
}

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Unbekannter Fehler"

export const LookFormModal = ({
  open,
  onOpenChange,
  look,
}: LookFormModalProps) => {
  const queryClient = useQueryClient()
  const prompt = usePrompt()
  const isEdit = !!look

  const form = useForm<LookFormValues>({
    defaultValues: toFormValues(look),
  })

  useEffect(() => {
    if (open) form.reset(toFormValues(look))
  }, [open, look, form])

  const save = useMutation({
    mutationFn: (values: LookFormValues) =>
      sdk.client.fetch<{ look: AdminLook }>(
        isEdit ? `/admin/looks/${look!.id}` : "/admin/looks",
        {
          method: "POST",
          body: {
            title: values.title.trim(),
            handle: values.handle.trim() || undefined,
            description: values.description.trim() || null,
            status: values.status,
            rank: Number(values.rank) || 0,
            images: values.images,
            product_ids: values.products.map((p) => p.id),
            ...itemColorsMetadata(values, isEdit),
          },
        }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["looks"] })
      toast.success(isEdit ? "Look gespeichert" : "Look erstellt")
      onOpenChange(false)
    },
    onError: (error) => toast.error(`Fehler: ${errorMessage(error)}`),
  })

  const remove = useMutation({
    mutationFn: () =>
      sdk.client.fetch(`/admin/looks/${look!.id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["looks"] })
      toast.success("Look gelöscht")
      onOpenChange(false)
    },
    onError: (error) => toast.error(`Fehler: ${errorMessage(error)}`),
  })

  const handleDelete = async () => {
    const confirmed = await prompt({
      title: "Look löschen?",
      description: `"${look?.title}" wird gelöscht. Die Produkte selbst bleiben erhalten.`,
      confirmText: "Löschen",
      cancelText: "Abbrechen",
    })
    if (confirmed) remove.mutate()
  }

  const onSubmit = form.handleSubmit((values) => save.mutate(values))

  return (
    <FocusModal open={open} onOpenChange={onOpenChange}>
      <FocusModal.Content>
        <form onSubmit={onSubmit} className="flex h-full flex-col">
          <FocusModal.Header>
            <div className="flex w-full items-center justify-end gap-2">
              {isEdit && (
                <Button
                  type="button"
                  variant="danger"
                  size="small"
                  isLoading={remove.isPending}
                  onClick={handleDelete}
                >
                  Löschen
                </Button>
              )}
              <Button type="submit" size="small" isLoading={save.isPending}>
                Speichern
              </Button>
            </div>
          </FocusModal.Header>
          <FocusModal.Body className="flex flex-1 flex-col items-center overflow-y-auto py-10">
            <div className="flex w-full max-w-2xl flex-col gap-8 px-4">
              <Heading>{isEdit ? "Look bearbeiten" : "Look erstellen"}</Heading>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="look-title">Titel</Label>
                  <Input
                    id="look-title"
                    {...form.register("title", { required: true })}
                    aria-invalid={!!form.formState.errors.title}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="look-handle">Handle (URL)</Label>
                  <Input
                    id="look-handle"
                    placeholder="wird aus dem Titel erzeugt"
                    {...form.register("handle", {
                      pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
                    })}
                    aria-invalid={!!form.formState.errors.handle}
                  />
                  {form.formState.errors.handle && (
                    <Text size="xsmall" className="text-ui-fg-error">
                      Nur a-z, 0-9 und Bindestriche
                    </Text>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Status</Label>
                  <Controller
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <Select.Trigger>
                          <Select.Value />
                        </Select.Trigger>
                        <Select.Content>
                          <Select.Item value="draft">Entwurf</Select.Item>
                          <Select.Item value="published">
                            Veröffentlicht
                          </Select.Item>
                        </Select.Content>
                      </Select>
                    )}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="look-rank">Reihenfolge</Label>
                  <Input
                    id="look-rank"
                    type="number"
                    {...form.register("rank", { valueAsNumber: true })}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="look-description">Beschreibung</Label>
                <Textarea
                  id="look-description"
                  rows={4}
                  {...form.register("description")}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label>Bilder</Label>
                <Text size="small" className="text-ui-fg-subtle">
                  Das erste Bild wird als Hero-Bild verwendet.
                </Text>
                <Controller
                  control={form.control}
                  name="images"
                  render={({ field }) => (
                    <ImagesField value={field.value} onChange={field.onChange} />
                  )}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label>Teile des Looks</Label>
                <Controller
                  control={form.control}
                  name="products"
                  render={({ field }) => (
                    <ProductPicker
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
              </div>
            </div>
          </FocusModal.Body>
        </form>
      </FocusModal.Content>
    </FocusModal>
  )
}
