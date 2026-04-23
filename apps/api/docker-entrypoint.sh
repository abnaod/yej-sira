#!/bin/sh
# Dokploy entrypoint: apply pending Prisma migrations (idempotent) then exec the server.
# Toggle with RUN_MIGRATIONS=false if you prefer to run migrations out-of-band.
set -eu

if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  echo "[entrypoint] Running prisma migrate deploy"
  # prisma.config.ts resolves "../../.env" (silently no-op if absent) and reads
  # DATABASE_URL from process.env — which Dokploy injects at runtime.
  (cd /app/libs/db && ./node_modules/.bin/prisma migrate deploy)
else
  echo "[entrypoint] RUN_MIGRATIONS=${RUN_MIGRATIONS}; skipping migrations"
fi

echo "[entrypoint] Starting API: $*"
exec "$@"
