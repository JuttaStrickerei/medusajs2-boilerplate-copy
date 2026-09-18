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

## Railway (infra, logs, MCP)

All services live in **one** Railway project: **Backend**, **Storefront**, **Postgres**, **Redis**, **MeiliSearch**, **Bucket** (S3-compatible object storage, volume-backed) and **Console**. Environments: **dev** and **prod**.

### Access

- Railway CLI is installed at `~/.railway/bin/railway` via the official install script (**not** via pnpm — pnpm blocks its postinstall). `.bashrc` sources `~/.railway/env`, so fresh shells have `railway` on PATH.
- Login is interactive: `railway login` (browser flow). Agents cannot do this — on `Unauthorized`, ask the user to type `! railway login`.
- Project: **MedusaJS Eigen** (`164701c8-68c1-49f6-bce4-fe718dfad057`) in workspace "juttastrickerei's Projects". The dev environment is literally named `"dev "` **with a trailing space**, so `-e dev` fails — use its ID `1d2ce3bd-a769-4de5-813a-ea2a1072ce0d`. prod is `9a0b5e98-e2dd-40d0-b890-1b3126218719`.
- `backend/` and `storefront/` are linked to their services with `railway link -p "MedusaJS Eigen" -e 1d2ce3bd-a769-4de5-813a-ea2a1072ce0d -s Backend|Storefront` (the link lives in `~/.railway/config.json`, not in the repo). Everything else is reachable with `--service <name>`.
- MCP tools carry `readOnlyHint`/`destructiveHint` annotations. Read-only ones (`environment-status`, `get-service-metrics`, `get-logs`, `list-variables`, `get-service-config`, `http-*`) are fine to call; anything else falls under the safety rules below. Note `list-variables` returns rendered secret values — same rule as the CLI.
- The Railway MCP server is configured project-wide in `.mcp.json` (`railway mcp` = stdio proxy to mcp.railway.com, authenticated through the CLI session). Use it for structured project/service queries; keep using the CLI for logs and variables.

```bash
cd backend && railway logs                 # runtime logs, Backend
cd storefront && railway logs              # runtime logs, Storefront
railway logs --service MeiliSearch --lines 200
railway logs --build | --deployment        # build / deploy logs
railway status --json                      # project, environment, services
railway variables --service Bucket --json | jq 'keys'   # variable NAMES only
```

### Safety rules (this is a live production shop)

- **Default environment is `dev`.** Never switch to `prod` (`railway environment prod`) unless the user explicitly asks for it in this session.
- Railway is **read-only by default**: logs, `status` and variable names may be read freely.
- **Never without an explicit yes for that specific action:** `railway up` / `redeploy` / `accept-deploy`, restarting services, `railway variables set|delete|edit`, changing service or environment settings, creating or deleting services/projects. Applies to CLI **and** MCP tools alike.
- **Never print secret values** from `railway variables` into replies, summaries or files. The default output, `--kv` and `--json` all print raw values — always filter through `| jq 'keys'` or reference variable names only.

### Bucket / object storage

- Analysis is always allowed: object listings, size breakdowns, duplicate and orphan detection (cross-check against product images in Postgres).
- Take credentials from `railway variables --service Bucket --json` and export them as env vars for the session only (e.g. `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` for `aws s3 --endpoint-url …` or `mc alias set`). Never write them into repo files, scripts or command history.
- **Destructive bucket operations** (delete, overwrite, bulk conversion) require explicit approval **per batch** and must always start with a dry run listing exactly what would be affected.

### Cost optimization context

- Main cost driver is **service memory (RAM-minutes)**, not storage. Priority order: **dev environment uptime** (don't leave it running constantly) → per-service memory limits → MeiliSearch footprint → only then image storage.
- Image optimization (size, WebP/AVIF) is welcome, but its goal is page speed and SEO, not the Railway bill.

### Workflow for incidents

- When the user reports a problem ("checkout fails", "site is down"): pull the relevant service's recent logs first, form a hypothesis and explain it, then propose code changes.
- Fixes happen locally in this repo; the user deploys manually unless they say otherwise.

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
