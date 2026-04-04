import type { Locale } from "@ys/intl";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

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
  return `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function apiFetch(path: string, init?: ApiFetchInit) {
  const { locale, ...rest } = init ?? {};
  const url = apiUrl(path);
  const cartToken = getStoredCartToken();
  const headers = new Headers(rest.headers);
  if (locale) {
    headers.set("X-Locale", locale);
  }
  return fetch(url, {
    ...rest,
    credentials: "include",
    headers: {
      ...(rest.body ? { "Content-Type": "application/json" } : {}),
      ...(cartToken ? { "X-Cart-Token": cartToken } : {}),
      ...headers,
    },
  });
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
