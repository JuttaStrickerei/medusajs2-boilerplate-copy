"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useMemo, useTransition } from "react"

export interface FilterState {
  colors: string[]
  sizes: string[]
  materials: string[]
  priceRange: string
  category: string
  collection: string
}

export interface UseProductFiltersReturn {
  filters: FilterState
  activeFilterCount: number
  hasActiveFilters: boolean
  isPending: boolean
  toggleColor: (color: string) => void
  toggleSize: (size: string) => void
  toggleMaterial: (material: string) => void
  setPriceRange: (range: string) => void
  setCategory: (categoryId: string) => void
  setCollection: (collectionId: string) => void
  clearAllFilters: () => void
}

function parseCsv(value: string | null): string[] {
  if (!value) return []
  return value.split(",").filter(Boolean)
}

// URL is the single source of truth. Both filter UIs (sidebar + drawer) read
// the same URL, so chips and products can never disagree.
export function useProductFilters(
  _initialFilters?: Partial<FilterState>
): UseProductFiltersReturn {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const filters = useMemo<FilterState>(
    () => ({
      colors: parseCsv(searchParams.get("colors")),
      sizes: parseCsv(searchParams.get("sizes")),
      materials: parseCsv(searchParams.get("materials")),
      priceRange: searchParams.get("priceRange") ?? "",
      category: searchParams.get("category") ?? "",
      collection: searchParams.get("collection") ?? "",
    }),
    [searchParams]
  )

  const pushFilters = useCallback(
    (next: FilterState) => {
      const params = new URLSearchParams()
      const sortBy = searchParams.get("sortBy")
      if (sortBy) params.set("sortBy", sortBy)

      if (next.colors.length > 0) params.set("colors", next.colors.join(","))
      if (next.sizes.length > 0) params.set("sizes", next.sizes.join(","))
      if (next.materials.length > 0)
        params.set("materials", next.materials.join(","))
      if (next.priceRange) params.set("priceRange", next.priceRange)
      if (next.category) params.set("category", next.category)
      if (next.collection) params.set("collection", next.collection)

      const query = params.toString()
      const href = query ? `${pathname}?${query}` : pathname

      startTransition(() => {
        // replace() avoids polluting browser history with every filter click.
        router.replace(href, { scroll: false })
      })
    },
    [pathname, router, searchParams]
  )

  const toggleColor = useCallback(
    (color: string) => {
      pushFilters({
        ...filters,
        colors: filters.colors.includes(color)
          ? filters.colors.filter((c) => c !== color)
          : [...filters.colors, color],
      })
    },
    [filters, pushFilters]
  )

  const toggleSize = useCallback(
    (size: string) => {
      pushFilters({
        ...filters,
        sizes: filters.sizes.includes(size)
          ? filters.sizes.filter((s) => s !== size)
          : [...filters.sizes, size],
      })
    },
    [filters, pushFilters]
  )

  const toggleMaterial = useCallback(
    (material: string) => {
      pushFilters({
        ...filters,
        materials: filters.materials.includes(material)
          ? filters.materials.filter((m) => m !== material)
          : [...filters.materials, material],
      })
    },
    [filters, pushFilters]
  )

  const setPriceRange = useCallback(
    (range: string) => {
      pushFilters({
        ...filters,
        priceRange: filters.priceRange === range ? "" : range,
      })
    },
    [filters, pushFilters]
  )

  const setCategory = useCallback(
    (categoryId: string) => {
      pushFilters({
        ...filters,
        category: filters.category === categoryId ? "" : categoryId,
      })
    },
    [filters, pushFilters]
  )

  const setCollection = useCallback(
    (collectionId: string) => {
      pushFilters({
        ...filters,
        collection: filters.collection === collectionId ? "" : collectionId,
      })
    },
    [filters, pushFilters]
  )

  const clearAllFilters = useCallback(() => {
    pushFilters({
      colors: [],
      sizes: [],
      materials: [],
      priceRange: "",
      category: "",
      collection: "",
    })
  }, [pushFilters])

  const activeFilterCount =
    filters.colors.length +
    filters.sizes.length +
    filters.materials.length +
    (filters.priceRange ? 1 : 0) +
    (filters.category ? 1 : 0) +
    (filters.collection ? 1 : 0)

  return {
    filters,
    activeFilterCount,
    hasActiveFilters: activeFilterCount > 0,
    isPending,
    toggleColor,
    toggleSize,
    toggleMaterial,
    setPriceRange,
    setCategory,
    setCollection,
    clearAllFilters,
  }
}
