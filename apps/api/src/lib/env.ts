import { z } from "zod";

/** Parse fee from env (handles quoted values and stray whitespace). */
function parseStandardDeliveryFeeEtb(raw: unknown): number {
  const fallback = 150;
  if (raw === undefined || raw === null) return fallback;
  const s = String(raw).trim().replace(/^["']|["']$/g, "");
  if (s === "") return fallback;
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return n;
}

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).optional(),
  DATABASE_URL: z.string().url(),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url(),
  PORT: z.coerce.number().default(3001),
  CORS_ORIGIN: z.string().url().default("http://localhost:3000"),
  MARKETPLACE_HOST: z.string().min(1).optional(),
  SHOP_SUBDOMAIN_BASE_DOMAIN: z.string().min(1).optional(),
  SHOP_COOKIE_DOMAIN: z.string().min(1).optional(),
  RESERVED_SHOP_SUBDOMAINS: z.string().default(
    "www,api,admin,seller,mail,cdn,assets,staging,dev,localhost",
  ),
  STOREFRONT_DEV_SHOP_SLUG: z.string().optional(),
  /** Google OAuth (optional). Enable when both are set. */
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  /** Chapa payment gateway */
  CHAPA_SECRET_KEY: z.string().min(1),
  CHAPA_WEBHOOK_SECRET: z.string().optional(),
  CHAPA_BASE_URL: z.string().url().default("https://api.chapa.co"),
  /** Flat ETB charge for standard delivery; pickup uses 0. */
  STANDARD_DELIVERY_FEE_ETB: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => parseStandardDeliveryFeeEtb(v)),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

export function getEnv(): Env {
  if (cached) return cached;
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
    throw new Error("Invalid environment variables");
  }
  cached = parsed.data;
  return cached;
}

/**
 * Browser origins allowed for CORS and Better Auth `trustedOrigins`.
 * In development, allow both `localhost` and `127.0.0.1` when the primary
 * `CORS_ORIGIN` uses either host, so OAuth from the “wrong” dev URL still works.
 */
export function getBrowserOrigins(): string[] {
  const e = getEnv();
  if (e.NODE_ENV === "production") return [e.CORS_ORIGIN];
  const out = new Set<string>([e.CORS_ORIGIN]);
  try {
    const u = new URL(e.CORS_ORIGIN);
    if (u.hostname === "localhost" || u.hostname === "127.0.0.1") {
      const otherHost = u.hostname === "localhost" ? "127.0.0.1" : "localhost";
      const portPart = u.port ? `:${u.port}` : "";
      out.add(`${u.protocol}//${otherHost}${portPart}`);
    }
  } catch {
    /* keep CORS_ORIGIN only */
  }
  return [...out];
}

export function getBetterAuthTrustedOrigins(): string[] {
  const e = getEnv();
  const origins = new Set(getBrowserOrigins());
  const protocol = e.NODE_ENV === "production" ? "https" : "http";
  const base = getShopSubdomainBaseDomain();
  origins.add(`${protocol}://*.${base}`);
  if (e.NODE_ENV !== "production") {
    origins.add("http://*.localhost:3000");
  }
  return [...origins];
}

export function getMarketplaceHost(): string {
  const e = getEnv();
  if (e.MARKETPLACE_HOST) return normalizeHost(e.MARKETPLACE_HOST);
  return normalizeHost(new URL(e.CORS_ORIGIN).host);
}

export function getShopSubdomainBaseDomain(): string {
  const e = getEnv();
  if (e.SHOP_SUBDOMAIN_BASE_DOMAIN) {
    return normalizeHost(e.SHOP_SUBDOMAIN_BASE_DOMAIN);
  }
  return getMarketplaceHost();
}

export function getReservedShopSubdomains(): Set<string> {
  const e = getEnv();
  return new Set(
    e.RESERVED_SHOP_SUBDOMAINS.split(",")
      .map((x) => x.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isAllowedBrowserOrigin(origin: string): boolean {
  const e = getEnv();
  if (getBrowserOrigins().includes(origin)) return true;

  let url: URL;
  try {
    url = new URL(origin);
  } catch {
    return false;
  }

  const protocolOk =
    e.NODE_ENV === "production" ? url.protocol === "https:" : url.protocol === "http:";
  if (!protocolOk) return false;

  return isGeneratedShopHost(url.host) || isDevStorefrontHost(url.host);
}

export function isReservedShopSlug(slug: string): boolean {
  return getReservedShopSubdomains().has(slug.toLowerCase());
}

export function isGeneratedShopHost(rawHost: string): boolean {
  const host = normalizeHost(rawHost);
  const base = getShopSubdomainBaseDomain();
  if (host === base || host === getMarketplaceHost()) return false;
  const suffix = `.${base}`;
  if (!host.endsWith(suffix)) return false;
  const slug = host.slice(0, -suffix.length);
  return isValidShopSubdomainSlug(slug) && !isReservedShopSlug(slug);
}

export function isDevStorefrontHost(rawHost: string): boolean {
  const host = normalizeHost(rawHost);
  if (host === "localhost" || host === "127.0.0.1") return Boolean(getEnv().STOREFRONT_DEV_SHOP_SLUG);
  if (!host.endsWith(".localhost")) return false;
  const slug = host.slice(0, -".localhost".length);
  return isValidShopSubdomainSlug(slug) && !isReservedShopSlug(slug);
}

export function shopSlugFromHost(rawHost: string): string | null {
  const host = normalizeHost(rawHost);
  const base = getShopSubdomainBaseDomain();
  const suffix = `.${base}`;
  if (host.endsWith(suffix)) {
    const slug = host.slice(0, -suffix.length);
    return isValidShopSubdomainSlug(slug) && !isReservedShopSlug(slug) ? slug : null;
  }
  if (host.endsWith(".localhost")) {
    const slug = host.slice(0, -".localhost".length);
    return isValidShopSubdomainSlug(slug) && !isReservedShopSlug(slug) ? slug : null;
  }
  if (host === "localhost" || host === "127.0.0.1") {
    const slug = getEnv().STOREFRONT_DEV_SHOP_SLUG?.trim();
    return slug && isValidShopSubdomainSlug(slug) && !isReservedShopSlug(slug) ? slug : null;
  }
  return null;
}

export function normalizeHost(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/:\d+$/, "")
    .replace(/\.$/, "");
}

export function isValidShopSubdomainSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}
