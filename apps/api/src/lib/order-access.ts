import { createHmac, timingSafeEqual } from "node:crypto";

import { getEnv } from "./env";

/**
 * HMAC-signed tokens for guest order access.
 *
 * Lets a guest buyer view the order they just placed (and any link sent via
 * the confirmation email) without signing in. The token is opaque to the
 * client and verified server-side in `/orders/by-token/:token`.
 *
 * Format: base64url(payloadJson).base64url(sig)
 *   payloadJson = `{"orderId":"...","email":"lowercased","exp":epochMs}`
 *   sig         = HMAC-SHA256(payloadJson, BETTER_AUTH_SECRET)
 *
 * We bind the email into the signed payload so a leaked order id can't be
 * combined with a guessed token to view the order. JSON encoding (vs a
 * delimiter) keeps us safe from dots in the email (e.g. `foo.bar@x.com`).
 */

const DEFAULT_TTL_MS = 90 * 24 * 60 * 60 * 1000; // 90 days

function b64url(input: Buffer | string): string {
  const buf = typeof input === "string" ? Buffer.from(input, "utf8") : input;
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function b64urlDecode(input: string): Buffer {
  const pad = input.length % 4 === 0 ? "" : "=".repeat(4 - (input.length % 4));
  return Buffer.from(input.replace(/-/g, "+").replace(/_/g, "/") + pad, "base64");
}

function sign(payload: string): string {
  const secret = getEnv().BETTER_AUTH_SECRET;
  return b64url(createHmac("sha256", secret).update(payload).digest());
}

type Payload = {
  orderId: string;
  email: string;
  exp: number;
};

export function signOrderAccess(
  orderId: string,
  email: string,
  ttlMs: number = DEFAULT_TTL_MS,
): string {
  const payload: Payload = {
    orderId,
    email: email.trim().toLowerCase(),
    exp: Date.now() + ttlMs,
  };
  const payloadJson = JSON.stringify(payload);
  const sig = sign(payloadJson);
  return `${b64url(payloadJson)}.${sig}`;
}

export type VerifiedOrderAccess = {
  orderId: string;
  email: string;
  expiresAt: number;
};

export function verifyOrderAccess(token: string): VerifiedOrderAccess | null {
  if (!token || typeof token !== "string") return null;

  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payloadB64, sigB64] = parts;

  let payloadJson: string;
  try {
    payloadJson = b64urlDecode(payloadB64).toString("utf8");
  } catch {
    return null;
  }

  const expected = sign(payloadJson);
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(sigB64, "utf8");
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  let parsed: Partial<Payload>;
  try {
    parsed = JSON.parse(payloadJson) as Partial<Payload>;
  } catch {
    return null;
  }
  const { orderId, email, exp } = parsed;
  if (typeof orderId !== "string" || !orderId) return null;
  if (typeof email !== "string" || !email) return null;
  if (typeof exp !== "number" || !Number.isFinite(exp)) return null;
  if (Date.now() > exp) return null;

  return { orderId, email, expiresAt: exp };
}
