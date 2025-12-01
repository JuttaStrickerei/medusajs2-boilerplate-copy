/**
 * Type definitions for ProductFilters component
 */

export interface FilterOption {
  /** Unique identifier for the option */
  id: string
  /** Display label shown to the user */
  label: string
  /** Value used in URL search params */
  value: string
  /** Optional product count for this filter */
  count?: number
}

export interface FilterGroup {
  /** Unique identifier used as URL param key (e.g., "color", "size") */
  id: string
  /** Display label for the filter group (e.g., "Farbe", "Größe") */
  label: string
  /** Array of filter options in this group */
  options: FilterOption[]
}

export interface ProductFiltersProps {
  /** Array of filter groups to display */
  filterGroups: FilterGroup[]
  /** Optional className for wrapper styling */
  className?: string
}

export interface SelectedFilters {
  /** Key is filter group ID, value is array of selected option values */
  [groupId: string]: string[]
}
