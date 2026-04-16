/**
 * Origin for API fetches, static assets, and Better Auth (no path, no trailing slash).
 *
 * - When `VITE_API_URL` is set, it wins (direct API or CDN).
 * - In dev, the browser uses the current page origin so Vite can proxy `/api` and
 *   `/static` to the Hono server (avoids calling `localhost:3001` when only the
 *   web dev server tab is open, or when the API port differs).
 * - On the server during dev / SSR, defaults to the local API origin.
 */
export function getApiOrigin(): string {
  const fromEnv = (import.meta.env.VITE_API_URL as string | undefined)?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");

  if (import.meta.env.DEV) {
    if (typeof window !== "undefined") {
      return window.location.origin;
    }
    return "http://localhost:3001";
  }

  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return "http://localhost:3001";
}
