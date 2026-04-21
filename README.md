# yej-sira

pnpm + Turborepo monorepo: **TanStack Start** (`apps/web`), **Hono** API (`apps/api`), **Prisma** (`libs/db`), shared **TypeScript** presets (`libs/tsconfig`).

## Prerequisites

- Node 20+
- pnpm 9+
- PostgreSQL (local or remote)

## Setup

1. Copy environment file:

   ```bash
   cp .env.example .env
   ```

2. Set `DATABASE_URL`, `BETTER_AUTH_SECRET` (≥32 characters), `BETTER_AUTH_URL`, and optional `CORS_ORIGIN` / `VITE_API_URL`.

3. Install and generate Prisma client:

   ```bash
   pnpm install
   pnpm db:generate
   ```

4. Apply migrations (development):

   ```bash
   pnpm --filter @ys/db db:migrate
   ```

   For production / CI, apply committed migrations without prompts:

   ```bash
   pnpm --filter @ys/db db:migrate:deploy
   ```

5. Seed catalog data (optional, for local dev):

   ```bash
   pnpm db:seed
   ```

## Scripts

| Command        | Description                          |
| -------------- | ------------------------------------ |
| `pnpm dev`     | Run web + API via Turborepo          |
| `pnpm build`   | Build all packages                   |
| `pnpm lint`    | Typecheck across workspaces (where configured) |
| `pnpm db:generate` | `prisma generate` in `libs/db`   |
| `pnpm db:migrate` | `prisma migrate dev` in `libs/db`   |
| `pnpm db:migrate:deploy` | `prisma migrate deploy` in `libs/db` |
| `pnpm db:seed` | Run `prisma/seed.ts` in `libs/db` |

## Workspace layout

- `apps/web` — TanStack Start, Tailwind v4, shadcn-style UI (`src/components/ui`), `auth-client` for Better Auth.
- `apps/api` — Hono on port **3001**; Better Auth at `/api/auth/*`; storefront JSON API under `/api` (categories, listings, cart, checkout, orders); static assets at `/static/*` (served from `<repo>/public`).
- `libs/db` — Prisma schema (PostgreSQL) and shared `PrismaClient`.
- `libs/tsconfig` — Shared `tsconfig` JSON presets.
- `public/` — Static image assets served by the API at `/static/*`. Subfolders:
  - `public/categories/<slug>.jpg` — Category thumbnails (one per category slug).
  - `public/listings/<listing-slug>-<n>.jpg` — Listing gallery images (1-indexed per listing).
  - `public/shops/<shop-slug>.jpg` — Shop avatars / logos.
  - `public/promotions/<promo-slug>.jpg` — Promotion hero images.
  - `public/storefront/hero-seller.jpg`, `public/storefront/hero-fallback.jpg` — Storefront hero fallbacks.
  Image URLs are stored in the DB as relative paths (e.g. `/static/categories/pottery.jpg`); the web app prefixes them with `VITE_API_URL` via `assetUrl()` when rendering.

## Ports

- Web: `http://localhost:3000`
- API: `http://localhost:3001`

TanStack Router regenerates `apps/web/src/routeTree.gen.ts` when you run `vite build` or `vite dev`. Commit updates after adding or changing routes.

## Production readiness

Key MVP-launch features and their configuration:

- **Authentication (Better Auth)** — email/password + Google OAuth. Email verification and password reset ship transactional email via [Resend](https://resend.com) when `RESEND_API_KEY` is set; otherwise emails are logged to stdout (dev fallback). Set `REQUIRE_EMAIL_VERIFICATION=true` in production.
- **Seller onboarding** — shops start in `pending` status and auto-activate when the seller completes profile, payout, first listing, and policy acceptance (Etsy-style). Admins can suspend active shops from `/admin/shops`.
- **Payments (Chapa)** — `CHAPA_SECRET_KEY` is required; `CHAPA_WEBHOOK_SECRET` is **required in production** and verified with HMAC SHA-256. Successful payments trigger order confirmation emails to buyers and new-order emails to sellers. Checkout uses an idempotency key (`cart snapshot + user + methods`) to prevent double-orders.
- **Uploads** — configure Cloudflare R2 (or any S3-compatible endpoint) via `S3_ENDPOINT`, `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, and (optionally) `CDN_BASE_URL`. If S3 env vars are absent, the API falls back to local disk under `public/uploads/*` — **dev-only**.
- **Rate limiting & logging** — in-memory fixed-window rate limits are applied to auth, payment init, uploads, promo, and review routes. A structured JSON logger (`apps/api/src/lib/logger.ts`) prints one line per request; use a log aggregator that parses JSON (Datadog, Loki, etc). For multi-instance deployments, replace the rate-limit store with Redis.
- **Error tracking** — set `SENTRY_DSN` (server) and `VITE_SENTRY_DSN` (web) to enable Sentry. Both are optional and dynamically imported only when present.
- **SEO** — the API serves `/robots.txt` and `/sitemap.xml`. In production, have your web host proxy these paths to the API, or duplicate a static robots.txt on the web domain.
- **Legal** — Terms, Privacy, Returns, and Seller Policy pages live under `/:locale/legal/*`. Keep them up to date before launch.

## Docker

Docker is used for **production-style** runs only (postgres + compiled API + compiled web). Local development continues to use `pnpm dev` on the host — there is no containerized dev workflow.

Build and run the full stack:

```bash
docker compose up --build
```

Stop any local `pnpm dev` first — it binds the same host ports (`3000`, `3001`). `docker compose` loads your root **`.env`** for variable substitution and passes it into the `api` and `web` services (same secrets and app settings you use locally). Set **`POSTGRES_USER`**, **`POSTGRES_PASSWORD`**, and **`POSTGRES_DB`** in `.env` to match the credentials and database name in `DATABASE_URL` — Compose uses them for the Postgres container and builds the in-cluster API `DATABASE_URL` (host `postgres`). If your password breaks URL interpolation, set **`DOCKER_DATABASE_URL`** to the full URL with host `postgres` (see `.env.example`). Postgres is published on **`localhost:5433`** on the host so it does not fight with a local PostgreSQL on `5432`.

### First run: apply migrations (and optionally seed)

The API container does not run migrations on boot. On a fresh Postgres volume, run these one-off commands after the stack is up:

```bash
docker compose up -d
docker compose exec api pnpm --filter @ys/db db:migrate:deploy
docker compose exec api pnpm --filter @ys/db db:seed   # optional: catalog fixtures
```

Dockerfiles live at `apps/api/Dockerfile` and `apps/web/Dockerfile`; both expect the project root as build context.

## CI

GitHub Actions at `.github/workflows/ci.yml` runs lint, typecheck, build, Prisma migrations, and Playwright smoke tests against Postgres on every PR.

## End-to-end tests

Playwright smoke tests live in `tests/e2e`:

```bash
pnpm --filter @ys/e2e exec playwright install chromium
pnpm --filter @ys/e2e test
```

The tests expect the web app at `http://localhost:3000` and API at `http://localhost:3001`. Override with `E2E_BASE_URL` / `E2E_API_URL`.
