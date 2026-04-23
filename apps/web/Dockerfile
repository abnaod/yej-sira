# syntax=docker/dockerfile:1.7
#
# Multi-stage Dockerfile for the TanStack Start web app, tuned for Dokploy.
#
# Dokploy build settings:
#   Build type:     Dockerfile
#   Build context:  . (repository root)
#   Dockerfile:     apps/web/Dockerfile
#   Exposed port:   3000
#
# Build args (set in Dokploy "Build Args"):
#   VITE_API_URL     Public URL the BROWSER uses to reach the API (e.g. https://api.example.com).
#                    Baked into the client bundle — rebuilds are required to change it.
#
# Runtime env (set in Dokploy "Environment"):
#   PORT=3000
#   SERVER_API_URL   Internal URL the SSR server uses to reach the API (e.g. http://api:3001
#                    in a compose stack, or the same public URL in a split deployment).
#   NODE_ENV=production

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
COPY apps/web/package.json apps/web/package.json
COPY libs ./libs
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm fetch --prod=false

# --- build ----------------------------------------------------------------
FROM base AS build
COPY --from=deps /repo /repo
COPY . .
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --offline --frozen-lockfile

# `.dockerignore` excludes `.env`, so Vite would otherwise embed an empty
# VITE_API_URL and the client bundle would call `window.location.origin`.
# Pass the real public API URL via --build-arg in Dokploy.
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN test -n "$VITE_API_URL" || (echo "VITE_API_URL build-arg is required" >&2 && exit 1)
RUN pnpm --filter @ys/web build

# --- runtime --------------------------------------------------------------
# TanStack Start builds a self-contained Nitro server into `.output/` that
# already includes its own node_modules. No workspace layout needed here.
FROM node:${NODE_VERSION}-alpine AS runtime
RUN apk add --no-cache tini wget
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    HOST=0.0.0.0 \
    HOSTNAME=0.0.0.0

COPY --from=build /repo/apps/web/.output ./.output
COPY --from=build /repo/apps/web/package.json ./package.json
RUN addgroup -S app && adduser -S app -G app \
 && chown -R app:app /app
USER app

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD wget -qO- "http://127.0.0.1:${PORT}/" >/dev/null 2>&1 || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", ".output/server/index.mjs"]
