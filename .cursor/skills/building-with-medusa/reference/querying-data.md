# Querying Data in Medusa

Medusa's Query API (`query.graph()`) is the primary way to retrieve data, especially across modules.

## Contents
- [When to Use Query vs Module Services](#when-to-use-query-vs-module-services)
- [Basic Query Structure](#basic-query-structure)
- [In Workflows vs Outside Workflows](#in-workflows-vs-outside-workflows)
- [Field Selection](#field-selection)
- [Filtering](#filtering)
- [Important Filtering Limitation](#important-filtering-limitation)
- [Pagination](#pagination)
- [Querying Linked Data](#querying-linked-data)
- [Validation with throwIfKeyNotFound](#validation-with-throwifkeynotfound)
- [Performance Best Practices](#performance-best-practices)

## When to Use Query vs Module Services

**⚠️ USE QUERY FOR**:
- ✅ Retrieving data **across modules** (products with linked brands, orders with customers)
- ✅ Reading data with linked entities
- ✅ Complex queries with multiple relations
- ✅ Storefront and admin data retrieval

**⚠️ USE MODULE SERVICES FOR**:
- ✅ Retrieving data **within a single module** (products with variants - same module)
- ✅ Using `listAndCount` for pagination within one module
- ✅ Mutations (always use module services or workflows)

## Basic Query Structure

```typescript
const query = req.scope.resolve("query")

const { data } = await query.graph({
  entity: "entity_name", // The entity to query
  fields: ["id", "name"], // Fields to retrieve
  filters: { status: "active" }, // Filter conditions
  pagination: { // Optional pagination
    take: 10,
    skip: 0,
  },
})
```

## In Workflows vs Outside Workflows

### Outside Workflows (API Routes, Subscribers, Scheduled Jobs)

```typescript
// In API routes
const query = req.scope.resolve("query")

const { data: products } = await query.graph({
  entity: "product",
  fields: ["id", "title"],
})

// In subscribers/scheduled jobs
const query = container.resolve("query")

const { data: customers } = await query.graph({
  entity: "customer",
  fields: ["id", "email"],
})
```

### In Workflows

Use `useQueryGraphStep` within workflow composition functions:

```typescript
import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { useQueryGraphStep } from "@medusajs/medusa/core-flows"

const myWorkflow = createWorkflow(
  "my-workflow",
  function (input) {
    const { data: products } = useQueryGraphStep({
      entity: "product",
      fields: ["id", "title"],
      filters: {
        id: input.product_id,
      },
    })

    return new WorkflowResponse({ products })
  }
)
```

## Field Selection

### Basic Fields

```typescript
const { data } = await query.graph({
  entity: "product",
  fields: ["id", "title", "description"],
})
```

### Nested Relations

Use dot notation to include related entities:

```typescript
const { data } = await query.graph({
  entity: "product",
  fields: [
    "id",
    "title",
    "variants.*", // All fields from variants
    "variants.sku", // Specific variant field
    "category.id",
    "category.name",
  ],
})
```

### Performance Tip

**⚠️ IMPORTANT**: Only retrieve fields and relations you'll actually use. Avoid using `*` to select all fields unnecessarily.

```typescript
// ❌ BAD: Retrieves all fields (inefficient)
fields: ["*"]

// ✅ GOOD: Only retrieves needed fields
fields: ["id", "title", "price"]
```

## Filtering

### Exact Match

```typescript
filters: {
  email: "user@example.com"
}
```

### Multiple Values (IN operator)

```typescript
filters: {
  id: ["id1", "id2", "id3"]
}
```

### Range Queries

```typescript
filters: {
  created_at: {
    $gte: startDate, // Greater than or equal
    $lte: endDate, // Less than or equal
  }
}
```

### Text Search (LIKE)

```typescript
filters: {
  name: {
    $like: "%search%" // Contains "search"
  }
}
```

### Multiple Conditions

```typescript
filters: {
  status: "active",
  created_at: {
    $gte: new Date("2024-01-01"),
  },
  price: {
    $gte: 10,
    $lte: 100,
  },
}
```

### Filtering Nested Relations (Same Module)

To filter by fields in nested relations **within the same module**, use object notation:

```typescript
// Product and ProductVariant are in the same module (Product Module)
const { data: products } = await query.graph({
  entity: "product",
  fields: ["id", "title", "variants.*"],
  filters: {
    variants: {
      sku: "ABC1234" // ✅ Works: variants are in same module as product
    }
  }
})
```

## Important Filtering Limitation

**⚠️ CRITICAL**: With `query.graph()`, you **CANNOT** filter by fields from linked data models in different modules.

### What This Means

- **Same Module** (✅ Can filter with `query.graph()`): Product and ProductVariant
- **Different Modules** (❌ Cannot filter with `query.graph()`): Product and Brand (custom)
- **Different Modules** (✅ Can filter with `query.index()`): Any linked modules when using Index Module

### Solution 1: Use query.index() with Index Module (Recommended)

```typescript
// ✅ CORRECT: Use query.index() to filter products by linked brand
const { data: products } = await query.index({
  entity: "product",
  fields: ["*", "brand.*"],
  filters: {
    brand: {
      name: "Nike" // ✅ Works with Index Module!
    }
  }
})
```

### Solution 2: Query from Other Side

```typescript
// ✅ CORRECT: Query brands and get their products
const { data: brands } = await query.graph({
  entity: "brand",
  fields: ["id", "name", "products.*"],
  filters: {
    name: "Nike" // ✅ Filter on brand directly
  }
})

// Access Nike products
const nikeProducts = brands[0]?.products || []
```

## Pagination

### Basic Pagination

```typescript
const { data, metadata } = await query.graph({
  entity: "product",
  fields: ["id", "title"],
  pagination: {
    skip: 0, // Offset
    take: 10, // Limit
  },
})

// metadata.count contains total count
console.log(`Total: ${metadata.count}`)
```

### With Ordering

```typescript
const { data } = await query.graph({
  entity: "product",
  fields: ["id", "title", "created_at"],
  pagination: {
    skip: 0,
    take: 10,
    order: {
      created_at: "DESC", // Newest first
    },
  },
})
```

## Querying Linked Data

When entities are linked via module links, you have two options:

### Option 1: query.graph() - Retrieve Without Cross-Module Filters

**Use when:**
- ✅ Retrieving linked data without filtering by linked module properties
- ✅ Filtering only by properties in the primary entity's module

```typescript
// ✅ WORKS: Get products with their linked brands (no cross-module filtering)
const { data: products } = await query.graph({
  entity: "product",
  fields: ["id", "title", "brand.*"],
  filters: {
    id: "prod_123", // ✅ Filter by product property (same module)
  },
})
```

### Option 2: query.index() - Filter Across Linked Modules

**Use when:**
- ✅ You need to filter data by properties of linked modules

```typescript
// ✅ CORRECT: Filter products by linked brand name using Index Module
const { data: products } = await query.index({
  entity: "product",
  fields: ["*", "brand.*"],
  filters: {
    brand: {
      name: "Nike", // ✅ Works with Index Module!
    },
  },
})
```

## Validation with throwIfKeyNotFound

Use `throwIfKeyNotFound` to validate that a record exists:

```typescript
const { data } = await query.graph({
  entity: "product",
  fields: ["id", "title"],
  filters: {
    id: productId,
  },
}, {
  throwIfKeyNotFound: true, // Throws if product doesn't exist
})

// If we get here, product exists
const product = data[0]
```

## Performance Best Practices

### 1. Only Query What You Need

```typescript
// ❌ BAD: Retrieves everything (slow, wasteful)
fields: ["*"]

// ✅ GOOD: Only needed fields (fast)
fields: ["id", "title", "price"]
```

### 2. Limit Relation Depth

```typescript
// ❌ BAD: Unnecessary depth
fields: [
  "id",
  "title",
  "variants.*",
  "variants.product.*", // Circular, unnecessary
]

// ✅ GOOD: Appropriate depth
fields: [
  "id",
  "title",
  "variants.id",
  "variants.sku",
]
```

### 3. Use Pagination for Large Result Sets

```typescript
// ✅ GOOD: Paginated query
const { data, metadata } = await query.graph({
  entity: "product",
  fields: ["id", "title"],
  pagination: {
    take: 50, // Don't retrieve thousands of records at once
    skip: 0,
  },
})
```

### 4. Filter Early

Apply filters to reduce the data set before retrieving fields and relations:

```typescript
// ✅ GOOD: Filters reduce result set first
const { data } = await query.graph({
  entity: "product",
  fields: ["id", "title", "variants.*"],
  filters: {
    status: "published",
    created_at: {
      $gte: lastWeek,
    },
  },
})
```
