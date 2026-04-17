"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useState, useCallback, useRef, useEffect, useTransition } from "react"

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

const DEBOUNCE_MS = 250

function filtersFromProps(props?: Partial<FilterState>): FilterState {
  return {
    colors: props?.colors || [],
    sizes: props?.sizes || [],
    materials: props?.materials || [],
    priceRange: props?.priceRange || "",
    category: props?.category || "",
    collection: props?.collection || "",
  }
}

function serializeFilters(f: FilterState): string {
  return [
    f.colors.join(","),
    f.sizes.join(","),
    f.materials.join(","),
    f.priceRange,
    f.category,
    f.collection,
  ].join("|")
}

export function useProductFilters(
  initialFilters?: Partial<FilterState>
): UseProductFiltersReturn {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [filters, setFilters] = useState<FilterState>(() => filtersFromProps(initialFilters))

  const debounceRef = useRef<ReturnType<typeof setTimeout>>()
  const isPushingRef = useRef(false)
  const searchParamsRef = useRef(searchParams)

  useEffect(() => {
    searchParamsRef.current = searchParams
  }, [searchParams])

  // Sync FROM URL when it changes externally (back/forward, other component cleared filters)
  const prevPropsKeyRef = useRef(serializeFilters(filtersFromProps(initialFilters)))
  useEffect(() => {
    const newKey = serializeFilters(filtersFromProps(initialFilters))
    if (newKey !== prevPropsKeyRef.current) {
      prevPropsKeyRef.current = newKey
      if (!isPushingRef.current) {
        setFilters(filtersFromProps(initialFilters))
      }
      isPushingRef.current = false
    }
  }, [initialFilters?.colors?.join(","), initialFilters?.sizes?.join(","), initialFilters?.materials?.join(","), initialFilters?.priceRange, initialFilters?.category, initialFilters?.collection])

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const pushToUrl = useCallback((newFilters: FilterState) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams()

      // Preserve non-filter params (sortBy, etc.)
      const current = searchParamsRef.current
      const sortBy = current.get("sortBy")
      if (sortBy) params.set("sortBy", sortBy)

      if (newFilters.colors.length > 0) params.set("colors", newFilters.colors.join(","))
      if (newFilters.sizes.length > 0) params.set("sizes", newFilters.sizes.join(","))
      if (newFilters.materials.length > 0) params.set("materials", newFilters.materials.join(","))
      if (newFilters.priceRange) params.set("priceRange", newFilters.priceRange)
      if (newFilters.category) params.set("category", newFilters.category)
      if (newFilters.collection) params.set("collection", newFilters.collection)

      isPushingRef.current = true
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`, { scroll: false })
      })
    }, DEBOUNCE_MS)
  }, [pathname, router])

  const update = useCallback((updater: (prev: FilterState) => FilterState) => {
    setFilters((prev) => {
      const next = updater(prev)
      pushToUrl(next)
      return next
    })
  }, [pushToUrl])

  const toggleColor = useCallback((color: string) => {
    update((prev) => ({
      ...prev,
      colors: prev.colors.includes(color)
        ? prev.colors.filter((c) => c !== color)
        : [...prev.colors, color],
    }))
  }, [update])

  const toggleSize = useCallback((size: string) => {
    update((prev) => ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter((s) => s !== size)
        : [...prev.sizes, size],
    }))
  }, [update])

  const toggleMaterial = useCallback((material: string) => {
    update((prev) => ({
      ...prev,
      materials: prev.materials.includes(material)
        ? prev.materials.filter((m) => m !== material)
        : [...prev.materials, material],
    }))
  }, [update])

  const setPriceRange = useCallback((range: string) => {
    update((prev) => ({
      ...prev,
      priceRange: prev.priceRange === range ? "" : range,
    }))
  }, [update])

  const setCategory = useCallback((categoryId: string) => {
    update((prev) => ({
      ...prev,
      category: prev.category === categoryId ? "" : categoryId,
    }))
  }, [update])

  const setCollection = useCallback((collectionId: string) => {
    update((prev) => ({
      ...prev,
      collection: prev.collection === collectionId ? "" : collectionId,
    }))
  }, [update])

  const clearAllFilters = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    const cleared: FilterState = {
      colors: [], sizes: [], materials: [],
      priceRange: "", category: "", collection: "",
    }
    setFilters(cleared)

    const params = new URLSearchParams()
    const sortBy = searchParamsRef.current.get("sortBy")
    if (sortBy) params.set("sortBy", sortBy)

    isPushingRef.current = true
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    })
  }, [pathname, router])

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
