"use client"

import { Fragment, useState } from "react"
import { Dialog, Transition } from "@headlessui/react"
import { X, Filter, ChevronDown } from "@components/icons"
import { cn } from "@lib/utils"
import { SortOptions } from "../refinement-list/sort-products"
import { DynamicFilterOptions } from "@lib/data/filter-options"
import { useProductFilters, FilterState } from "@lib/hooks/use-product-filters"

export type ProductFilters = Partial<FilterState>

interface MobileFilterDrawerProps {
  sortBy: SortOptions
  filters?: ProductFilters
  filterOptions: DynamicFilterOptions
  hideCategories?: boolean
  hideCollections?: boolean
}

function FilterSection({
  title,
  children,
  defaultOpen = false,
  count,
  scrollable,
}: {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
  count?: number
  scrollable?: boolean
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="border-b border-stone-200">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full py-4 text-left"
      >
        <span className="text-base font-medium text-stone-800 flex items-center gap-2">
          {title}
          {count !== undefined && count > 0 && (
            <span className="w-5 h-5 flex items-center justify-center text-[10px] font-bold bg-stone-800 text-white rounded-full">
              {count}
            </span>
          )}
        </span>
        <ChevronDown
          size={20}
          className={cn(
            "text-stone-500 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>
      <div
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          isOpen ? "max-h-[600px] pb-4" : "max-h-0"
        )}
      >
        <div className={cn(scrollable && "max-h-56 overflow-y-auto pr-1")}>
          {children}
        </div>
      </div>
    </div>
  )
}

export default function MobileFilterDrawer({ filters: filtersProp, filterOptions, hideCategories, hideCollections }: MobileFilterDrawerProps) {
  const [isOpen, setIsOpen] = useState(false)

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
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-stone-300 rounded-lg text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors relative"
      >
        <Filter size={18} />
        <span>Filter</span>
        {activeFilterCount > 0 && (
          <span className="absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center text-xs font-bold bg-stone-800 text-white rounded-full">
            {activeFilterCount}
          </span>
        )}
      </button>

      {/* Drawer */}
      <Transition show={isOpen} as={Fragment}>
        <Dialog onClose={() => setIsOpen(false)} className="relative z-50">
          {/* Backdrop */}
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
          </Transition.Child>

          {/* Drawer Panel */}
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="translate-x-full"
            enterTo="translate-x-0"
            leave="ease-in duration-200"
            leaveFrom="translate-x-0"
            leaveTo="translate-x-full"
          >
            <Dialog.Panel className="fixed inset-y-0 right-0 w-full max-w-sm bg-white shadow-xl flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200">
                <Dialog.Title className="text-lg font-medium text-stone-800">
                  Filter & Sortieren
                </Dialog.Title>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 -mr-2 text-stone-500 hover:text-stone-800 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-5">
                {/* Active Filters */}
                {hasActiveFilters && (
                  <div className="py-4 border-b border-stone-200">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-stone-800">
                        Aktive Filter ({activeFilterCount})
                      </span>
                      <button
                        onClick={clearAllFilters}
                        className="text-sm text-stone-500 hover:text-stone-800 underline"
                      >
                        Alle löschen
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {filters.category && (
                        <button
                          onClick={() => setCategory(filters.category)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-stone-800 text-white rounded-full"
                        >
                          {getCategoryLabel(filters.category)}
                          <X size={14} />
                        </button>
                      )}
                      {filters.collection && (
                        <button
                          onClick={() => setCollection(filters.collection)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-stone-800 text-white rounded-full"
                        >
                          {getCollectionLabel(filters.collection)}
                          <X size={14} />
                        </button>
                      )}
                      {filters.colors.map((color) => (
                        <button
                          key={color}
                          onClick={() => toggleColor(color)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-stone-800 text-white rounded-full"
                        >
                          {filterOptions.colors.find((c) => c.value === color)?.label || color}
                          <X size={14} />
                        </button>
                      ))}
                      {filters.sizes.map((size) => (
                        <button
                          key={size}
                          onClick={() => toggleSize(size)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-stone-800 text-white rounded-full"
                        >
                          {filterOptions.sizes.find((s) => s.value === size)?.label || size.toUpperCase()}
                          <X size={14} />
                        </button>
                      ))}
                      {filters.materials.map((material) => (
                        <button
                          key={material}
                          onClick={() => toggleMaterial(material)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-stone-800 text-white rounded-full"
                        >
                          {filterOptions.materials.find((m) => m.value === material)?.label || material}
                          <X size={14} />
                        </button>
                      ))}
                      {filters.priceRange && (
                        <button
                          onClick={() => setPriceRange(filters.priceRange)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-stone-800 text-white rounded-full"
                        >
                          {filterOptions.priceRanges.find((r) => r.value === filters.priceRange)?.label}
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Category Filter */}
                {!hideCategories && filterOptions.categories.length > 0 && (
                  <FilterSection title="Kategorie" count={filters.category ? 1 : 0} scrollable>
                    <div className="space-y-1">
                      {filterOptions.categories.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => setCategory(cat.id)}
                          className={cn(
                            "block w-full text-left px-3 py-2 text-sm rounded-lg transition-colors",
                            filters.category === cat.id
                              ? "bg-stone-800 text-white"
                              : "text-stone-700 hover:bg-stone-100"
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
                    <div className="space-y-1">
                      {filterOptions.collections.map((col) => (
                        <button
                          key={col.id}
                          onClick={() => setCollection(col.id)}
                          className={cn(
                            "block w-full text-left px-3 py-2 text-sm rounded-lg transition-colors",
                            filters.collection === col.id
                              ? "bg-stone-800 text-white"
                              : "text-stone-700 hover:bg-stone-100"
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
                    <div className="flex flex-wrap gap-3">
                      {filterOptions.colors.map((color) => (
                        <button
                          key={color.value}
                          onClick={() => toggleColor(color.value)}
                          className={cn(
                            "w-9 h-9 rounded-full border-2 transition-all",
                            filters.colors.includes(color.value)
                              ? "border-stone-800 ring-2 ring-stone-300 ring-offset-1"
                              : "border-stone-200",
                            color.value === "weiß" && "shadow-sm"
                          )}
                          style={{ backgroundColor: color.hex }}
                          aria-label={color.label}
                        />
                      ))}
                    </div>
                  </FilterSection>
                )}

                {/* Size Filter */}
                {filterOptions.sizes.length > 0 && (
                  <FilterSection title="Größe" count={filters.sizes.length}>
                    <div className="flex flex-wrap gap-2">
                      {filterOptions.sizes.map((size) => (
                        <button
                          key={size.value}
                          onClick={() => toggleSize(size.value)}
                          className={cn(
                            "px-4 py-2 text-sm font-medium rounded-lg border transition-colors",
                            filters.sizes.includes(size.value)
                              ? "bg-stone-800 text-white border-stone-800"
                              : "bg-white text-stone-700 border-stone-300"
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
                    <div className="space-y-3">
                      {filterOptions.materials.map((material) => (
                        <label
                          key={material.value}
                          className="flex items-center gap-3 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={filters.materials.includes(material.value)}
                            onChange={() => toggleMaterial(material.value)}
                            className="w-5 h-5 rounded border-stone-300 text-stone-800 focus:ring-stone-500"
                          />
                          <span className="text-base text-stone-700">
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
                    <div className="space-y-3">
                      {filterOptions.priceRanges.map((range) => (
                        <label
                          key={range.value}
                          className="flex items-center gap-3 cursor-pointer"
                        >
                          <input
                            type="radio"
                            name="priceRange"
                            value={range.value}
                            checked={filters.priceRange === range.value}
                            onChange={() => setPriceRange(range.value)}
                            className="w-5 h-5 border-stone-300 text-stone-800 focus:ring-stone-500"
                          />
                          <span className="text-base text-stone-700">
                            {range.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </FilterSection>
                )}
              </div>

              {/* Footer */}
              <div className="px-5 py-4 border-t border-stone-200 bg-white">
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-full py-3 bg-stone-800 text-white font-medium rounded-lg hover:bg-stone-700 transition-colors"
                >
                  Ergebnisse anzeigen
                </button>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </Dialog>
      </Transition>
    </>
  )
}
