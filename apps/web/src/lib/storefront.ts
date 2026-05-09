const DEFAULT_RESERVED_SUBDOMAINS = [
  "www",
  "api",
  "admin",
  "seller",
  "mail",
  "cdn",
  "assets",
  "staging",
  "dev",
  "localhost",
];

export type PublicStorefrontShop = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  socialLinks: unknown;
  shippingPolicy: string | null;
  returnsPolicy: string | null;
};

export type StorefrontHostContext = {
  isStorefront: boolean;
  shopSlug: string | null;
  host: string | null;
};

export function normalizeHost(raw: string | null | undefined): string {
  const first = (raw ?? "")
    .trim()
    .toLowerCase()
    .split(",")[0]
    ?.trim();
  return (first ?? "")
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/:\d+$/, "")
    .replace(/\.$/, "");
}

/**
 * Infer marketplace / shop-subdomain base from the request host when VITE_* env
 * is absent (e.g. production image built without bake args). `shop.example.com`
 * → `example.com`; apex `example.com` unchanged; `shop.localhost` → `localhost`.
 */
export function inferRegistrarBaseDomainFromHost(hostInput: string | null | undefined): string {
  const host = normalizeHost(hostInput);
  if (!host) return "";
  if (host === "localhost" || host === "127.0.0.1") return host;
  if (host.endsWith(".localhost")) return "localhost";
  const parts = host.split(".");
  if (parts.length >= 3) return parts.slice(1).join(".");
  return host;
}

export function isValidShopSlug(slug: string) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

export function getMarketplaceHost() {
  const fromEnv = normalizeHost(import.meta.env.VITE_MARKETPLACE_HOST as string | undefined);
  if (fromEnv) return fromEnv;
  if (typeof window === "undefined") return "";
  return inferRegistrarBaseDomainFromHost(window.location.host);
}

export function getShopSubdomainBaseDomain() {
  return (
    normalizeHost(import.meta.env.VITE_SHOP_SUBDOMAIN_BASE_DOMAIN as string | undefined) ||
    getMarketplaceHost()
  );
}

export function getReservedSubdomains() {
  const raw = (import.meta.env.VITE_RESERVED_SHOP_SUBDOMAINS as string | undefined)?.trim();
  const values = raw ? raw.split(",") : DEFAULT_RESERVED_SUBDOMAINS;
  return new Set(values.map((x) => x.trim().toLowerCase()).filter(Boolean));
}

export function resolveStorefrontHost(hostInput: string | null | undefined): StorefrontHostContext {
  const host = normalizeHost(hostInput);
  if (!host) return { isStorefront: false, shopSlug: null, host: null };

  const reserved = getReservedSubdomains();
  const baseFromEnv = normalizeHost(import.meta.env.VITE_SHOP_SUBDOMAIN_BASE_DOMAIN as string | undefined);
  const marketplaceFromEnv = normalizeHost(import.meta.env.VITE_MARKETPLACE_HOST as string | undefined);
  const inferred = inferRegistrarBaseDomainFromHost(host);
  const base = baseFromEnv || marketplaceFromEnv || inferred;
  const marketplaceHost = marketplaceFromEnv || inferred;
  const devSlug = (import.meta.env.VITE_STOREFRONT_DEV_SHOP_SLUG as string | undefined)
    ?.trim()
    .toLowerCase();

  let shopSlug: string | null = null;

  if (base && host.endsWith(`.${base}`) && host !== base && host !== marketplaceHost) {
    shopSlug = host.slice(0, -(`.${base}`).length);
  } else if (host.endsWith(".localhost")) {
    shopSlug = host.slice(0, -".localhost".length);
  } else if ((host === "localhost" || host === "127.0.0.1") && devSlug) {
    shopSlug = devSlug;
  }

  if (!shopSlug || !isValidShopSlug(shopSlug) || reserved.has(shopSlug)) {
    return { isStorefront: false, shopSlug: null, host };
  }

  return { isStorefront: true, shopSlug, host };
}

export function getBrowserStorefrontContext(): StorefrontHostContext {
  if (typeof window === "undefined") {
    return { isStorefront: false, shopSlug: null, host: null };
  }

  const fromQuery = new URLSearchParams(window.location.search).get("shop");
  if (fromQuery && isValidShopSlug(fromQuery) && !getReservedSubdomains().has(fromQuery)) {
    return {
      isStorefront: true,
      shopSlug: fromQuery,
      host: window.location.host,
    };
  }

  return resolveStorefrontHost(window.location.host);
}

export function generatedStorefrontUrl(shopSlug: string, locale?: string) {
  const base = getShopSubdomainBaseDomain();
  if (!base) return `/${locale ?? "en"}`;
  const protocol =
    import.meta.env.PROD || base !== "localhost"
      ? "https:"
      : typeof window !== "undefined"
        ? window.location.protocol
        : "http:";
  const port =
    !import.meta.env.PROD && typeof window !== "undefined" && base === "localhost"
      ? window.location.port
        ? `:${window.location.port}`
        : ""
      : "";
  const path = locale ? `/${locale}` : "";
  return `${protocol}//${shopSlug}.${base}${port}${path}`;
}

export function marketplaceUrl(path = "") {
  const host = getMarketplaceHost();
  if (!host) return path || "/";
  const protocol =
    import.meta.env.PROD || host !== "localhost"
      ? "https:"
      : typeof window !== "undefined"
        ? window.location.protocol
        : "http:";
  const port =
    !import.meta.env.PROD && typeof window !== "undefined" && host === "localhost"
      ? window.location.port
        ? `:${window.location.port}`
        : ""
      : "";
  return `${protocol}//${host}${port}${path}`;
}
