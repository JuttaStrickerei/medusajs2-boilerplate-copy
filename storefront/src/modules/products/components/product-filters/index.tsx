"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useState } from "react"
import { Button, Checkbox, Label, clx } from "@medusajs/ui"
import MobileFilterDrawer from "./mobile-filter-drawer"
import type { FilterGroup, ProductFiltersProps, SelectedFilters } from "./types"

// Re-export types for convenience
export type { FilterOption, FilterGroup, ProductFiltersProps, SelectedFilters } from "./types"

export default function ProductFilters({
  filterGroups,
  className,
}: ProductFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  // Get current selected filters from URL
  const getSelectedFilters = useCallback(() => {
    const selected: Record<string, string[]> = {}
    filterGroups.forEach((group) => {
      const param = searchParams.get(group.id)
      if (param) {
        selected[group.id] = param.split(",")
      }
    })
    return selected
  }, [filterGroups, searchParams])

  const [selectedFilters, setSelectedFilters] = useState<SelectedFilters>(getSelectedFilters())

  // Create query string from selected filters
  const createQueryString = useCallback(
    (filters: Record<string, string[]>) => {
      const params = new URLSearchParams(searchParams.toString())

      // Remove all filter params first
      filterGroups.forEach((group) => {
        params.delete(group.id)
      })

      // Add selected filters
      Object.entries(filters).forEach(([key, values]) => {
        if (values.length > 0) {
          params.set(key, values.join(","))
        }
      })

      return params.toString()
    },
    [filterGroups, searchParams]
  )

  // Handle filter toggle
  const handleFilterToggle = (groupId: string, value: string) => {
    setSelectedFilters((prev) => {
      const groupFilters = prev[groupId] || []
      const isSelected = groupFilters.includes(value)

      const newGroupFilters = isSelected
        ? groupFilters.filter((v) => v !== value)
        : [...groupFilters, value]

      const newFilters = {
        ...prev,
        [groupId]: newGroupFilters,
      }

      // Update URL
      const query = createQueryString(newFilters)
      router.push(`${pathname}?${query}`, { scroll: false })

      return newFilters
    })
  }

  // Reset all filters
  const handleReset = () => {
    setSelectedFilters({})
    router.push(pathname, { scroll: false })
  }

  // Check if any filters are active
  const hasActiveFilters = Object.values(selectedFilters).some(
    (values) => values.length > 0
  )

  // Render filter group
  const renderFilterGroup = (group: FilterGroup) => (
    <div key={group.id} className="border-b border-stone-200 pb-6 last:border-b-0">
      <h3 className="text-sm font-medium text-stone-800 mb-4">{group.label}</h3>
      <div className="space-y-3">
        {group.options.map((option) => {
          const isChecked = selectedFilters[group.id]?.includes(option.value) || false

          return (
            <div key={option.id} className="flex items-center">
              <Checkbox
                id={`filter-${group.id}-${option.id}`}
                checked={isChecked}
                onCheckedChange={() => handleFilterToggle(group.id, option.value)}
                className="min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0"
              />
              <Label
                htmlFor={`filter-${group.id}-${option.id}`}
                className="ml-3 text-sm text-stone-600 cursor-pointer flex-1 py-2 sm:py-0"
              >
                {option.label}
                {option.count !== undefined && (
                  <span className="text-stone-400 ml-1">({option.count})</span>
                )}
              </Label>
            </div>
          )
        })}
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar - Hidden on mobile/tablet */}
      <aside
        className={clx(
          "hidden lg:block w-64 flex-shrink-0",
          className
        )}
      >
        <div className="sticky top-20 bg-white border border-stone-200 rounded-lg p-6">
          {/* Header with Reset */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-medium text-stone-800">Filters</h2>
            {hasActiveFilters && (
              <button
                onClick={handleReset}
                className="text-xs text-stone-500 hover:text-stone-700 transition-colors"
              >
                Reset
              </button>
            )}
          </div>

          {/* Filter Groups */}
          <div className="space-y-6">
            {filterGroups.map(renderFilterGroup)}
          </div>
        </div>
      </aside>

      {/* Mobile/Tablet Filter Button - Visible only on smaller screens */}
      <div className="lg:hidden mb-4">
        <Button
          onClick={() => setIsMobileOpen(true)}
          variant="secondary"
          className="w-full sm:w-auto border border-stone-300 text-stone-600 hover:bg-stone-50"
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          Filters
          {hasActiveFilters && (
            <span className="ml-2 px-2 py-0.5 bg-stone-800 text-white text-xs rounded-full">
              {Object.values(selectedFilters).flat().length}
            </span>
          )}
        </Button>
      </div>

      {/* Mobile Drawer */}
      <MobileFilterDrawer
        isOpen={isMobileOpen}
        onClose={() => setIsMobileOpen(false)}
        filterGroups={filterGroups}
        selectedFilters={selectedFilters}
        onFilterToggle={handleFilterToggle}
        onReset={handleReset}
        hasActiveFilters={hasActiveFilters}
        renderFilterGroup={renderFilterGroup}
      />
    </>
  )
}
