"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useTransition, useState } from "react"
import { cn } from "@lib/utils"
import { ChevronDown, X } from "@components/icons"

import { SortOptions } from "./sort-products"

export interface ProductFilters {
  colors?: string[]
  sizes?: string[]
  materials?: string[]
  priceRange?: string
}

type RefinementListProps = {
  sortBy: SortOptions
  filters?: ProductFilters
  search?: boolean
  'data-testid'?: string
}

// Color filter options
const colorOptions = [
  { value: "schwarz", label: "Schwarz", hex: "#1a1a1a" },
  { value: "weiß", label: "Weiß", hex: "#ffffff" },
  { value: "grau", label: "Grau", hex: "#6b7280" },
  { value: "beige", label: "Beige", hex: "#d4c4a8" },
  { value: "braun", label: "Braun", hex: "#8b6f47" },
  { value: "blau", label: "Blau", hex: "#2563eb" },
  { value: "navy", label: "Navy", hex: "#1e3a5f" },
  { value: "rot", label: "Rot", hex: "#dc2626" },
  { value: "grün", label: "Grün", hex: "#16a34a" },
]

// Size filter options  
const sizeOptions = [
  { value: "xs", label: "XS" },
  { value: "s", label: "S" },
  { value: "m", label: "M" },
  { value: "l", label: "L" },
  { value: "xl", label: "XL" },
  { value: "xxl", label: "XXL" },
]

// Material filter options
const materialOptions = [
  { value: "kaschmir", label: "Kaschmir" },
  { value: "merino", label: "Merinowolle" },
  { value: "alpaka", label: "Alpaka" },
  { value: "baumwolle", label: "Baumwolle" },
  { value: "seide", label: "Seide" },
]

// Price range options
const priceRangeOptions = [
  { value: "0-100", label: "Bis €100" },
  { value: "100-200", label: "€100 - €200" },
  { value: "200-300", label: "€200 - €300" },
  { value: "300+", label: "Über €300" },
]

interface FilterSectionProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
  count?: number
}

function FilterSection({ title, children, defaultOpen = true, count }: FilterSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="border-b border-stone-200 pb-3 last:border-b-0 last:pb-0">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full py-2 text-left"
      >
        <span className="text-sm font-medium text-stone-800 flex items-center gap-2">
          {title}
          {count !== undefined && count > 0 && (
            <span className="w-5 h-5 flex items-center justify-center text-[10px] font-bold bg-stone-800 text-white rounded-full">
              {count}
            </span>
          )}
        </span>
        <ChevronDown
          size={16}
          className={cn(
            "text-stone-500 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>
      <div
        className={cn(
          "overflow-hidden transition-all duration-200",
          isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="pt-2 pb-1">{children}</div>
      </div>
    </div>
  )
}

const RefinementList = ({ sortBy, filters, 'data-testid': dataTestId }: RefinementListProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  // Get current filter values from props (which come from URL)
  const selectedColors = filters?.colors || []
  const selectedSizes = filters?.sizes || []
  const selectedMaterials = filters?.materials || []
  const selectedPriceRange = filters?.priceRange || ""

  // Update URL with new filter value
  const updateFilters = useCallback(
    (filterName: string, values: string[]) => {
      const params = new URLSearchParams(searchParams.toString())
      
      if (values.length > 0) {
        params.set(filterName, values.join(","))
      } else {
        params.delete(filterName)
      }
      
      // Reset to page 1 when filters change
      params.delete("page")
      
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`, { scroll: false })
      })
    },
    [searchParams, pathname, router]
  )

  const setQueryParams = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set(name, value)
      // Reset to page 1 when sort changes
      params.delete("page")
      
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`, { scroll: false })
      })
    },
    [searchParams, pathname, router]
  )

  const toggleColor = (color: string) => {
    const newColors = selectedColors.includes(color)
      ? selectedColors.filter((c) => c !== color)
      : [...selectedColors, color]
    updateFilters("colors", newColors)
  }

  const toggleSize = (size: string) => {
    const newSizes = selectedSizes.includes(size)
      ? selectedSizes.filter((s) => s !== size)
      : [...selectedSizes, size]
    updateFilters("sizes", newSizes)
  }

  const toggleMaterial = (material: string) => {
    const newMaterials = selectedMaterials.includes(material)
      ? selectedMaterials.filter((m) => m !== material)
      : [...selectedMaterials, material]
    updateFilters("materials", newMaterials)
  }

  const setPriceRange = (range: string) => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (range === selectedPriceRange) {
      params.delete("priceRange")
    } else {
      params.set("priceRange", range)
    }
    
    params.delete("page")
    
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    })
  }

  const clearAllFilters = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("colors")
    params.delete("sizes")
    params.delete("materials")
    params.delete("priceRange")
    params.delete("page")
    
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    })
  }

  const hasActiveFilters = 
    selectedColors.length > 0 || 
    selectedSizes.length > 0 || 
    selectedMaterials.length > 0 || 
    selectedPriceRange !== ""

  const activeFilterCount = 
    selectedColors.length + 
    selectedSizes.length + 
    selectedMaterials.length + 
    (selectedPriceRange ? 1 : 0)

  return (
    <div className={cn("space-y-1", isPending && "opacity-60 pointer-events-none")} data-testid={dataTestId}>
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-2 border-b border-stone-200">
        <h2 className="text-sm font-semibold text-stone-800 uppercase tracking-wide">
          Filter
          {activeFilterCount > 0 && (
            <span className="ml-2 text-stone-500 font-normal normal-case">
              ({activeFilterCount})
            </span>
          )}
        </h2>
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-xs text-red-600 hover:text-red-700 font-medium transition-colors"
          >
            Löschen
          </button>
        )}
      </div>

      {/* Active Filter Tags */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-1.5 pb-3 mb-1">
          {selectedColors.map((color) => (
            <button
              key={color}
              onClick={() => toggleColor(color)}
              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] bg-stone-800 text-white rounded-md hover:bg-stone-700 transition-colors"
            >
              {colorOptions.find((c) => c.value === color)?.label || color}
              <X size={10} />
            </button>
          ))}
          {selectedSizes.map((size) => (
            <button
              key={size}
              onClick={() => toggleSize(size)}
              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] bg-stone-800 text-white rounded-md hover:bg-stone-700 transition-colors"
            >
              {size.toUpperCase()}
              <X size={10} />
            </button>
          ))}
          {selectedMaterials.map((material) => (
            <button
              key={material}
              onClick={() => toggleMaterial(material)}
              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] bg-stone-800 text-white rounded-md hover:bg-stone-700 transition-colors"
            >
              {materialOptions.find((m) => m.value === material)?.label || material}
              <X size={10} />
            </button>
          ))}
          {selectedPriceRange && (
            <button
              onClick={() => setPriceRange(selectedPriceRange)}
              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] bg-stone-800 text-white rounded-md hover:bg-stone-700 transition-colors"
            >
              {priceRangeOptions.find((r) => r.value === selectedPriceRange)?.label || selectedPriceRange}
              <X size={10} />
            </button>
          )}
        </div>
      )}

      {/* Color Filter */}
      <FilterSection title="Farbe" count={selectedColors.length}>
        <div className="flex flex-wrap gap-2">
          {colorOptions.map((color) => (
            <button
              key={color.value}
              onClick={() => toggleColor(color.value)}
              className={cn(
                "w-6 h-6 rounded-full border-2 transition-all",
                selectedColors.includes(color.value)
                  ? "border-stone-800 ring-2 ring-stone-300 ring-offset-1"
                  : "border-stone-200 hover:border-stone-400",
                color.value === "weiß" && "shadow-sm"
              )}
              style={{ backgroundColor: color.hex }}
              title={color.label}
              aria-label={`Filter: ${color.label}`}
            />
          ))}
        </div>
      </FilterSection>

      {/* Size Filter */}
      <FilterSection title="Größe" count={selectedSizes.length}>
        <div className="flex flex-wrap gap-1.5">
          {sizeOptions.map((size) => (
            <button
              key={size.value}
              onClick={() => toggleSize(size.value)}
              className={cn(
                "px-2.5 py-1 text-xs font-medium rounded border transition-colors",
                selectedSizes.includes(size.value)
                  ? "bg-stone-800 text-white border-stone-800"
                  : "bg-white text-stone-600 border-stone-300 hover:border-stone-500"
              )}
            >
              {size.label}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Material Filter */}
      <FilterSection title="Material" count={selectedMaterials.length}>
        <div className="space-y-2">
          {materialOptions.map((material) => (
            <label
              key={material.value}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <input
                type="checkbox"
                checked={selectedMaterials.includes(material.value)}
                onChange={() => toggleMaterial(material.value)}
                className="w-4 h-4 rounded border-stone-300 text-stone-800 focus:ring-stone-500 focus:ring-offset-0"
              />
              <span className="text-sm text-stone-600 group-hover:text-stone-800 transition-colors">
                {material.label}
              </span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Price Range Filter */}
      <FilterSection title="Preis" count={selectedPriceRange ? 1 : 0}>
        <div className="space-y-2">
          {priceRangeOptions.map((range) => (
            <label
              key={range.value}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <input
                type="radio"
                name="priceRange"
                value={range.value}
                checked={selectedPriceRange === range.value}
                onChange={() => setPriceRange(range.value)}
                className="w-4 h-4 border-stone-300 text-stone-800 focus:ring-stone-500 focus:ring-offset-0"
              />
              <span className="text-sm text-stone-600 group-hover:text-stone-800 transition-colors">
                {range.label}
              </span>
            </label>
          ))}
        </div>
      </FilterSection>
    </div>
  )
}

export default RefinementList
