## Multi-stage Dockerfile for the TanStack Start web app.
# Context: project root (run: `docker build -f apps/web/Dockerfile .`).

FROM node:20-alpine AS base
RUN corepack enable
WORKDIR /repo

# --- deps ---
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY apps/web/package.json apps/web/package.json
COPY libs ./libs
RUN pnpm fetch --prod=false

# --- build ---
FROM base AS build
COPY --from=deps /repo /repo
COPY . .
RUN pnpm install --offline --frozen-lockfile
# `.dockerignore` excludes `.env`; without this, the client bundle uses `window.location.origin`
# for API calls and hits the web server on :3000 (HTML) instead of the API on :3001 (JSON).
ARG VITE_API_URL=http://localhost:3001
ENV VITE_API_URL=$VITE_API_URL
RUN pnpm --filter @ys/web build

# --- runtime ---
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production PORT=3000
COPY --from=build /repo/apps/web/.output ./.output
COPY --from=build /repo/apps/web/package.json ./package.json

EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
