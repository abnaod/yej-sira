import type { Context, MiddlewareHandler } from "hono";
import { HTTPException } from "hono/http-exception";

import { auth } from "../../modules/auth/auth";
import { logger } from "../logger";

/**
 * Simple fixed-window rate limiter (in-memory).
 *
 * Good enough for single-instance deploys. For multi-instance deploys,
 * replace with a Redis-backed implementation.
 */
type Bucket = { count: number; resetAt: number };

function createStore() {
  const buckets = new Map<string, Bucket>();
  let lastSweep = Date.now();

  return {
    hit(key: string, limit: number, windowMs: number): { allowed: boolean; retryAfter: number } {
      const now = Date.now();
      // Opportunistic cleanup every minute.
      if (now - lastSweep > 60_000) {
        for (const [k, v] of buckets) {
          if (v.resetAt <= now) buckets.delete(k);
        }
        lastSweep = now;
      }
      const existing = buckets.get(key);
      if (!existing || existing.resetAt <= now) {
        buckets.set(key, { count: 1, resetAt: now + windowMs });
        return { allowed: true, retryAfter: 0 };
      }
      existing.count += 1;
      if (existing.count > limit) {
        return { allowed: false, retryAfter: Math.ceil((existing.resetAt - now) / 1000) };
      }
      return { allowed: true, retryAfter: 0 };
    },
  };
}

const store = createStore();

export type RateLimitKeyStrategy = "ip" | "user" | "session";

export type RateLimitOptions = {
  /** Hard upper bound per window. */
  limit: number;
  /** Rolling window in milliseconds. */
  windowMs: number;
  /** How to partition the key. */
  keyBy?: RateLimitKeyStrategy;
  /** Human-readable bucket tag (included in 429 headers and logs). */
  name: string;
  /**
   * When set, only these HTTP methods consume the limit (case-insensitive).
   * Other methods skip rate limiting. Omit to limit all methods.
   */
  methods?: string[];
};

function getClientIp(c: Context): string {
  const forwarded = c.req.header("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  const real = c.req.header("x-real-ip");
  if (real) return real;
  // Fallback: the platform/host may attach a connection address; best-effort unknown.
  return "unknown";
}

async function deriveKey(
  c: Context,
  strategy: RateLimitKeyStrategy,
  name: string,
): Promise<string> {
  const ip = getClientIp(c);
  if (strategy === "ip") return `${name}:ip:${ip}`;
  if (strategy === "session") {
    const token = c.req.header("x-cart-token") ?? c.req.header("cookie") ?? "";
    return `${name}:session:${ip}:${token.slice(0, 64)}`;
  }
  // "user": require a session; fall back to ip when anonymous.
  try {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    const id = session?.user?.id;
    if (id) return `${name}:user:${id}`;
  } catch {
    /* ignore */
  }
  return `${name}:ip:${ip}`;
}

export function rateLimit(opts: RateLimitOptions): MiddlewareHandler {
  return async (c, next) => {
    if (opts.methods?.length) {
      const method = c.req.method.toUpperCase();
      const scoped = opts.methods.map((m) => m.toUpperCase());
      if (!scoped.includes(method)) {
        await next();
        return;
      }
    }
    const strategy: RateLimitKeyStrategy = opts.keyBy ?? "ip";
    const key = await deriveKey(c, strategy, opts.name);
    const { allowed, retryAfter } = store.hit(key, opts.limit, opts.windowMs);
    if (!allowed) {
      logger.warn("rate_limit.exceeded", { bucket: opts.name, key });
      c.res.headers.set("Retry-After", String(retryAfter));
      throw new HTTPException(429, { message: "Too many requests" });
    }
    await next();
  };
}
