import "./load-env.js";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { cors } from "hono/cors";

import { onError } from "./lib/error";
import { getBrowserOrigins, getEnv } from "./lib/env";
import { logger } from "./lib/logger";
import { initSentry } from "./lib/sentry";
import { prisma } from "./lib/db";
import { localeMiddleware } from "./lib/middleware/locale";
import { rateLimit } from "./lib/middleware/rate-limit";
import { requestLogger } from "./lib/middleware/request-logger";
import { adminRouter } from "./modules/admin/admin.routes";
import { authRouter } from "./modules/auth/auth.routes";
import { cartRouter } from "./modules/cart/cart.routes";
import { catalogRouter } from "./modules/catalog/catalog.routes";
import { ordersRouter } from "./modules/orders/orders.routes";
import { userRouter } from "./modules/user/user.routes";
import { favoritesRouter } from "./modules/favorites/favorites.routes";
import { promotionsRouter } from "./modules/promotions/promotions.routes";
import { shopsRouter } from "./modules/shops/shops.routes";
import { sellerRouter } from "./modules/seller/seller.routes";
import { paymentsRouter } from "./modules/payments/payments.routes";
import { seoRouter } from "./modules/seo/seo.routes";
import { uploadsRouter } from "./modules/uploads/uploads.routes";

// Validate env early
getEnv();

// Best-effort Sentry init (no-op when DSN is unset or @sentry/node isn't installed).
void initSentry();

const app = new Hono();

app.onError(onError);
app.use("*", requestLogger);

const corsOrigins = getBrowserOrigins();
if (getEnv().NODE_ENV === "production" && corsOrigins.length === 0) {
  throw new Error("CORS_ORIGIN must resolve to at least one origin in production");
}

app.use(
  "*",
  cors({
    origin: corsOrigins,
    allowHeaders: [
      "Content-Type",
      "Authorization",
      "Cookie",
      "X-Cart-Token",
      "X-Locale",
      "X-Request-Id",
      "x-chapa-signature",
      "chapa-signature",
    ],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  }),
);

app.get("/health", (c) => c.json({ ok: true }));

app.route("/", seoRouter);

/** Readiness probe. Checks DB connectivity so orchestrators don't send traffic to a broken instance. */
app.get("/ready", async (c) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return c.json({ ready: true });
  } catch (err) {
    logger.error("ready.db_ping_failed", {
      err: err instanceof Error ? err.message : String(err),
    });
    return c.json({ ready: false }, 503);
  }
});

/**
 * Static assets (category, listing, shop images) live in `<repo>/public` and are
 * served under `/static/*`. `@hono/node-server/serve-static` requires the root
 * to be expressed relative to `process.cwd()`, so we resolve the repo-level
 * folder from this file's location and translate it to a relative path.
 */
const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(moduleDir, "../../../public");
const publicRootRelative = path.relative(process.cwd(), publicDir) || ".";

app.use(
  "/static/*",
  serveStatic({
    root: publicRootRelative,
    rewriteRequestPath: (requestPath) => requestPath.replace(/^\/static/, ""),
  }),
);

const api = new Hono();
api.use("*", localeMiddleware);

api.use(
  "/auth/*",
  rateLimit({ name: "auth", limit: 20, windowMs: 60_000, keyBy: "ip" }),
);
api.use(
  "/payments/chapa/initialize",
  rateLimit({ name: "payments.init", limit: 5, windowMs: 60_000, keyBy: "user" }),
);
api.use(
  "/uploads",
  rateLimit({ name: "uploads", limit: 20, windowMs: 60 * 60 * 1000, keyBy: "user" }),
);
api.use(
  "/uploads/*",
  rateLimit({ name: "uploads", limit: 20, windowMs: 60 * 60 * 1000, keyBy: "user" }),
);
api.use(
  "/cart/promo",
  rateLimit({ name: "cart.promo", limit: 10, windowMs: 60_000, keyBy: "session" }),
);
api.use(
  "/listings/*/reviews",
  rateLimit({ name: "reviews", limit: 5, windowMs: 60 * 60 * 1000, keyBy: "user" }),
);

api.route("/", authRouter);
api.route("/", userRouter);
api.route("/", catalogRouter);
api.route("/", promotionsRouter);
api.route("/", cartRouter);
api.route("/", ordersRouter);
api.route("/", favoritesRouter);
api.route("/", shopsRouter);
api.route("/", sellerRouter);
api.route("/", paymentsRouter);
api.route("/", uploadsRouter);
api.route("/", adminRouter);

app.route("/api", api);

const env = getEnv();
const port = env.PORT;

serve({
  fetch: app.fetch,
  port,
});

logger.info("api.started", { port });
