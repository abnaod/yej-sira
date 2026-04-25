#!/bin/sh
# Dokploy entrypoint: apply pending Prisma migrations (idempotent) then exec the server.
# Toggle with RUN_MIGRATIONS=false if you prefer to run migrations out-of-band.
set -eu

# Bind and named volumes are usually root-owned; uploads go under /app/public.
# Fix ownership on each start so the non-root app user can write (see Dockerfile su-exec).
if [ -d /app/public ]; then
  if chown -R app:app /app/public; then
    echo "[entrypoint] chown /app/public -> app:app (volume ready for uploads)"
  else
    echo "[entrypoint] warning: chown /app/public failed; uploads may see EACCES" >&2
  fi
fi

if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  echo "[entrypoint] Running prisma migrate deploy"
  # prisma.config.ts resolves "../../.env" (silently no-op if absent) and reads
  # DATABASE_URL from process.env — which Dokploy injects at runtime.
  (cd /app/libs/db && ./node_modules/.bin/prisma migrate deploy)
else
  echo "[entrypoint] RUN_MIGRATIONS=${RUN_MIGRATIONS}; skipping migrations"
fi

echo "[entrypoint] Starting API: $*"
exec su-exec app "$@"
