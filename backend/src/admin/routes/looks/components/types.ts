export type LookStatus = "draft" | "published"

export type LookProduct = {
  id: string
  title: string
  handle?: string
  thumbnail?: string | null
  status?: string
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
  items: { id: string; rank: number; product: LookProduct | null }[]
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
