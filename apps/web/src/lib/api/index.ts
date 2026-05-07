import type { Locale } from "@ys/intl";

import { getApiOrigin, getPublicApiOrigin } from "./origin";
import { getBrowserStorefrontContext, resolveStorefrontHost } from "@/lib/storefront";

const CART_TOKEN_KEY = "ys_cart_token";

export type ApiFetchInit = RequestInit & { locale?: Locale };

export function getStoredCartToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(CART_TOKEN_KEY);
}

export function setStoredCartToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem(CART_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(CART_TOKEN_KEY);
  }
}

export function apiUrl(path: string) {
  if (path.startsWith("http")) return path;
  const base = getApiOrigin();
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Resolve an image/asset URL for an `<img>` src. Absolute URLs (external CDNs)
 * pass through; relative paths (e.g. `/static/listings/foo.jpg`) get prefixed
 * with the API origin so the Hono static handler serves them.
 */
export function assetUrl(path: string | null | undefined): string {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (path.startsWith("data:") || path.startsWith("blob:")) return path;
  if (import.meta.env.DEV && path.startsWith("/static/")) return path;
  return `${getPublicApiOrigin()}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function apiFetch(path: string, init?: ApiFetchInit) {
  const { locale, ...rest } = init ?? {};
  const url = apiUrl(path);
  const cartToken = getStoredCartToken();
  const headers = new Headers(rest.headers);
  if (locale) {
    headers.set("X-Locale", locale);
  }
  if (import.meta.env.SSR) {
    const { getServerRequestCookie, getServerRequestHost, getServerRequestShopParam } =
      await import("./ssr-cookies");
    const [cookie, serverHost, shopParam] = await Promise.all([
      getServerRequestCookie(),
      getServerRequestHost(),
      getServerRequestShopParam(),
    ]);
    if (cookie && !headers.has("cookie")) headers.set("cookie", cookie);
    const storefront = resolveStorefrontHost(serverHost);
    const shopSlug = storefront.shopSlug ?? shopParam;
    const storefrontHost = storefront.host ?? serverHost;
    if ((storefront.isStorefront || shopParam) && shopSlug && storefrontHost) {
      headers.set("X-Shop-Slug", shopSlug);
      headers.set("X-Storefront-Host", storefrontHost);
    }
  } else if (!import.meta.env.SSR) {
    const storefront = getBrowserStorefrontContext();
    if (storefront.isStorefront && storefront.shopSlug && storefront.host) {
      headers.set("X-Shop-Slug", storefront.shopSlug);
      headers.set("X-Storefront-Host", storefront.host);
    }
  }
  /**
   * Only default `Content-Type` to JSON for string bodies — FormData needs the
   * browser-generated `multipart/form-data; boundary=…` header intact.
   */
  const isStringBody = typeof rest.body === "string";
  if (isStringBody && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (cartToken && !headers.has("X-Cart-Token")) {
    headers.set("X-Cart-Token", cartToken);
  }
  return fetch(url, {
    ...rest,
    credentials: "include",
    headers,
  });
}

/**
 * Upload a single image file to the API. Returns a `/static/uploads/...` path
 * that can be stored directly in `imageUrl` columns.
 */
export async function uploadImage(
  file: File,
  folder: "shops" | "listings" | "categories" | "misc" = "misc",
  locale?: Locale,
): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  form.append("folder", folder);
  const res = await apiFetch("/api/uploads", {
    method: "POST",
    body: form,
    locale,
  });
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new Error("Invalid upload response");
  }
  if (!res.ok) {
    const err = data as { error?: string; message?: string };
    throw new Error(err?.error ?? err?.message ?? res.statusText);
  }
  return (data as { url: string }).url;
}

export async function apiFetchJson<T>(path: string, init?: ApiFetchInit): Promise<T> {
  const res = await apiFetch(path, init);
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`Invalid JSON from ${path}`);
  }
  if (!res.ok) {
    const err = data as { error?: string };
    throw new Error(err?.error ?? res.statusText);
  }
  if (
    data &&
    typeof data === "object" &&
    "anonymousToken" in data &&
    typeof (data as { anonymousToken?: string }).anonymousToken === "string"
  ) {
    setStoredCartToken((data as { anonymousToken: string }).anonymousToken);
  }
  return data as T;
}

export { getApiOrigin, getPublicApiOrigin } from "./origin";
