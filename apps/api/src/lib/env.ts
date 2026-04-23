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
  CORS_ORIGIN: z.string().url().default("http://localhost:5000"),
  /** Google OAuth (optional). Enable when both are set. */
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  /** Chapa payment gateway */
  CHAPA_SECRET_KEY: z.string().min(1),
  CHAPA_WEBHOOK_SECRET: z.string().optional(),
  CHAPA_BASE_URL: z.string().url().default("https://api.chapa.co"),
  PUBLIC_WEB_URL: z.string().url().default("http://localhost:5000"),
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
