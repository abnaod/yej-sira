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
