/**
 * Optional Sentry init for the web app.
 *
 * Requires `VITE_SENTRY_DSN` to be set and `@sentry/react` to be installed.
 * Install with: `pnpm --filter @ys/web add @sentry/react`
 */
export async function initSentry(): Promise<void> {
  const dsn = typeof import.meta !== "undefined" ? import.meta.env?.VITE_SENTRY_DSN : undefined;
  if (!dsn) return;
  if (typeof window === "undefined") return;

  try {
    const specifier = "@sentry/react";
    const mod = (await import(/* @vite-ignore */ specifier).catch(
      () => null,
    )) as null | { init: (opts: Record<string, unknown>) => void };
    if (!mod || typeof mod.init !== "function") return;
    mod.init({
      dsn,
      environment: import.meta.env.MODE,
      tracesSampleRate: import.meta.env.PROD ? 0.1 : 0,
    });
  } catch {
    /* ignore */
  }
}
