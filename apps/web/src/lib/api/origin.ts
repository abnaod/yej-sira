/**
 * Origin for API fetches, static assets, and Better Auth (no path, no trailing slash).
 *
 * - When `VITE_API_URL` is set, it wins (direct API or CDN).
 * - In the browser during dev, if the page is on `localhost` or `127.0.0.1` but
 *   `VITE_API_URL` uses the other loopback name, rewrite the API hostname to match
 *   the page. Otherwise OAuth cookies are cross-site and Google sign-in fails with
 *   `state_mismatch`.
 * - On the server during dev / SSR, defaults to the local API origin.
 */
export function getApiOrigin(): string {
  const fromEnv = (import.meta.env.VITE_API_URL as string | undefined)?.trim();
  if (fromEnv) {
    let origin = fromEnv.replace(/\/$/, "");
    if (import.meta.env.DEV && typeof window !== "undefined") {
      try {
        const api = new URL(origin);
        const pageHost = window.location.hostname;
        if (
          (api.hostname === "localhost" || api.hostname === "127.0.0.1") &&
          (pageHost === "localhost" || pageHost === "127.0.0.1") &&
          api.hostname !== pageHost
        ) {
          api.hostname = pageHost;
          origin = api.origin;
        }
      } catch {
        /* keep origin */
      }
    }
    return origin;
  }

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
