import { getEnv } from "./env";
import { logger } from "./logger";

let initialized = false;
let sentryModule: unknown = null;

/**
 * Initialize Sentry for the API (Node). A no-op when:
 * - `SENTRY_DSN` is unset, or
 * - `@sentry/node` is not installed in the runtime.
 *
 * Install with: `pnpm --filter @ys/api add @sentry/node`
 */
export async function initSentry(): Promise<void> {
  if (initialized) return;
  const env = getEnv();
  if (!env.SENTRY_DSN) return;

  try {
    const specifier = "@sentry/node";
    const imported = (await import(/* @vite-ignore */ specifier).catch(
      () => null,
    )) as
      | null
      | {
          init: (opts: Record<string, unknown>) => void;
          captureException: (e: unknown) => void;
        };
    if (!imported || typeof imported.init !== "function") {
      logger.warn("sentry.not_installed");
      return;
    }
    imported.init({
      dsn: env.SENTRY_DSN,
      environment: env.NODE_ENV,
      tracesSampleRate: env.NODE_ENV === "production" ? 0.1 : 0,
    });
    sentryModule = imported;
    initialized = true;
    logger.info("sentry.initialized");
  } catch (e) {
    logger.warn("sentry.init_failed", { err: e instanceof Error ? e.message : String(e) });
  }
}

export function captureException(err: unknown): void {
  if (!initialized || !sentryModule) return;
  try {
    (sentryModule as { captureException: (e: unknown) => void }).captureException(err);
  } catch {
    /* ignore */
  }
}
