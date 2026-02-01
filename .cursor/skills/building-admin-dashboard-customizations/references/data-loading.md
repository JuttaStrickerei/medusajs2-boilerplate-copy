# Data Loading Principles and Patterns

## Contents
- [Fundamental Rules](#fundamental-rules)
- [Think Before You Code Checklist](#think-before-you-code-checklist)
- [Common Mistake vs Correct Pattern](#common-mistake-vs-correct-pattern)
- [Fetching Data with useQuery](#fetching-data-with-usequery)
- [Updating Data with useMutation](#updating-data-with-usemutation)
- [Cache Invalidation Guidelines](#cache-invalidation-guidelines)

## Fundamental Rules

1. **Display data must load on mount** - Any data shown in the widget's main UI must be fetched when the component mounts, not conditionally
2. **Separate concerns** - Modal/form data queries should be independent from display data queries
3. **Handle reference data properly** - When storing IDs/references, you must fetch the full entities to display them
4. **Always show loading states** - Users should see loading indicators, not empty states, while data is being fetched
5. **Invalidate the right queries** - After mutations, invalidate the queries that provide display data

## Think Before You Code Checklist

Before implementing any widget that displays data:

- [ ] What data needs to be visible immediately?
- [ ] Where is this data stored? (metadata, separate endpoint, related entities)
- [ ] If storing IDs, how will I fetch the full entities for display?
- [ ] Are my display queries separate from interaction queries?
- [ ] Have I added loading states for all data fetches?
- [ ] Which queries need invalidation after updates?

## Common Mistake vs Correct Pattern

### ❌ WRONG - Single query for both display and modal:

```tsx
// This breaks on page refresh!
const { data } = useQuery({
  queryFn: () => sdk.admin.product.list(),
  enabled: modalOpen, // Display won't work on mount!
})

// Trying to display filtered data from modal query
const displayItems = data?.filter((item) => ids.includes(item.id)) // No data until modal opens
```

**Why this is wrong:**
- On page refresh, modal is closed, so query doesn't run
- User sees empty state instead of their data

### ✅ CORRECT - Separate queries with proper invalidation:

```tsx
// Display data - loads immediately
const { data: displayData } = useQuery({
  queryFn: () => fetchDisplayData(),
  queryKey: ["display-data", product.id],
  // No 'enabled' condition - loads on mount
})

// Modal data - loads when needed
const { data: modalData } = useQuery({
  queryFn: () => fetchModalData(),
  queryKey: ["modal-data"],
  enabled: modalOpen, // OK for modal-only data
})

// Mutation with proper cache invalidation
const updateMutation = useMutation({
  mutationFn: updateFunction,
  onSuccess: () => {
    // Invalidate display data query to refresh UI
    queryClient.invalidateQueries({ queryKey: ["display-data", product.id] })
    // Also invalidate the entity if it caches the data
    queryClient.invalidateQueries({ queryKey: ["product", product.id] })
  },
})
```

## Fetching Data with useQuery

### Basic Query

```tsx
import { useQuery } from "@tanstack/react-query"
import { sdk } from "../lib/client"

const { data, isLoading, error } = useQuery({
  queryFn: () => sdk.admin.product.retrieve(productId, {
    fields: "+metadata,+variants.*",
  }),
  queryKey: ["product", productId],
})
```

### Paginated Query

```tsx
const limit = 15
const offset = pagination.pageIndex * limit

const { data: products } = useQuery({
  queryFn: () =>
    sdk.admin.product.list({
      limit,
      offset,
      q: searchTerm,
    }),
  queryKey: ["products", limit, offset, searchTerm],
  keepPreviousData: true, // Prevents UI flicker during pagination
})
```

### Fetching Multiple Items by IDs

```tsx
// For display - fetch specific items by IDs
const { data: displayProducts } = useQuery({
  queryFn: async () => {
    if (selectedIds.length === 0) return { products: [] }

    const response = await sdk.admin.product.list({
      id: selectedIds, // Fetch only the selected products
      limit: selectedIds.length,
    })
    return response
  },
  queryKey: ["related-products-display", selectedIds],
  enabled: selectedIds.length > 0, // Only fetch if there are IDs
})
```

## Updating Data with useMutation

### Basic Mutation

```tsx
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "@medusajs/ui"

const queryClient = useQueryClient()

const updateProduct = useMutation({
  mutationFn: (payload) => sdk.admin.product.update(productId, payload),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["product", productId] })
    toast.success("Product updated successfully")
  },
  onError: (error) => {
    toast.error(error.message || "Failed to update product")
  },
})

// Usage
const handleSave = () => {
  updateProduct.mutate({
    metadata: {
      ...existingMetadata,
      new_field: "value",
    },
  })
}
```

### Mutation with Loading State

```tsx
<Button
  onClick={handleSave}
  disabled={updateProduct.isPending}
  isLoading={updateProduct.isPending}
>
  Save
</Button>
```

## Cache Invalidation Guidelines

After mutations, invalidate the queries that affect what the user sees:

```tsx
onSuccess: () => {
  // Invalidate the entity itself if it stores the data
  queryClient.invalidateQueries({ queryKey: ["product", productId] })

  // Invalidate display-specific queries
  queryClient.invalidateQueries({ queryKey: ["related-products", productId] })

  // Don't need to invalidate modal selection queries
}
```

**Key Points:**

- Use specific query keys with IDs for targeted invalidation
- Invalidate both the entity and display data queries when needed
- Consider what the user sees and ensure those queries refresh

## Important Notes about Metadata

- When updating nested objects in metadata, pass the entire object (Medusa doesn't merge nested objects)
- To remove a metadata property, set it to an empty string
- Metadata is stored as JSONB in the database

**Example: Updating Metadata**

```tsx
// ✅ CORRECT - Spread existing metadata
updateProduct.mutate({
  metadata: {
    ...product.metadata,
    new_field: "value",
  },
})

// ❌ WRONG - Overwrites all metadata
updateProduct.mutate({
  metadata: {
    new_field: "value", // All other fields lost!
  },
})
```

## Common Issues & Solutions

### "No QueryClient set, use QueryClientProvider to set one"

- **pnpm users**: You forgot to install `@tanstack/react-query` before implementing
- **npm/yarn users**: You incorrectly installed `@tanstack/react-query` - remove it from package.json
- Never wrap your component in QueryClientProvider - it's already provided

### Widget not refreshing after mutation

- Use queryClient.invalidateQueries() with the correct query key
- Ensure your query key includes all dependencies

### Data shows empty on page refresh

- Your query has `enabled: modalOpen` or similar condition
- Display data should NEVER be conditionally enabled based on UI state
- Move conditional queries to modals/forms only
