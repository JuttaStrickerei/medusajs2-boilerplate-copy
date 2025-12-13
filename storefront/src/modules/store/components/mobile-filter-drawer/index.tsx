"use client"

import { Fragment, useState } from "react"
import { Dialog, Transition } from "@headlessui/react"
import { X, Filter, ChevronDown } from "@components/icons"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useTransition } from "react"
import { cn } from "@lib/utils"
import SortProducts, { SortOptions } from "../refinement-list/sort-products"

export interface ProductFilters {
  colors?: string[]
  sizes?: string[]
  materials?: string[]
  priceRange?: string
}

interface MobileFilterDrawerProps {
  sortBy: SortOptions
  filters?: ProductFilters
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

function FilterSection({ 
  title, 
  children, 
  defaultOpen = false 
}: { 
  title: string
  children: React.ReactNode
  defaultOpen?: boolean 
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="border-b border-stone-200">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full py-4 text-left"
      >
        <span className="text-base font-medium text-stone-800">{title}</span>
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
          isOpen ? "max-h-96 pb-4" : "max-h-0"
        )}
      >
        {children}
      </div>
    </div>
  )
}

export default function MobileFilterDrawer({ sortBy, filters }: MobileFilterDrawerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  // Get current filter values from props
  const selectedColors = filters?.colors || []
  const selectedSizes = filters?.sizes || []
  const selectedMaterials = filters?.materials || []
  const selectedPriceRange = filters?.priceRange || ""

  const activeFilterCount = 
    selectedColors.length + 
    selectedSizes.length + 
    selectedMaterials.length + 
    (selectedPriceRange ? 1 : 0)

  // Update URL with new filter value
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

  const setQueryParams = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set(name, value)
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
                      {selectedColors.map((color) => (
                        <button
                          key={color}
                          onClick={() => toggleColor(color)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-stone-800 text-white rounded-full"
                        >
                          {colorOptions.find((c) => c.value === color)?.label || color}
                          <X size={14} />
                        </button>
                      ))}
                      {selectedSizes.map((size) => (
                        <button
                          key={size}
                          onClick={() => toggleSize(size)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-stone-800 text-white rounded-full"
                        >
                          {size.toUpperCase()}
                          <X size={14} />
                        </button>
                      ))}
                      {selectedMaterials.map((material) => (
                        <button
                          key={material}
                          onClick={() => toggleMaterial(material)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-stone-800 text-white rounded-full"
                        >
                          {materialOptions.find((m) => m.value === material)?.label || material}
                          <X size={14} />
                        </button>
                      ))}
                      {selectedPriceRange && (
                        <button
                          onClick={() => setPriceRange(selectedPriceRange)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-stone-800 text-white rounded-full"
                        >
                          {priceRangeOptions.find((r) => r.value === selectedPriceRange)?.label}
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Sort */}
                <FilterSection title="Sortieren" defaultOpen>
                  <SortProducts sortBy={sortBy} setQueryParams={setQueryParams} />
                </FilterSection>

                {/* Color Filter */}
                <FilterSection title="Farbe">
                  <div className="flex flex-wrap gap-3">
                    {colorOptions.map((color) => (
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

                {/* Size Filter */}
                <FilterSection title="Größe">
                  <div className="flex flex-wrap gap-2">
                    {sizeOptions.map((size) => (
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

                {/* Material Filter */}
                <FilterSection title="Material">
                  <div className="space-y-3">
                    {materialOptions.map((material) => (
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

                {/* Price Range Filter */}
                <FilterSection title="Preis">
                  <div className="space-y-3">
                    {priceRangeOptions.map((range) => (
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

