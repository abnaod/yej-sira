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
