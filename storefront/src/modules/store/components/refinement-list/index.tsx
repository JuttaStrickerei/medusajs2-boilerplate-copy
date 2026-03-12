"use client"

import { useState } from "react"
import { cn } from "@lib/utils"
import { ChevronDown, X } from "@components/icons"
import { DynamicFilterOptions } from "@lib/data/filter-options"
import { useProductFilters, FilterState } from "@lib/hooks/use-product-filters"

import { SortOptions } from "./sort-products"

export type ProductFilters = Partial<FilterState>

type RefinementListProps = {
  sortBy: SortOptions
  filters?: ProductFilters
  filterOptions: DynamicFilterOptions
  hideCategories?: boolean
  hideCollections?: boolean
  search?: boolean
  'data-testid'?: string
}

interface FilterSectionProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
  count?: number
  scrollable?: boolean
}

function FilterSection({ title, children, defaultOpen = true, count, scrollable }: FilterSectionProps) {
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
          isOpen ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className={cn(
          "pt-2 pb-1",
          scrollable && "max-h-52 overflow-y-auto pr-1"
        )}>
          {children}
        </div>
      </div>
    </div>
  )
}

const RefinementList = ({ filters: filtersProp, filterOptions, hideCategories, hideCollections, 'data-testid': dataTestId }: RefinementListProps) => {
  const {
    filters,
    activeFilterCount,
    hasActiveFilters,
    toggleColor,
    toggleSize,
    toggleMaterial,
    setPriceRange,
    setCategory,
    setCollection,
    clearAllFilters,
  } = useProductFilters(filtersProp)

  const getCategoryLabel = (id: string) =>
    filterOptions.categories.find((c) => c.id === id)?.name || id

  const getCollectionLabel = (id: string) =>
    filterOptions.collections.find((c) => c.id === id)?.title || id

  return (
    <div className="space-y-1" data-testid={dataTestId}>
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
          {filters.category && (
            <button
              onClick={() => setCategory(filters.category)}
              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] bg-stone-800 text-white rounded-md hover:bg-stone-700 transition-colors"
            >
              {getCategoryLabel(filters.category)}
              <X size={10} />
            </button>
          )}
          {filters.collection && (
            <button
              onClick={() => setCollection(filters.collection)}
              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] bg-stone-800 text-white rounded-md hover:bg-stone-700 transition-colors"
            >
              {getCollectionLabel(filters.collection)}
              <X size={10} />
            </button>
          )}
          {filters.colors.map((color) => (
            <button
              key={color}
              onClick={() => toggleColor(color)}
              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] bg-stone-800 text-white rounded-md hover:bg-stone-700 transition-colors"
            >
              {filterOptions.colors.find((c) => c.value === color)?.label || color}
              <X size={10} />
            </button>
          ))}
          {filters.sizes.map((size) => (
            <button
              key={size}
              onClick={() => toggleSize(size)}
              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] bg-stone-800 text-white rounded-md hover:bg-stone-700 transition-colors"
            >
              {filterOptions.sizes.find((s) => s.value === size)?.label || size.toUpperCase()}
              <X size={10} />
            </button>
          ))}
          {filters.materials.map((material) => (
            <button
              key={material}
              onClick={() => toggleMaterial(material)}
              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] bg-stone-800 text-white rounded-md hover:bg-stone-700 transition-colors"
            >
              {filterOptions.materials.find((m) => m.value === material)?.label || material}
              <X size={10} />
            </button>
          ))}
          {filters.priceRange && (
            <button
              onClick={() => setPriceRange(filters.priceRange)}
              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] bg-stone-800 text-white rounded-md hover:bg-stone-700 transition-colors"
            >
              {filterOptions.priceRanges.find((r) => r.value === filters.priceRange)?.label || filters.priceRange}
              <X size={10} />
            </button>
          )}
        </div>
      )}

      {/* Category Filter */}
      {!hideCategories && filterOptions.categories.length > 0 && (
        <FilterSection title="Kategorie" count={filters.category ? 1 : 0} scrollable>
          <div className="space-y-1.5">
            {filterOptions.categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={cn(
                  "block w-full text-left px-2 py-1.5 text-sm rounded transition-colors",
                  filters.category === cat.id
                    ? "bg-stone-800 text-white"
                    : "text-stone-600 hover:bg-stone-100 hover:text-stone-800"
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </FilterSection>
      )}

      {/* Collection Filter */}
      {!hideCollections && filterOptions.collections.length > 0 && (
        <FilterSection title="Kollektion" count={filters.collection ? 1 : 0} scrollable>
          <div className="space-y-1.5">
            {filterOptions.collections.map((col) => (
              <button
                key={col.id}
                onClick={() => setCollection(col.id)}
                className={cn(
                  "block w-full text-left px-2 py-1.5 text-sm rounded transition-colors",
                  filters.collection === col.id
                    ? "bg-stone-800 text-white"
                    : "text-stone-600 hover:bg-stone-100 hover:text-stone-800"
                )}
              >
                {col.title}
              </button>
            ))}
          </div>
        </FilterSection>
      )}

      {/* Color Filter */}
      {filterOptions.colors.length > 0 && (
        <FilterSection title="Farbe" count={filters.colors.length}>
          <div className="flex flex-wrap gap-2">
            {filterOptions.colors.map((color) => (
              <button
                key={color.value}
                onClick={() => toggleColor(color.value)}
                className={cn(
                  "w-6 h-6 rounded-full border-2 transition-all",
                  filters.colors.includes(color.value)
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
      )}

      {/* Size Filter */}
      {filterOptions.sizes.length > 0 && (
        <FilterSection title="Größe" count={filters.sizes.length}>
          <div className="flex flex-wrap gap-1.5">
            {filterOptions.sizes.map((size) => (
              <button
                key={size.value}
                onClick={() => toggleSize(size.value)}
                className={cn(
                  "px-2.5 py-1 text-xs font-medium rounded border transition-colors",
                  filters.sizes.includes(size.value)
                    ? "bg-stone-800 text-white border-stone-800"
                    : "bg-white text-stone-600 border-stone-300 hover:border-stone-500"
                )}
              >
                {size.label}
              </button>
            ))}
          </div>
        </FilterSection>
      )}

      {/* Material Filter */}
      {filterOptions.materials.length > 0 && (
        <FilterSection title="Material" count={filters.materials.length} scrollable>
          <div className="space-y-2">
            {filterOptions.materials.map((material) => (
              <label
                key={material.value}
                className="flex items-center gap-2 cursor-pointer group"
              >
                <input
                  type="checkbox"
                  checked={filters.materials.includes(material.value)}
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
      )}

      {/* Price Range Filter */}
      {filterOptions.priceRanges.length > 0 && (
        <FilterSection title="Preis" count={filters.priceRange ? 1 : 0}>
          <div className="space-y-2">
            {filterOptions.priceRanges.map((range) => (
              <label
                key={range.value}
                className="flex items-center gap-2 cursor-pointer group"
              >
                <input
                  type="radio"
                  name="priceRange"
                  value={range.value}
                  checked={filters.priceRange === range.value}
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
      )}
    </div>
  )
}

export default RefinementList
