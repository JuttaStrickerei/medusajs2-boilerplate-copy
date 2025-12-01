# ProductFilters Component

A responsive product filtering component that updates URL search params to filter products. Built with @medusajs/ui and @headlessui/react.

## Features

- ✅ **Responsive Design**: Desktop sidebar + mobile drawer
- ✅ **URL State Management**: Filters persist in URL search params
- ✅ **Touch-Optimized**: 44x44px touch targets on mobile
- ✅ **Accessible**: Keyboard navigation, ARIA labels
- ✅ **Brand Styling**: Stone color palette integration
- ✅ **MedusaJS Architecture**: Server Component passes data, Client Component manages state

## Architecture

```
┌─────────────────────────────────────┐
│  Page (Server Component)            │
│  - Fetches filter facets from API   │
│  - Passes data as props              │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│  ProductFilters (Client Component)  │
│  - Manages URL search params        │
│  - Handles filter selection         │
│  - Renders desktop sidebar          │
│  - Triggers mobile drawer           │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│  MobileFilterDrawer                 │
│  - Headless UI Dialog               │
│  - Slide-in from right              │
│  - Full-screen on mobile            │
└─────────────────────────────────────┘
```

## Usage

### 1. Prepare Filter Data (Server Component)

```tsx
// app/[countryCode]/(main)/store/page.tsx
import ProductFilters from "@modules/products/components/product-filters"

export default async function StorePage() {
  // Fetch filter options from your API or database
  const filterGroups = [
    {
      id: "category",
      label: "Category",
      options: [
        { id: "cat-1", label: "Knitwear", value: "knitwear", count: 24 },
        { id: "cat-2", label: "Accessories", value: "accessories", count: 12 },
      ],
    },
    {
      id: "color",
      label: "Color",
      options: [
        { id: "col-1", label: "Natural", value: "natural", count: 18 },
        { id: "col-2", label: "Navy", value: "navy", count: 15 },
        { id: "col-3", label: "Gray", value: "gray", count: 10 },
      ],
    },
    {
      id: "size",
      label: "Size",
      options: [
        { id: "size-1", label: "S", value: "s", count: 20 },
        { id: "size-2", label: "M", value: "m", count: 25 },
        { id: "size-3", label: "L", value: "l", count: 22 },
      ],
    },
  ]

  return (
    <div className="content-container py-6">
      <div className="flex gap-8">
        {/* Filters Sidebar */}
        <ProductFilters filterGroups={filterGroups} />

        {/* Product Grid */}
        <div className="flex-1">
          <ProductGrid />
        </div>
      </div>
    </div>
  )
}
```

### 2. Read Filters in Product Fetching

```tsx
// lib/data/products.ts
export async function getFilteredProducts(searchParams: {
  category?: string
  color?: string
  size?: string
}) {
  const filters: any = {}

  // Parse comma-separated values
  if (searchParams.category) {
    filters.category_id = searchParams.category.split(",")
  }
  if (searchParams.color) {
    filters.color = searchParams.color.split(",")
  }
  if (searchParams.size) {
    filters.size = searchParams.size.split(",")
  }

  // Fetch products with filters
  return await sdk.store.product.list({ filters })
}
```

### 3. Integration Example

```tsx
// templates/category-template.tsx
import ProductFilters, { FilterGroup } from "@modules/products/components/product-filters"

export default function CategoryTemplate({
  category,
  searchParams,
}: {
  category: StoreProductCategory
  searchParams: { [key: string]: string }
}) {
  // Build filter groups from category metadata or API
  const filterGroups: FilterGroup[] = [
    {
      id: "material",
      label: "Material",
      options: [
        { id: "mat-1", label: "Wool", value: "wool" },
        { id: "mat-2", label: "Cotton", value: "cotton" },
        { id: "mat-3", label: "Cashmere", value: "cashmere" },
      ],
    },
  ]

  return (
    <div className="content-container py-6">
      <div className="flex flex-col lg:flex-row gap-8">
        <ProductFilters filterGroups={filterGroups} />

        <div className="flex-1">
          <h1 className="text-2xl font-medium text-stone-800 mb-6">
            {category.name}
          </h1>
          <PaginatedProducts
            categoryId={category.id}
            filters={searchParams}
          />
        </div>
      </div>
    </div>
  )
}
```

## TypeScript Interfaces

```tsx
interface FilterOption {
  id: string        // Unique identifier
  label: string     // Display text
  value: string     // URL param value
  count?: number    // Optional product count
}

interface FilterGroup {
  id: string              // URL param key (e.g., "color")
  label: string           // Display label (e.g., "Color")
  options: FilterOption[]
}
```

## Responsive Behavior

### Desktop (≥ 1024px)
- Static sidebar (264px width)
- Sticky positioning (top: 80px)
- Visible at all times
- Instant filter updates

### Mobile/Tablet (< 1024px)
- Filter button shows active count badge
- Click opens slide-in drawer from right
- Full-screen overlay with backdrop
- "Apply Filters" closes drawer

## Styling Customization

```tsx
// Custom wrapper styling
<ProductFilters
  filterGroups={filterGroups}
  className="lg:w-72" // Override default width
/>
```

## URL Structure

When filters are selected, the URL updates:

```
/store?category=knitwear&color=natural,navy&size=m,l
```

- Multiple values in one group: comma-separated
- Multiple groups: separate params
- No page reload (client-side navigation)
- Bookmarkable and shareable

## Accessibility

- ✅ Keyboard navigable (Tab, Enter, Space)
- ✅ Screen reader friendly (ARIA labels)
- ✅ Focus visible indicators
- ✅ 44x44px minimum touch targets on mobile
- ✅ Semantic HTML (aside, label, button)

## Performance

- Client Component only for interactivity
- Filter data passed from Server Component
- No unnecessary re-renders
- Optimistic UI updates
- Debouncing not needed (instant feedback is better UX)

## Future Enhancements

- [ ] Price range slider
- [ ] Search within filters
- [ ] Collapsible filter groups
- [ ] "Show more" for long option lists
- [ ] Active filters summary bar
- [ ] Clear individual filter chips
