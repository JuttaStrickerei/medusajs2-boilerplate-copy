# Navigation and Routing

## Contents
- [Pre-Implementation Requirements for pnpm](#pre-implementation-requirements-for-pnpm)
- [Basic Navigation with Link Component](#basic-navigation-with-link-component)
- [Programmatic Navigation](#programmatic-navigation)
- [Accessing Route Parameters](#accessing-route-parameters)
- [Linking to Built-in Admin Pages](#linking-to-built-in-admin-pages)
- [Common Navigation Patterns](#common-navigation-patterns)

## Pre-Implementation Requirements for pnpm

**⚠️ pnpm Users**: Navigation requires `react-router-dom`. Install BEFORE implementing:

```bash
pnpm list react-router-dom --depth=10 | grep @medusajs/dashboard
pnpm add react-router-dom@[exact-version]
```

**npm/yarn Users**: DO NOT install - already available through dashboard dependencies.

## Basic Navigation with Link Component

Use the `Link` component for internal navigation:

```tsx
import { Link } from "react-router-dom"
import { Text } from "@medusajs/ui"
import { TriangleRightMini } from "@medusajs/icons"

// Link to a custom page
<Link to="/custom/my-page" className="flex items-center gap-3">
  <Text size="small" leading="compact" weight="plus">
    Go to Custom Page
  </Text>
  <TriangleRightMini className="text-ui-fg-muted" />
</Link>

// Link to product details
<Link to={`/products/${product.id}`}>
  <Text size="small" leading="compact" weight="plus">
    {product.title}
  </Text>
</Link>
```

### Button-styled Link

```tsx
import { Button } from "@medusajs/ui"
import { Link } from "react-router-dom"

<Link to="/custom/page">
  <Button variant="secondary" size="small">
    View Details
  </Button>
</Link>
```

## Programmatic Navigation

Use `useNavigate` for navigation after actions:

```tsx
import { useNavigate } from "react-router-dom"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast, Button } from "@medusajs/ui"
import { sdk } from "../lib/client"

const CreateProductWidget = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const createProduct = useMutation({
    mutationFn: (data) => sdk.admin.product.create(data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["products"] })
      toast.success("Product created successfully")

      // Navigate to the new product's page
      navigate(`/products/${result.product.id}`)
    },
  })

  return (
    <Button onClick={() => createProduct.mutate({ title: "New Product" })}>
      Create and View Product
    </Button>
  )
}
```

### Navigate with State

Pass data to the destination page:

```tsx
navigate("/custom/review", {
  state: { productId: product.id, productTitle: product.title }
})

// Access in destination page
import { useLocation } from "react-router-dom"

const ReviewPage = () => {
  const location = useLocation()
  const { productId, productTitle } = location.state || {}

  return <Heading>Reviewing: {productTitle}</Heading>
}
```

### Navigate Back

```tsx
const navigate = useNavigate()

<Button onClick={() => navigate(-1)}>
  Go Back
</Button>
```

## Accessing Route Parameters

In custom pages, access URL parameters with `useParams`:

```tsx
// Custom page at: /custom/products/:id
import { useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { sdk } from "../lib/client"
import { Container, Heading } from "@medusajs/ui"

const ProductDetailsPage = () => {
  const { id } = useParams() // Get :id from URL

  const { data: product, isLoading } = useQuery({
    queryFn: () => sdk.admin.product.retrieve(id, {
      fields: "+metadata,+variants.*",
    }),
    queryKey: ["product", id],
    enabled: !!id,
  })

  if (isLoading) return <div>Loading...</div>

  return (
    <Container>
      <Heading>{product?.title}</Heading>
    </Container>
  )
}

export default ProductDetailsPage
```

### Query Parameters

Use `useSearchParams` for query string parameters:

```tsx
import { useSearchParams } from "react-router-dom"

const ProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams()

  const status = searchParams.get("status") // Get ?status=published
  const page = searchParams.get("page") // Get ?page=2

  const handleFilterChange = (newStatus: string) => {
    setSearchParams({ status: newStatus, page: "0" })
  }

  return (
    <Button onClick={() => handleFilterChange("published")}>
      Published Only
    </Button>
  )
}
```

## Linking to Built-in Admin Pages

Link to standard Medusa admin pages:

```tsx
import { Link } from "react-router-dom"

// Product details
<Link to={`/products/${productId}`}>View Product</Link>

// Order details
<Link to={`/orders/${orderId}`}>View Order</Link>

// Customer details
<Link to={`/customers/${customerId}`}>View Customer</Link>

// Product categories
<Link to="/categories">View Categories</Link>

// Settings
<Link to="/settings">Settings</Link>
```

### Common Built-in Routes

```tsx
const ADMIN_ROUTES = {
  products: "/products",
  productDetails: (id: string) => `/products/${id}`,
  orders: "/orders",
  orderDetails: (id: string) => `/orders/${id}`,
  customers: "/customers",
  customerDetails: (id: string) => `/customers/${id}`,
  categories: "/categories",
  inventory: "/inventory",
  pricing: "/pricing",
  settings: "/settings",
}
```

## Common Navigation Patterns

### Pattern: View All Link

```tsx
<div className="flex items-center justify-between px-6 py-4">
  <Heading>Related Products</Heading>
  <div className="flex items-center gap-x-2">
    <Button variant="transparent" size="small" onClick={() => setOpen(true)}>
      Edit
    </Button>
    <Link to="/custom/related-products">
      <Button variant="secondary" size="small">View All</Button>
    </Link>
  </div>
</div>
```

### Pattern: Back to List

```tsx
import { useNavigate } from "react-router-dom"
import { ArrowLeft } from "@medusajs/icons"
import { IconButton } from "@medusajs/ui"

const DetailsPage = () => {
  const navigate = useNavigate()

  return (
    <div className="flex items-center gap-x-2 mb-4">
      <IconButton variant="transparent" onClick={() => navigate("/custom/products")}>
        <ArrowLeft />
      </IconButton>
      <Heading>Product Details</Heading>
    </div>
  )
}
```

### Pattern: Action with Navigation

```tsx
const deleteProduct = useMutation({
  mutationFn: (id) => sdk.admin.product.delete(id),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["products"] })
    toast.success("Product deleted")
    navigate("/products") // Navigate to list after deletion
  },
})
```

## Important Notes

1. **pnpm users**: Must install `react-router-dom` with exact version from dashboard
2. **npm/yarn users**: Do NOT install `react-router-dom` - already available
3. **Always use relative paths** starting with `/` for internal navigation
4. **Use Link for navigation links** - better for SEO and accessibility
5. **Use navigate for programmatic navigation** - after actions or based on logic
6. **Always handle loading states** when fetching route parameter-based data
