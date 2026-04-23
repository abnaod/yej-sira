/**
 * Origin for API fetches, static assets, and Better Auth (no path, no trailing slash).
 *
 * - When `VITE_API_URL` is set, it wins (direct API or CDN).
 * - In the browser during dev, if the page is on `localhost` or `127.0.0.1` but
 *   `VITE_API_URL` uses the other loopback name, rewrite the API hostname to match
 *   the page. Otherwise OAuth cookies are cross-site and Google sign-in fails with
 *   `state_mismatch`.
 * - On the server during dev / SSR, defaults to the local API origin.
 * - `SERVER_API_URL` (runtime, not Vite-inlined) overrides SSR only for **fetch** — use
 *   in Docker so the web container calls `http://api:5001` instead of `localhost:5001`.
 * - **Never** use `SERVER_API_URL` for `img src` / `assetUrl`: browsers must get a
 *   host-reachable origin (`VITE_API_URL`), not the Docker service name.
 */

/**
 * API origin the browser (or any client) can load — `<img src>`, Open Graph, etc.
 * Does not use `SERVER_API_URL`.
 */
export function getPublicApiOrigin(): string {
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
    return "http://localhost:5001";
  }

  if (typeof window !== "undefined") {
    // Production bundle without `VITE_API_URL` (e.g. Docker build forgot build args) would
    // otherwise use the web app origin — `/api/*` then returns HTML, not JSON.
    if (import.meta.env.PROD) {
      try {
        const page = new URL(window.location.href);
        if (page.port === "5000") {
          page.port = "5001";
          return page.origin;
        }
      } catch {
        /* fall through */
      }
    }
    return window.location.origin;
  }

  return "http://localhost:5001";
}

/**
 * Origin for `fetch` / server-side API calls. In Docker SSR, prefers `SERVER_API_URL`
 * so requests stay on the internal network.
 */
export function getApiOrigin(): string {
  if (import.meta.env.SSR) {
    const internal = typeof process !== "undefined" ? process.env.SERVER_API_URL?.trim() : "";
    if (internal) {
      return internal.replace(/\/$/, "");
    }
  }

  return getPublicApiOrigin();
}
