import { MedusaContainer } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"

export const ADMIN_LOOK_FIELDS = [
  "id",
  "title",
  "handle",
  "description",
  "images",
  "status",
  "rank",
  "metadata",
  "created_at",
  "updated_at",
  "items.id",
  "items.rank",
  "items.product.id",
  "items.product.title",
  "items.product.handle",
  "items.product.thumbnail",
  "items.product.status",
]

type LookItemRow = { rank?: number | null } & Record<string, unknown>

// query.graph sortiert verschachtelte Relationen nicht – Teile nach rank ordnen
export const sortLookItems = <T extends { items?: (LookItemRow | null)[] }>(
  look: T
): T => ({
  ...look,
  items: (look.items ?? [])
    .filter((item): item is LookItemRow => !!item)
    .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0)),
})

export const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

export const assertHandleIsFree = async (
  container: MedusaContainer,
  handle: string,
  excludeId?: string
) => {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data } = await query.graph({
    entity: "look",
    fields: ["id"],
    filters: { handle },
  })

  if (data.some((look) => look.id !== excludeId)) {
    throw new MedusaError(
      MedusaError.Types.DUPLICATE_ERROR,
      `Ein Look mit dem Handle "${handle}" existiert bereits`
    )
  }
}

export const retrieveAdminLook = async (
  container: MedusaContainer,
  id: string
) => {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data } = await query.graph({
    entity: "look",
    fields: ADMIN_LOOK_FIELDS,
    filters: { id },
  })

  if (!data[0]) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Look with id: ${id} was not found`
    )
  }

  return sortLookItems(data[0])
}
