## Multi-stage Dockerfile for the Hono API.
# Context: project root (run: `docker build -f apps/api/Dockerfile .`).

FROM node:20-alpine AS base
RUN corepack enable
WORKDIR /repo

# --- deps layer ---
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY apps/api/package.json apps/api/package.json
COPY libs ./libs
RUN pnpm fetch --prod=false

# --- build ---
FROM base AS build
COPY --from=deps /repo /repo
COPY . .
RUN pnpm install --offline --frozen-lockfile
# prisma.config.ts uses env("DATABASE_URL"); .env is not copied into the image (.dockerignore).
# `prisma generate` does not connect — any valid URL satisfies the config.
ENV DATABASE_URL="postgresql://dockerbuild:dockerbuild@127.0.0.1:5432/dockerbuild?schema=public"
RUN pnpm --filter @ys/db db:generate
RUN pnpm --filter @ys/api build

# --- runtime ---
# esbuild bundles with --packages=external, so deps like `dotenv`, `hono`, `@prisma/client`
# are resolved at runtime. pnpm stores real packages in /repo/node_modules/.pnpm and
# exposes direct deps via symlinks in /repo/apps/api/node_modules, so we must preserve
# the workspace layout (api + libs + root node_modules) for Node resolution to work.
FROM node:20-alpine AS runtime
RUN corepack enable
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/apps/api ./apps/api
COPY --from=build /repo/libs ./libs
COPY --from=build /repo/package.json ./package.json
COPY --from=build /repo/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=build /repo/public ./public

WORKDIR /app/apps/api
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget -qO- http://127.0.0.1:3001/health || exit 1
CMD ["node", "dist/index.js"]
