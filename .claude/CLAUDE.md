# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a MedusaJS 2.0 monorepo consisting of a backend e-commerce server and a Next.js 14 storefront. It's a pre-configured boilerplate designed for deployment on Railway with integrated services including PostgreSQL, Redis, MinIO, and MeiliSearch.

**Current Version**: MedusaJS 2.1.3

## Repository Structure

```
├── backend/          # MedusaJS 2.0 backend
│   ├── src/
│   │   ├── api/              # Custom API routes (file-based routing)
│   │   ├── subscribers/      # Event handlers
│   │   ├── workflows/        # Custom workflows
│   │   ├── admin/           # Admin dashboard customizations
│   │   ├── modules/         # Custom modules
│   │   │   ├── email-notifications/  # Resend + react-email
│   │   │   ├── minio-file/          # MinIO file storage
│   │   │   ├── invoice_generator/   # PDF invoice generation
│   │   │   └── sendcloud/           # Fulfillment provider
│   │   ├── jobs/            # Scheduled jobs
│   │   ├── scripts/         # Database seeding and utilities
│   │   └── utils/
│   └── medusa-config.js     # Main configuration
└── storefront/       # Next.js 14 storefront
    ├── src/
    │   ├── app/             # App Router pages
    │   ├── modules/         # Feature modules
    │   └── lib/             # Utilities and data fetchers
    └── next.config.js
```

## Common Commands

### Backend

Navigate to backend directory for all backend commands:
```bash
cd backend
```

**Initial Setup & Database**:
- `pnpm ib` or `npm run ib` - Initialize backend: runs migrations and seeds database with system data
- `pnpm seed` or `npm run seed` - Run custom seed script

**Development**:
- `pnpm dev` or `npm run dev` - Start backend in development mode (admin dashboard available at `localhost:9000/app`)
- `pnpm build && pnpm start` - Build and run from compiled source (useful for debugging production issues)

**Email Templates**:
- `pnpm email:dev` or `npm run email:dev` - Start react-email dev server at `localhost:3002` for previewing email templates

### Shared
- **Package Manager**: `pnpm` (strictly).
- **Language**: TypeScript (Strict mode). Do not use `any`.
- **Formatting**: Prettier (2 spaces).

### Storefront (Next.js)

Navigate to storefront directory for all storefront commands:
```bash
cd storefront
```

- **Framework**: Next.js 14 App Router.
- **Styling**: Tailwind CSS v3 with `@medusajs/ui-preset`. **NO CSS Modules or styled-components**.
- **UI Libraries**:
  - `@medusajs/ui` (Radix UI primitives)
  - `@headlessui/react` (unstyled accessible components)
  - Lucide React icons
- **Data Fetching**:
  - **Server Components**: Direct SDK calls (`@medusajs/js-sdk`).
  - **Client Components**: `useQuery` / `useMutation`.
- **Design System**: Strictly adhere to `.claude/documentation/style-guide.md` and `.claude/documentation/design-principles.md`.

**Development**:
- `npm run dev` or `pnpm dev` - Start storefront in development mode (requires backend running on port 9000)
- `npm run build` or `pnpm build` - Build for production (waits for backend to be available)
- `npm run start` or `pnpm start` - Start production server
- `npm run lint` - Run ESLint

**Testing**:
- `npm run test-e2e` - Run Playwright end-to-end tests

## Development Workflow

### 1. UI Implementation (Storefront)
When asked to build UI, follow this process:
1. Check `.claude/documentation/style-guide.md` for styling stack, spacing, and typography tokens.
2. Check `.claude/documentation/design-principles.md` for design philosophy and interaction patterns.
3. Build the component in `storefront/src/modules/{domain}/components` using **Tailwind CSS utility classes only**.
4. Use components from `@medusajs/ui` or `@headlessui/react` as the foundation.
5. Ensure it is responsive and follows accessibility guidelines.
6. Create a Storybook story (if requested) or a usage example.

## Guidelines
1. **No Hallucinations**: Do not import from `@medusajs/*` packages that do not exist in v2.
2. **Atomic Design**: Keep components small. Isolate logic in hooks.
3. **Error Handling**: Storefront must gracefully handle backend 500/404 errors.

## Architecture & Key Concepts

- See @.claude/task/context_01.md for structure
- See @.claude/task/context_03.md for API patterns

## Tech Stack
- Next.js 14 with App Router
- MedusaJS v2 JS SDK
- Tailwind CSS v3 + @medusajs/ui-preset
- @medusajs/ui + @headlessui/react

## Code Style
- TypeScript strict mode
- Functional components only
- Server Components by default
- 'use client' only when necessary
- Use clx() from @medusajs/ui for class composition

## Responsive Design
- Mobile-first: write base styles, then sm:, md:, lg:
- Test at 320px, 768px, 1024px, 1440px minimum
- Touch targets minimum 44x44px on mobile

## Dark Mode
- Implementation: darkMode: "class"
- Always include dark: variants for colors
- Pattern: `bg-white dark:bg-gray-900`

## Workflow
IMPORTANT: Run typecheck after code changes
IMPORTANT: Test both light and dark modes
- Use /compact at 70% context usage
- Use /clear between distinct features
- Document new patterns in context files

## Restrictions
YOU MUST NOT modify:
- .env files directly
- node_modules/
- Any generated files in .next/

### Backend Architecture

**Module System**: MedusaJS uses a modular architecture where functionality is organized into modules. Custom modules in `src/modules/` follow the MedusaJS module pattern and integrate with core modules via dependency injection.

**API Routes (File-Based Routing)**:
- Located in `src/api/`
- File must be named `route.ts` or `route.js`
- Structure: `src/api/{scope}/{route-name}/route.ts`
  - Scopes: `store/`, `admin/`, `webhooks/`
- Export HTTP method handlers: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`, `HEAD`
- Parameters: Use `[paramName]` directory naming (e.g., `src/api/products/[productId]/route.ts`)
- Access container via `req.scope.resolve()`
- Apply middleware via `src/api/middleware.ts`

**Subscribers (Event Handlers)**:
- Located in `src/subscribers/`
- Handle events emitted by Medusa core or custom workflows
- Export subscriber function and config object with `event` property
- Receive `{ event, container }` parameters
- Used for: sending emails, indexing products, custom business logic

**Workflows**:
- Located in `src/workflows/`
- Series of steps that complete a task (transactional, with compensation logic)
- Created with `createWorkflow` and `createStep` from `@medusajs/workflows-sdk`
- Steps return `StepResponse` with data and optional compensation function
- Executed from API routes, subscribers, or scheduled jobs via `.run({ input })`

**Admin Customizations**:
- Located in `src/admin/`
- Custom admin routes in `routes/`
- Custom admin widgets in `widgets/`
- Uses `@medusajs/admin-sdk` and `@medusajs/ui`

### Storefront Architecture

**Next.js App Router**:
- Uses Next.js 14 App Router with React Server Components
- Country-specific routing: `/[countryCode]/`
- Internationalization via `next-intl`

**Module Organization**:
- `src/modules/` contains feature-specific components and logic
- Each module is self-contained (e.g., `cart/`, `checkout/`, `products/`)
- `src/lib/data/` contains server-side data fetching functions
- `src/lib/hooks/` contains client-side React hooks

**Data Fetching**:
- Server components fetch data directly from backend via `@medusajs/js-sdk`
- Backend URL configured via environment variable
- Search integration via MeiliSearch using `react-instantsearch-hooks-web`

### Integrated Services

**MinIO File Storage**:
- Configured in `src/modules/minio-file/`
- Automatically creates `medusa-media` bucket (configurable via `MINIO_BUCKET`)
- Fallback to local storage if not configured
- **Important**: After changing MinIO configuration, delete `.medusa/server/` directory and restart

**Email Notifications (Resend + react-email)**:
- Module: `src/modules/email-notifications/`
- Templates in `src/modules/email-notifications/templates/`
- All templates use shared `base.tsx` for consistent styling
- Preview templates via `pnpm email:dev`
- Trigger via notification module in subscribers

**MeiliSearch**:
- Configured via `@rokmohar/medusa-plugin-meilisearch` in `medusa-config.js`
- Products auto-indexed via subscribers: `product-upsert.ts`, `product-delete.ts`
- Searchable attributes: `title`, `description`, `variant_sku`

**Payment Integration**:
- Stripe configured in `medusa-config.js` when `STRIPE_API_KEY` and `STRIPE_WEBHOOK_SECRET` are set

**Fulfillment**:
- SendCloud provider in `src/modules/sendcloud/`
- Manual fulfillment fallback

## Environment Configuration

Both backend and storefront use environment variables. Configuration is centralized in `backend/src/lib/constants.ts`.

**Backend** uses `.env` (template: `.env.template`):
- Database: `DATABASE_URL`
- Redis: `REDIS_URL` (optional, falls back to simulated Redis)
- MinIO: `MINIO_ENDPOINT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_BUCKET`
- MeiliSearch: `MEILISEARCH_HOST`, `MEILISEARCH_API_KEY`
- Email: `RESEND_API_KEY`, `RESEND_FROM_EMAIL` or `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`
- Payment: `STRIPE_API_KEY`, `STRIPE_WEBHOOK_SECRET`
- Auth: `JWT_SECRET`, `COOKIE_SECRET`
- CORS: `ADMIN_CORS`, `AUTH_CORS`, `STORE_CORS`

**Storefront** uses `.env.local` (template: `.env.local.template`):
- Backend connection required

## Important Notes

### Configuration Changes
When changing backend configuration (especially modules or environment variables):
1. Stop the Medusa server
2. Delete `.medusa/server/` directory to clear cached configuration
3. Update environment variables
4. Restart the server

### Database Initialization
- For new database connections, run `pnpm ib` to initialize schema and seed data
- Database seeding logic in `src/scripts/seed.ts`

### Development Workflow

1. Start backend first: `cd backend && pnpm dev`
2. Wait for backend to be fully running (port 9000)
3. Start storefront: `cd storefront && npm run dev`
4. Access admin dashboard at `localhost:9000/app`
5. Access storefront at `localhost:8000`

### Custom Module Development
- Custom modules must follow MedusaJS module interface
- Register modules in `medusa-config.js` with `resolve` and `options`
- Use dependency injection container for accessing other modules
- See existing modules in `src/modules/` for reference patterns

### Email Template Development
1. Create template component in `src/modules/email-notifications/templates/`
2. Export template key constant and type guard
3. Add to `EmailTemplates` enum
4. Update `generateEmailTemplate` switch statement
5. Trigger via `notificationModuleService.createNotifications()` in subscribers

### Workflow Development
- Workflows enable transactional operations with automatic rollback
- Each step should be idempotent and include compensation logic
- Use workflows for multi-step operations (e.g., order processing, inventory updates)
- Execute workflows from API routes: `myWorkflow(req.scope).run({ input })`

---

## Subagent System

This project uses Claude Code subagents for specialized tasks. Subagents are defined in `.claude/agents/` and share context via `.claude/task/` files.

### Available Subagents

| Agent | Purpose | When to Use |
|-------|---------|-------------|
| `@layout-architect` | Page layouts, routing, Next.js App Router | Building page structure |
| `@theme-system` | Tailwind config, design tokens | Theme/styling changes |
| `@component-builder` | UI components with @medusajs/ui | Building components |
| `@api-integrator` | Medusa SDK, Server Actions | Backend integration |
| `@design-adapter` | HTML mockups → React components | Implementing mockup designs |
| `@responsive-auditor` | Responsive design validation | QA across breakpoints |

### Custom Commands

- `/adapt-layout [page]` - Implement a page from HTML mockups
- `/new-component [name] [module]` - Scaffold a new component
- `/review-responsive [path]` - Audit responsive design
- `/sync-context [number]` - Update context files

### Context Files

Located in `.claude/task/`:
- `context_01.md` - Architecture overview
- `context_02.md` - Design system tokens
- `context_03.md` - API contracts
- `context_04.md` - Component inventory
- `context_05.md` - Coding conventions
- `context_06.md` - Mockup reference

### Documentation

- `.claude/documentation/style-guide.md` - Styling tokens and patterns
- `.claude/documentation/design-principles.md` - Design philosophy

### Mockups

HTML mockups in `.claude/mockups/` serve as design reference for the Strickerei Jutta brand implementation.

### CRITICAL: Preserving MedusaJS Functionality

When using subagents:
1. **NEVER remove or break existing MedusaJS integrations**
2. **ALWAYS use @medusajs/ui components as the foundation**
3. **ALWAYS maintain SDK data fetching patterns**
4. **ALWAYS preserve Server Component / Client Component boundaries**
5. **Test that cart, checkout, and account flows still work after changes**
