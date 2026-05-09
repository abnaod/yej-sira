/**
 * Origin for API fetches, static assets, and Better Auth (no path, no trailing slash).
 *
 * - When `VITE_API_URL` is set, it wins (direct API or CDN), except in dev when
 *   it points at loopback and the page is opened through a public tunnel such as
 *   ngrok; then browser calls stay same-origin so Vite can proxy `/api` and `/static`.
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
        const apiIsLoopback = api.hostname === "localhost" || api.hostname === "127.0.0.1";
        const pageIsLoopback =
          pageHost === "localhost" || pageHost === "127.0.0.1" || pageHost === "0.0.0.0";
        if (pageIsLoopback && !apiIsLoopback) {
          return window.location.origin;
        }
        if (apiIsLoopback && !pageIsLoopback) {
          return window.location.origin;
        }
        if (apiIsLoopback && pageIsLoopback && api.hostname !== pageHost) {
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
    const page = new URL(window.location.href);
    const pageIsLoopback =
      page.hostname === "localhost" ||
      page.hostname === "127.0.0.1" ||
      page.hostname === "0.0.0.0";
    if (pageIsLoopback && (page.port === "3000" || page.port === "5173")) {
      return page.origin;
    }
    // Production bundle without `VITE_API_URL` (e.g. Docker build forgot build args) would
    // otherwise use the web app origin — `/api/*` then returns HTML, not JSON.
    if (import.meta.env.PROD) {
      try {
        if (page.port === "3000") {
          page.port = "5001";
          page.protocol = "http:";
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
    if (import.meta.env.DEV) {
      return "http://localhost:5001";
    }
  }

  return getPublicApiOrigin();
}
