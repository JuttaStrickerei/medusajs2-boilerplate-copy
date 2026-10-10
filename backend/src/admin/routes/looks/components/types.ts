export type LookStatus = "draft" | "published"

export type LookProduct = {
  id: string
  title: string
  handle?: string
  thumbnail?: string | null
  status?: string
  // Farbwerte des Produkts (Option "Farbe") und die Farbe, in der das Teil
  // im Look getragen wird (landet in metadata.item_colors)
  colors?: string[]
  color?: string
}

// Produkt, wie es aus der Admin-API kommt (mit Optionen)
export type ApiLookProduct = Omit<LookProduct, "colors" | "color"> & {
  options?: { title?: string | null; values?: { value: string }[] | null }[] | null
}

export type AdminLook = {
  id: string
  title: string
  handle: string
  description: string | null
  images: string[] | null
  status: LookStatus
  rank: number
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
  items: { id: string; rank: number; product: ApiLookProduct | null }[]
}

export type AdminLookListResponse = {
  looks: AdminLook[]
  count: number
  offset: number
  limit: number
}

export type LookFormValues = {
  title: string
  handle: string
  description: string
  status: LookStatus
  rank: number
  images: string[]
  products: LookProduct[]
}
