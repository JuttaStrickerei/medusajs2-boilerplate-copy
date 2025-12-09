# API Contracts

## SDK Instance
Use existing config in `storefront/src/lib/config.ts`

## Data Fetchers (USE THESE)
Located in `storefront/src/lib/data/`:

| File | Functions |
|------|-----------|
| products.ts | getProductByHandle, getProductsList |
| cart.ts | getCart, addToCart, updateLineItem |
| regions.ts | getRegion, listRegions |
| customer.ts | getCustomer, login, register |
| collections.ts | getCollectionByHandle |

## Server Actions Pattern
```typescript
// modules/cart/actions.ts
"use server"
import { revalidateTag } from "next/cache"

export async function addToCart(variantId: string, quantity: number) {
  // Use existing cart service
  await addItem({ variantId, quantity })
  revalidateTag("cart")
}
```

## Cache Tags
- `"cart"` - Cart data
- `"products"` - Product listings
- `"customer"` - Customer data

## Cookies (DO NOT CHANGE NAMES)
- `_medusa_cart_id` - Cart identifier
- `_medusa_region` - Selected region

## Types
Import from `@medusajs/types`:
- `HttpTypes.StoreProduct`
- `HttpTypes.StoreCart`
- `HttpTypes.StoreRegion`
