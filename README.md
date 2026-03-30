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

4. Apply schema (development):

   ```bash
   pnpm --filter @repo/db db:push
   ```

   Or use migrations:

   ```bash
   pnpm --filter @repo/db db:migrate
   ```

## Scripts

| Command        | Description                          |
| -------------- | ------------------------------------ |
| `pnpm dev`     | Run web + API via Turborepo          |
| `pnpm build`   | Build all packages                   |
| `pnpm lint`    | Typecheck across workspaces (where configured) |
| `pnpm db:generate` | `prisma generate` in `libs/db`   |
| `pnpm db:push` | `prisma db push`                     |
| `pnpm db:migrate` | `prisma migrate dev`            |

## Workspace layout

- `apps/web` — TanStack Start, Tailwind v4, shadcn-style UI (`src/components/ui`), `auth-client` for Better Auth.
- `apps/api` — Hono on port **3001**; Better Auth at `/api/auth/*`, example route `GET /api/users/me`.
- `libs/db` — Prisma schema (PostgreSQL) and shared `PrismaClient`.
- `libs/tsconfig` — Shared `tsconfig` JSON presets.

## Ports

- Web: `http://localhost:3000`
- API: `http://localhost:3001`

TanStack Router regenerates `apps/web/src/routeTree.gen.ts` when you run `vite build` or `vite dev`. Commit updates after adding or changing routes.
