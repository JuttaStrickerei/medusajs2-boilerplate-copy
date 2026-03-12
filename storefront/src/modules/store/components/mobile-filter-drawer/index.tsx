"use client"

import { Fragment, useState } from "react"
import { Dialog, Transition } from "@headlessui/react"
import { X, Filter, ChevronDown } from "@components/icons"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useTransition } from "react"
import { cn } from "@lib/utils"
import { SortOptions } from "../refinement-list/sort-products"
import { DynamicFilterOptions } from "@lib/data/filter-options"

export interface ProductFilters {
  colors?: string[]
  sizes?: string[]
  materials?: string[]
  priceRange?: string
  category?: string
  collection?: string
}

interface MobileFilterDrawerProps {
  sortBy: SortOptions
  filters?: ProductFilters
  filterOptions: DynamicFilterOptions
}

function FilterSection({ 
  title, 
  children, 
  defaultOpen = false,
  count,
}: { 
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
  count?: number
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
          isOpen ? "max-h-[500px] pb-4" : "max-h-0"
        )}
      >
        {children}
      </div>
    </div>
  )
}

export default function MobileFilterDrawer({ sortBy, filters, filterOptions }: MobileFilterDrawerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const selectedColors = filters?.colors || []
  const selectedSizes = filters?.sizes || []
  const selectedMaterials = filters?.materials || []
  const selectedPriceRange = filters?.priceRange || ""
  const selectedCategory = filters?.category || ""
  const selectedCollection = filters?.collection || ""

  const activeFilterCount = 
    selectedColors.length + 
    selectedSizes.length + 
    selectedMaterials.length + 
    (selectedPriceRange ? 1 : 0) +
    (selectedCategory ? 1 : 0) +
    (selectedCollection ? 1 : 0)

  const updateFilters = useCallback(
    (filterName: string, values: string[]) => {
      const params = new URLSearchParams(searchParams.toString())
      
      if (values.length > 0) {
        params.set(filterName, values.join(","))
      } else {
        params.delete(filterName)
      }
      
      params.delete("page")
      
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`, { scroll: false })
      })
    },
    [searchParams, pathname, router]
  )

  const setSingleFilter = useCallback(
    (name: string, value: string, currentValue: string) => {
      const params = new URLSearchParams(searchParams.toString())
      
      if (value === currentValue) {
        params.delete(name)
      } else {
        params.set(name, value)
      }
      
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
    setSingleFilter("priceRange", range, selectedPriceRange)
  }

  const setCategory = (categoryId: string) => {
    setSingleFilter("category", categoryId, selectedCategory)
  }

  const setCollection = (collectionId: string) => {
    setSingleFilter("collection", collectionId, selectedCollection)
  }

  const clearAllFilters = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("colors")
    params.delete("sizes")
    params.delete("materials")
    params.delete("priceRange")
    params.delete("category")
    params.delete("collection")
    params.delete("page")
    
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    })
  }

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
              <div className={cn(
                "flex-1 overflow-y-auto px-5",
                isPending && "opacity-60 pointer-events-none"
              )}>
                {/* Active Filters */}
                {activeFilterCount > 0 && (
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
                      {selectedCategory && (
                        <button
                          onClick={() => setCategory(selectedCategory)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-stone-800 text-white rounded-full"
                        >
                          {getCategoryLabel(selectedCategory)}
                          <X size={14} />
                        </button>
                      )}
                      {selectedCollection && (
                        <button
                          onClick={() => setCollection(selectedCollection)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-stone-800 text-white rounded-full"
                        >
                          {getCollectionLabel(selectedCollection)}
                          <X size={14} />
                        </button>
                      )}
                      {selectedColors.map((color) => (
                        <button
                          key={color}
                          onClick={() => toggleColor(color)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-stone-800 text-white rounded-full"
                        >
                          {filterOptions.colors.find((c) => c.value === color)?.label || color}
                          <X size={14} />
                        </button>
                      ))}
                      {selectedSizes.map((size) => (
                        <button
                          key={size}
                          onClick={() => toggleSize(size)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-stone-800 text-white rounded-full"
                        >
                          {filterOptions.sizes.find((s) => s.value === size)?.label || size.toUpperCase()}
                          <X size={14} />
                        </button>
                      ))}
                      {selectedMaterials.map((material) => (
                        <button
                          key={material}
                          onClick={() => toggleMaterial(material)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-stone-800 text-white rounded-full"
                        >
                          {filterOptions.materials.find((m) => m.value === material)?.label || material}
                          <X size={14} />
                        </button>
                      ))}
                      {selectedPriceRange && (
                        <button
                          onClick={() => setPriceRange(selectedPriceRange)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-stone-800 text-white rounded-full"
                        >
                          {filterOptions.priceRanges.find((r) => r.value === selectedPriceRange)?.label}
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Category Filter */}
                {filterOptions.categories.length > 0 && (
                  <FilterSection title="Kategorie" count={selectedCategory ? 1 : 0}>
                    <div className="space-y-1">
                      {filterOptions.categories.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => setCategory(cat.id)}
                          className={cn(
                            "block w-full text-left px-3 py-2 text-sm rounded-lg transition-colors",
                            selectedCategory === cat.id
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
                {filterOptions.collections.length > 0 && (
                  <FilterSection title="Kollektion" count={selectedCollection ? 1 : 0}>
                    <div className="space-y-1">
                      {filterOptions.collections.map((col) => (
                        <button
                          key={col.id}
                          onClick={() => setCollection(col.id)}
                          className={cn(
                            "block w-full text-left px-3 py-2 text-sm rounded-lg transition-colors",
                            selectedCollection === col.id
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
                  <FilterSection title="Farbe" count={selectedColors.length}>
                    <div className="flex flex-wrap gap-3">
                      {filterOptions.colors.map((color) => (
                        <button
                          key={color.value}
                          onClick={() => toggleColor(color.value)}
                          className={cn(
                            "w-9 h-9 rounded-full border-2 transition-all",
                            selectedColors.includes(color.value)
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
                  <FilterSection title="Größe" count={selectedSizes.length}>
                    <div className="flex flex-wrap gap-2">
                      {filterOptions.sizes.map((size) => (
                        <button
                          key={size.value}
                          onClick={() => toggleSize(size.value)}
                          className={cn(
                            "px-4 py-2 text-sm font-medium rounded-lg border transition-colors",
                            selectedSizes.includes(size.value)
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
                  <FilterSection title="Material" count={selectedMaterials.length}>
                    <div className="space-y-3">
                      {filterOptions.materials.map((material) => (
                        <label
                          key={material.value}
                          className="flex items-center gap-3 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedMaterials.includes(material.value)}
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
                  <FilterSection title="Preis" count={selectedPriceRange ? 1 : 0}>
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
                            checked={selectedPriceRange === range.value}
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
