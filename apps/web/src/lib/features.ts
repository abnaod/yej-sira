/**
 * Web feature flags (Vite: `VITE_FEATURE_*` must be set at build time to take effect in production).
 */
const env = import.meta.env as Record<string, string | boolean | undefined>;

function envBool(
  key: "VITE_FEATURE_CONVERSATIONS" | "VITE_FEATURE_CART_CHECKOUT",
  defaultValue: boolean,
): boolean {
  const v = env[key];
  if (v === "true" || v === true) return true;
  if (v === "false" || v === false) return false;
  return defaultValue;
}

/** In-app listing ↔ shop messaging (default: on). */
export const featureConversations: boolean = envBool("VITE_FEATURE_CONVERSATIONS", true);

/**
 * Classic cart, checkout, Chapa, orders UI (default: off; enable for rollback).
 * When false, cart/checkout/orders/payments routes and nav are hidden/redirected.
 */
export const featureCartCheckout: boolean = envBool("VITE_FEATURE_CART_CHECKOUT", false);
