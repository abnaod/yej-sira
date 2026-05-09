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

/**
 * Treat empty-string env values as absent so optional fields work even when
 * deploy surfaces (docker-compose, systemd, etc.) pass `FOO=""` for unset vars.
 */
const rawEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).optional(),
  DATABASE_URL: z.string().url(),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url(),
  PORT: z.coerce.number().default(5001),
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
  /** Facebook Login (optional). */
  FACEBOOK_CLIENT_ID: z.string().optional(),
  FACEBOOK_CLIENT_SECRET: z.string().optional(),
  /**
   * better-auth-telegram: bot token and username; OIDC client secret from BotFather Web Login.
   * Redirect: `BETTER_AUTH_URL` + `/api/auth/callback/telegram-oidc` (e.g. register in @BotFather).
   */
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  /** Bot @handle without the @ (e.g. my_shop_bot) */
  TELEGRAM_BOT_USERNAME: z.string().optional(),
  /** OIDC client ID from BotFather Web Login. Defaults to the numeric bot token prefix when omitted. */
  TELEGRAM_OIDC_CLIENT_ID: z.string().optional(),
  /** OIDC client secret from BotFather Web Login — not the bot token. */
  TELEGRAM_OIDC_CLIENT_SECRET: z.string().optional(),
  /** Optional secret token Telegram sends in `X-Telegram-Bot-Api-Secret-Token` for webhook calls. */
  TELEGRAM_WEBHOOK_SECRET: z.string().optional(),
  /** Chapa payment gateway */
  CHAPA_SECRET_KEY: z.string().min(1),
  CHAPA_WEBHOOK_SECRET: z.string().optional(),
  CHAPA_BASE_URL: z.string().url().default("https://api.chapa.co"),
  PUBLIC_WEB_URL: z.string().url().default("http://localhost:3000"),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),
  EMAIL_FROM_NAME: z.string().min(1).optional(),
  REQUIRE_EMAIL_VERIFICATION: z.coerce.boolean().default(false),
  SENTRY_DSN: z.string().url().optional(),
  VITE_SENTRY_DSN: z.string().url().optional(),
  S3_ENDPOINT: z.string().url().optional(),
  S3_BUCKET: z.string().optional(),
  S3_REGION: z.string().default("auto"),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  CDN_BASE_URL: z.string().url().optional(),
  /** Flat ETB charge for standard delivery; pickup uses 0. */
  STANDARD_DELIVERY_FEE_ETB: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => parseStandardDeliveryFeeEtb(v)),
});

const envSchema = z.preprocess((raw) => {
  if (!raw || typeof raw !== "object") return raw;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    out[k] = v === "" ? undefined : v;
  }
  return out;
}, rawEnvSchema);

export type Env = z.infer<typeof rawEnvSchema>;

let cached: Env | null = null;

function addOriginWithLoopbackPair(out: Set<string>, origin: string | undefined) {
  if (!origin) return;
  out.add(origin);
  try {
    const u = new URL(origin);
    if (u.hostname === "localhost" || u.hostname === "127.0.0.1") {
      const otherHost = u.hostname === "localhost" ? "127.0.0.1" : "localhost";
      const portPart = u.port ? `:${u.port}` : "";
      out.add(`${u.protocol}//${otherHost}${portPart}`);
    }
  } catch {
    /* keep the original value only */
  }
}

export function getEnv(): Env {
  if (cached) return cached;
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
    throw new Error("Invalid environment variables");
  }
  if (parsed.data.NODE_ENV === "production") {
    if (!parsed.data.CORS_ORIGIN) {
      throw new Error("CORS_ORIGIN is required in production");
    }
    if (!parsed.data.CHAPA_WEBHOOK_SECRET) {
      throw new Error("CHAPA_WEBHOOK_SECRET is required in production");
    }
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

  const out = new Set<string>();
  addOriginWithLoopbackPair(out, e.CORS_ORIGIN);
  addOriginWithLoopbackPair(out, e.PUBLIC_WEB_URL);

  // Local Vite defaults stay trusted even when dev env values point at an
  // external tunnel for OAuth callback testing.
  addOriginWithLoopbackPair(out, "http://localhost:3000");

  for (const port of ["3000", "5000"]) {
    out.add(`http://localhost:${port}`);
    out.add(`http://127.0.0.1:${port}`);
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
    origins.add("http://*.localhost:5000");
  }
  return [...origins];
}

export function getMarketplaceHost(): string {
  const env = getEnv();
  if (env.MARKETPLACE_HOST) return normalizeHost(env.MARKETPLACE_HOST);
  return normalizeHost(new URL(env.CORS_ORIGIN).host);
}

export function getShopSubdomainBaseDomain(): string {
  const env = getEnv();
  if (env.SHOP_SUBDOMAIN_BASE_DOMAIN) {
    return normalizeHost(env.SHOP_SUBDOMAIN_BASE_DOMAIN);
  }
  return getMarketplaceHost();
}

export function getReservedShopSubdomains(): Set<string> {
  const env = getEnv();
  return new Set(
    env.RESERVED_SHOP_SUBDOMAINS.split(",")
      .map((x) => x.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isAllowedBrowserOrigin(origin: string | undefined): boolean {
  if (!origin) return false;
  const env = getEnv();
  if (getBrowserOrigins().includes(origin)) return true;

  let url: URL;
  try {
    url = new URL(origin);
  } catch {
    return false;
  }

  const protocolOk =
    env.NODE_ENV === "production" ? url.protocol === "https:" : url.protocol === "http:";
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

export function isStorefrontLauncherHost(rawHost: string): boolean {
  const host = normalizeHost(rawHost);
  if (host === getMarketplaceHost()) return true;
  try {
    return host === normalizeHost(new URL(getEnv().PUBLIC_WEB_URL).host);
  } catch {
    return false;
  }
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
  const first = raw.trim().toLowerCase().split(",")[0]?.trim() ?? "";
  return first
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/:\d+$/, "")
    .replace(/\.$/, "");
}

export function isValidShopSubdomainSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

export function getTelegramMiniAppUrl(shopSlug: string): string | null {
  const username = getEnv().TELEGRAM_BOT_USERNAME?.trim().replace(/^@/, "");
  if (!username || !isValidShopSubdomainSlug(shopSlug)) return null;
  return `https://t.me/${encodeURIComponent(username)}?startapp=${encodeURIComponent(shopSlug)}`;
}

export function getTelegramMiniAppLauncherUrl(shopSlug?: string): string | null {
  const base = getEnv().PUBLIC_WEB_URL.replace(/\/$/, "");
  if (!shopSlug) return `${base}/tg`;
  if (!isValidShopSubdomainSlug(shopSlug)) return null;
  const search = new URLSearchParams({ shop: shopSlug });
  return `${base}/tg?${search.toString()}`;
}
