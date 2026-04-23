# syntax=docker/dockerfile:1.7
#
# Multi-stage Dockerfile for the Hono API, tuned for Dokploy.
#
# Dokploy build settings:
#   Build type:     Dockerfile
#   Build context:  . (repository root)
#   Dockerfile:     apps/api/Dockerfile
#   Exposed port:   5001
#   Root directory: leave empty or "." (repo root). If set to apps/api, Dokploy
#   may try to write apps/api/.env under that folder and fail with
#   .../code/apps/api/apps/api/.env (directory nonexistent).
#
# Required runtime env (set in Dokploy "Environment"):
#   DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL,
#   CORS_ORIGIN, PUBLIC_WEB_URL, CHAPA_SECRET_KEY, CHAPA_WEBHOOK_SECRET, ...
# Optional:
#   RUN_MIGRATIONS=false   # skip `prisma migrate deploy` on boot (default: true)
#
# Public assets: mount a volume to /app/public (read-write) so catalog files and
# public/uploads/ persist without rebuilding. Same path in Docker Compose: ./public -> /app/public.
# In Dokploy, add a volume and mount it to /app/public on the API service.

ARG NODE_VERSION=20

FROM node:${NODE_VERSION}-alpine AS base
RUN corepack enable
WORKDIR /repo
ENV CI=true \
    PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH

# --- dependencies ---------------------------------------------------------
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY apps/api/package.json apps/api/package.json
COPY libs ./libs
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm fetch --prod=false

# --- build ----------------------------------------------------------------
FROM base AS build
COPY --from=deps /repo /repo
COPY . .
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --offline --frozen-lockfile
# prisma.config.ts resolves DATABASE_URL via env(); the value only needs to parse
# since `prisma generate` does not open a connection.
ENV DATABASE_URL="postgresql://dockerbuild:dockerbuild@127.0.0.1:5432/dockerbuild?schema=public"
RUN pnpm --filter @ys/db db:generate
RUN pnpm --filter @ys/api build

# --- runtime --------------------------------------------------------------
# esbuild bundles with `--packages=external`, so runtime packages (hono, prisma,
# better-auth, …) are resolved by Node from the workspace's node_modules. pnpm
# stores real packages under `/repo/node_modules/.pnpm` and exposes direct deps
# via symlinks under `apps/api/node_modules` and `libs/*/node_modules`, so we
# must preserve that layout in the runtime image.
FROM node:${NODE_VERSION}-alpine AS runtime
RUN apk add --no-cache tini wget
WORKDIR /app
ENV NODE_ENV=production \
    PORT=5001 \
    HOST=0.0.0.0 \
    RUN_MIGRATIONS=true

# Workspace layout + installed deps (including prisma CLI for `migrate deploy`).
COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/apps/api ./apps/api
COPY --from=build /repo/libs ./libs
COPY --from=build /repo/package.json ./package.json
COPY --from=build /repo/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=build /repo/public ./public
COPY apps/api/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh \
 && addgroup -S app && adduser -S app -G app \
 && chown -R app:app /app
USER app

WORKDIR /app/apps/api
EXPOSE 5001
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD wget -qO- "http://127.0.0.1:${PORT}/health" || exit 1

ENTRYPOINT ["/sbin/tini", "--", "/usr/local/bin/docker-entrypoint.sh"]
CMD ["node", "dist/index.js"]
