# Jutta — Project Instructions for Claude

Monorepo for **Jutta Strickerei** (Austrian knitwear e-commerce). Based on the Funkyton Medusa 2.0 Railway boilerplate.

## Stack

- **Monorepo layout**: `backend/` (Medusa 2.12.3) + `storefront/` (Next.js 15, React 19 RC)
- **Node**: 22.x
- **Package manager**: `pnpm` (backend: 9.10.0, storefront: 9.15.0) — NEVER run `npm install` in this repo
- **DB**: PostgreSQL (MikroORM 6.4.16)
- **Cache / queue**: Redis (Event Bus + Workflow Engine)
- **Deployment**: Railway (bucket-prod-1f4b.up.railway.app is the prod MinIO bucket)

## Dev Workflow

```bash
# Backend (admin on :9000/app)
cd backend && pnpm dev

# Storefront (German default, :8000)
cd storefront && pnpm dev
```

- Storefront dev server runs on port **8000**, NOT 3000. Use `curl http://localhost:8000/at` (first hit triggers compile, second is real).
- Backend needs Postgres + Redis + MinIO — local fallbacks exist but MinIO URLs in DB rows point at the prod Railway bucket.
- `pnpm ib` in backend runs migrations + seed.
- Turbopack is **disabled** on master (left on the `main` branch by mistake). Don't re-enable it without asking.

## Browser testing (Claude in Chrome extension)

The user has the Claude in Chrome extension. When a storefront or admin change needs checking in a real browser (buttons, option/size selection, links, add-to-cart, cart page, admin forms), load the `claude-in-chrome` skill and click through it yourself instead of stopping at `curl`.

If no `mcp__claude-in-chrome__*` tools or `claude-in-chrome` skill are available in the session, the extension isn't connected. Ask the user to run `/chrome` (or start Claude Code with `claude --chrome`); don't fall back to other browser automation.

- **Local servers only.** Only open `http://localhost:8000/…` (storefront) and `http://localhost:9000/app` (admin). **Never** drive the live shop (`shop.strickerei-jutta.at`), prod/dev Railway URLs or any other site with the extension.
- **Spin them up first:**
  1. Start the Railway **dev** Postgres. Add Bucket only if uploads are tested. The dev env ID is used because its name has a trailing space:
     ```
     railway redeploy --service Postgres -e 1d2ce3bd-a769-4de5-813a-ea2a1072ce0d -p 164701c8-68c1-49f6-bce4-fe718dfad057 -y --from-source
     ```
  2. Run `cd backend && pnpm dev`, then `cd storefront && pnpm dev`.
  3. Wait for `Server is ready on port: 9000` and `Ready in`.
  4. Stop the dev services again when testing is done.
- **What to cover:**
  - every new or changed button and link;
  - variant/size/colour selection, including sold-out and low-stock states;
  - add-to-cart, with the cart count updating and the item showing on `/at/cart` at the right price and quantity;
  - no errors in the browser console.
- **Stop before payment.** Adding to the cart and opening checkout are fine. Never submit a payment, never enter real card or customer data, and never complete an order.
- **Clean up afterwards:** remove the test items from the cart. Delete test data you created in the admin, but only data you created yourself.
- The admin needs a login. If the browser isn't logged in, ask the user to log in; never guess or reset credentials.

## Relevant Skills (use proactively)

- `medusa-dev:building-with-medusa` — any backend module / API route / workflow work
- `medusa-dev:building-admin-dashboard-customizations` — admin widgets / custom pages
- `medusa-dev:building-storefronts` — SDK usage, data fetching from storefront
- `ecommerce-storefront:storefront-best-practices` — cart / checkout / product pages
- `medusa-dev:db-generate` / `medusa-dev:db-migrate` — migrations for custom modules
- **MCP: `plugin:medusa-dev:MedusaDocs`** for Medusa 2.x doc questions
- **MCP: `context7`** for Sendcloud, Stripe, Next.js 15, MeiliSearch, React 19 docs — prefer over web search

## Custom Backend Modules (`backend/src/modules/`)

- `sendcloud` — fulfillment provider (DPD AT Classic tiers by weight)
- `sendcloud-shipment` — shipment tracking / sync with Sendcloud
- `invoice_generator` — PDF invoices (pdfmake / pdf-lib), admin config page
- `wishlist` — account-bound wishlist (custom module + migrations)
- `minio-file` — MinIO S3-compatible file provider
- `email-notifications` — Resend + react-email templates
- `mailchimp` — newsletter provider (channel: `newsletter`), new-products campaigns

Provider modules load conditionally based on env vars (see `medusa-config.js`). Don't hard-wire a provider — respect the `...(ENV ? [{...}] : [])` pattern.

## Integrations

| Service      | Where                           | Notes                                               |
|--------------|---------------------------------|-----------------------------------------------------|
| Stripe       | `@medusajs/payment-stripe`      | Placeholder color is **intentionally light grey** — don't darken it |
| Sendcloud    | `src/modules/sendcloud`         | DPD AT only; webhooks at `api/webhooks/sendcloud` (HMAC-SHA256 verified — see env below) |
| Resend       | `src/modules/email-notifications` | From: "Jutta Strickerei <…>"                       |
| Mailchimp    | `src/modules/mailchimp`         | Newsletter + "new products" campaigns               |
| MeiliSearch  | `@rokmohar/medusa-plugin-meilisearch` | Custom searchable attrs incl. `material`; indexes: `products`, `categories`, `collections` |
| MinIO        | `src/modules/minio-file`        | Prod bucket: `bucket-prod-1f4b.up.railway.app`      |
| PayPal       | env vars present, not wired yet | `PAYPAL_*` constants exist but no module resolved   |

## Storefront Notes

- Routes are country-coded: `src/app/[countryCode]/(main)/…` and `(checkout)`. Middleware auto-redirects based on Medusa regions; default region = `NEXT_PUBLIC_DEFAULT_REGION` (typically `at`).
- German legal pages: `/imprint` (alias `/impressum`), `/terms` (alias `/agb`), `/privacy`.
- German is the default language — keep copy/comments in German where existing code uses German; don't translate to English unless asked.
- Custom modules under `src/modules/`: cart, checkout, wishlist, size-guide, categories, contact, etc.
- `next.config.js` has `eslint.ignoreDuringBuilds: true` and `typescript.ignoreBuildErrors: true` — build is permissive, verify with `pnpm lint` and `pnpm tsc --noEmit` before shipping.
- Material parsing lives in storefront and had two recent fixes (percentage stripping on comma-split parts, leading whitespace) — read before touching.

## Admin Customizations (`backend/src/admin/`)

- Widgets: order invoice, fulfillment cancel, category/collection image upload, return fulfillments
- Routes: `sendcloud` (shipment manager), `settings/invoice-config`
- Follow Medusa Admin SDK conventions (see `medusa-dev:building-admin-dashboard-customizations` skill before adding widgets/routes).

## Backend env vars worth knowing

- `SENDCLOUD_PUBLIC_KEY` / `SENDCLOUD_SECRET_KEY` — API Basic auth (panel → Integrations)
- `SENDCLOUD_SECRET_KEY` is **also** the webhook HMAC signing key — the `/webhooks/sendcloud` route uses it to verify `Sendcloud-Signature` (HMAC-SHA256, hex) and returns 401 on mismatch. No separate webhook secret env var needed. Verification is always on; there is no skip toggle.

## Conventions for this project

- Don't add tests unless I ask — this repo has none and no CI runs them.
- Don't refactor working code. Keep fixes surgical.
- Don't break the conditional module loading pattern in `medusa-config.js`.
- Preserve existing German UI strings.
- When touching custom modules, generate a migration (`medusa db:generate <module>`) — these modules own their schema.
- The `.claude/` directory is gitignored (see `.gitignore`), so anything added there is local-only.

## Common Gotchas

- Storefront 404 at `/` is expected — there is no root homepage without a country code. Use `/at`.
- Next 15 + React 19 RC: some libraries need `overrides` in `package.json` to resolve correctly.
- Images from the prod MinIO bucket need the hostname added to `next.config.js` `remotePatterns`.
- When switching buckets (dev ↔ prod), clear `.next/` cache and restart.
