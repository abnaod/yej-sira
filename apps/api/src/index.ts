import "./load-env.js";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { cors } from "hono/cors";

import { onError } from "./lib/error";
import { getEnv, isAllowedBrowserOrigin } from "./lib/env";
import { localeMiddleware } from "./lib/middleware/locale";
import { storefrontTenantMiddleware } from "./lib/middleware/storefront-tenant";
import { adminRouter } from "./modules/admin/admin.routes";
import { authRouter } from "./modules/auth/auth.routes";
import { cartRouter } from "./modules/cart/cart.routes";
import { catalogRouter } from "./modules/catalog/catalog.routes";
import { ordersRouter } from "./modules/orders/orders.routes";
import { userRouter } from "./modules/user/user.routes";
import { favoritesRouter } from "./modules/favorites/favorites.routes";
import { promotionsRouter } from "./modules/promotions/promotions.routes";
import { shopsRouter } from "./modules/shops/shops.routes";
import { storefrontRouter } from "./modules/storefront/storefront.routes";
import { sellerRouter } from "./modules/seller/seller.routes";
import { paymentsRouter } from "./modules/payments/payments.routes";
import { uploadsRouter } from "./modules/uploads/uploads.routes";

// Validate env early
getEnv();

const app = new Hono();

app.onError(onError);

app.use(
  "*",
  cors({
    origin: (origin) => (isAllowedBrowserOrigin(origin) ? origin : undefined),
    allowHeaders: [
      "Content-Type",
      "Authorization",
      "Cookie",
      "X-Cart-Token",
      "X-Locale",
      "X-Shop-Slug",
      "X-Storefront-Host",
      "x-chapa-signature",
      "chapa-signature",
    ],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  }),
);

app.get("/health", (c) => c.json({ ok: true }));

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
api.use("*", storefrontTenantMiddleware);
api.route("/", authRouter);
api.route("/", storefrontRouter);
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

console.log(`API listening on http://localhost:${port}`);
