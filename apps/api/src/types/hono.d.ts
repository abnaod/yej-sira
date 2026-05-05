import type { Locale } from "@ys/intl";
import type { PublicStorefrontShop } from "../lib/middleware/storefront-tenant";

declare module "hono" {
  interface ContextVariableMap {
    locale: Locale;
    storefrontShop: PublicStorefrontShop | null;
  }
}
