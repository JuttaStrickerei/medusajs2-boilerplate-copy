# Displaying Entities - Patterns and Components

## Contents
- [When to Use Each Pattern](#when-to-use-each-pattern)
- [DataTable Pattern](#datatable-pattern)
- [Simple List Patterns](#simple-list-patterns)
- [Empty States](#empty-states)
- [Loading States](#loading-states)
- [Common Class Patterns](#common-class-patterns)

## When to Use Each Pattern

**Use DataTable when:**
- Displaying potentially many entries (>5-10 items)
- Users need to search, filter, or paginate
- Bulk actions are needed

**Use simple list components when:**
- Displaying a few entries (<5-10 items)
- In a widget or sidebar context
- Space is limited

## DataTable Pattern

### Complete DataTable Implementation

```tsx
import {
  DataTable,
  DataTableRowSelectionState,
  DataTablePaginationState,
  createDataTableColumnHelper,
  useDataTable,
} from "@medusajs/ui"
import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { sdk } from "../lib/client"

const columnHelper = createDataTableColumnHelper<Product>()

const columns = [
  columnHelper.select(), // For row selection
  columnHelper.accessor("title", {
    header: "Title",
  }),
  columnHelper.accessor("status", {
    header: "Status",
  }),
  columnHelper.accessor("created_at", {
    header: "Created",
    cell: ({ getValue }) => new Date(getValue()).toLocaleDateString(),
  }),
]

export function ProductTable() {
  const [rowSelection, setRowSelection] = useState<DataTableRowSelectionState>({})
  const [searchValue, setSearchValue] = useState("")
  const [pagination, setPagination] = useState<DataTablePaginationState>({
    pageIndex: 0,
    pageSize: 15,
  })

  const limit = pagination.pageSize
  const offset = pagination.pageIndex * limit

  const { data, isLoading } = useQuery({
    queryFn: () =>
      sdk.admin.product.list({
        limit,
        offset,
        q: searchValue || undefined,
      }),
    queryKey: ["products", limit, offset, searchValue],
    keepPreviousData: true,
  })

  const table = useDataTable({
    data: data?.products || [],
    columns,
    getRowId: (product) => product.id,
    rowCount: data?.count || 0,
    isLoading,
    rowSelection: {
      state: rowSelection,
      onRowSelectionChange: setRowSelection,
    },
    search: {
      state: searchValue,
      onSearchChange: setSearchValue,
    },
    pagination: {
      state: pagination,
      onPaginationChange: setPagination,
    },
  })

  return (
    <DataTable instance={table}>
      <DataTable.Toolbar>
        <DataTable.Search />
      </DataTable.Toolbar>
      <DataTable.Table />
      <DataTable.Pagination />
    </DataTable>
  )
}
```

### DataTable Troubleshooting

**"DataTable.Search was rendered but search is not enabled"**

You must pass search state configuration to useDataTable:

```tsx
search: {
  state: searchValue,
  onSearchChange: setSearchValue,
}
```

**"Cannot destructure property 'pageIndex' of pagination as it is undefined"**

Always initialize pagination state with both properties:

```tsx
const [pagination, setPagination] = useState({
  pageIndex: 0,
  pageSize: 15,
})
```

## Simple List Patterns

### Product/Variant List Item

```tsx
import { Thumbnail, Text } from "@medusajs/ui"
import { TriangleRightMini } from "@medusajs/icons"
import { Link } from "react-router-dom"

const ProductListItem = ({ product }) => {
  return (
    <Link to={`/products/${product.id}`}>
      <div className="flex items-center gap-3 p-3 rounded-md shadow-elevation-card-rest bg-ui-bg-component hover:bg-ui-bg-component-hover transition-colors">
        <Thumbnail src={product.thumbnail} />
        <div className="flex-1">
          <Text size="small" leading="compact" weight="plus">
            {product.title}
          </Text>
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            {product.status}
          </Text>
        </div>
        <TriangleRightMini className="text-ui-fg-muted" />
      </div>
    </Link>
  )
}
```

### Simple Text List (No Thumbnails)

```tsx
import { Text } from "@medusajs/ui"
import { TriangleRightMini } from "@medusajs/icons"
import { Link } from "react-router-dom"

const SimpleListItem = ({ title, description, link }) => {
  return (
    <Link to={link}>
      <div className="flex items-center gap-3 p-3 rounded-md shadow-elevation-card-rest bg-ui-bg-component hover:bg-ui-bg-component-hover">
        <div className="flex-1">
          <Text size="small" leading="compact" weight="plus">
            {title}
          </Text>
          {description && (
            <Text size="small" leading="compact" className="text-ui-fg-subtle">
              {description}
            </Text>
          )}
        </div>
        <TriangleRightMini className="text-ui-fg-muted" />
      </div>
    </Link>
  )
}
```

### Grid Display

```tsx
<div className="grid grid-cols-2 md:grid-cols-3 gap-4">
  {items.map((item) => (
    <div key={item.id} className="p-4 rounded-md shadow-elevation-card-rest bg-ui-bg-component">
      <Thumbnail src={item.thumbnail} />
      <Text size="small" leading="compact" weight="plus" className="mt-2">
        {item.title}
      </Text>
      <Text size="small" leading="compact" className="text-ui-fg-subtle">
        {item.description}
      </Text>
    </div>
  ))}
</div>
```

## Empty States

Always handle empty states gracefully:

```tsx
{items.length === 0 ? (
  <Text size="small" leading="compact" className="text-ui-fg-subtle py-4 text-center">
    No items to display
  </Text>
) : (
  <div className="flex flex-col gap-2">
    {items.map((item) => (
      <ItemComponent key={item.id} item={item} />
    ))}
  </div>
)}
```

## Loading States

Show loading states while data is being fetched:

```tsx
import { Spinner } from "@medusajs/ui"

{isLoading ? (
  <div className="flex justify-center py-4">
    <Spinner />
  </div>
) : (
  <div className="flex flex-col gap-2">
    {items.map((item) => (
      <ItemComponent key={item.id} item={item} />
    ))}
  </div>
)}
```

## Common Class Patterns

### Card with elevation and hover

```tsx
className="shadow-elevation-card-rest bg-ui-bg-component rounded-md transition-colors hover:bg-ui-bg-component-hover"
```

### Flex container with consistent spacing

```tsx
className="flex flex-col gap-2" // For vertical lists
className="flex items-center gap-3" // For horizontal items
```

### Focus states for interactive elements

```tsx
className="outline-none focus-within:shadow-borders-interactive-with-focus rounded-md"
```
