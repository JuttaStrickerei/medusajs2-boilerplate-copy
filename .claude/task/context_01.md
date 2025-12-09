# Architecture

## Stack
- Next.js 14 App Router
- MedusaJS v2.1.3 Backend
- TypeScript Strict
- Tailwind CSS v3 + @medusajs/ui-preset

## Storefront Structure
```
storefront/src/
├── app/[countryCode]/      # Region-aware routing
│   ├── (main)/             # Main storefront layout
│   │   ├── products/[handle]/
│   │   ├── collections/[handle]/
│   │   ├── cart/
│   │   └── account/
│   └── (checkout)/         # Checkout layout (minimal)
│       └── checkout/
├── modules/                # Feature modules
│   ├── products/           # Product components
│   ├── cart/               # Cart components
│   ├── checkout/           # Checkout flow
│   ├── account/            # Account pages
│   └── layout/             # Header, Footer
└── lib/
    ├── data/               # Data fetchers (USE THESE)
    ├── hooks/              # Client hooks
    └── config.ts           # SDK instance
```

## Data Flow
- Server Components → `lib/data/*` → SDK → Backend
- Client mutations → Server Actions → revalidateTag

## Key Files
- `lib/data/products.ts` - Product fetching
- `lib/data/cart.ts` - Cart operations
- `lib/data/regions.ts` - Region/country
- `modules/*/actions.ts` - Server Actions
