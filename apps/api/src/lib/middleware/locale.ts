import type { MiddlewareHandler } from "hono";

import { resolveRequestLocale } from "@ys/intl";

export const localeMiddleware: MiddlewareHandler = async (c, next) => {
  const locale = resolveRequestLocale(
    c.req.header("X-Locale"),
    c.req.header("Accept-Language"),
  );
  c.set("locale", locale);
  await next();
};
