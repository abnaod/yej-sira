import type { Locale } from "@ys/intl";

declare module "hono" {
  interface ContextVariableMap {
    locale: Locale;
  }
}
