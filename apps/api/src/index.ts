import "./load-env.js";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";

import { onError } from "./lib/error";
import { getEnv } from "./lib/env";
import { localeMiddleware } from "./middleware/locale";
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

// Validate env early
getEnv();

const app = new Hono();

app.onError(onError);

app.use(
  "*",
  cors({
    origin: getEnv().CORS_ORIGIN,
    allowHeaders: ["Content-Type", "Authorization", "Cookie", "X-Cart-Token", "X-Locale", "x-chapa-signature", "chapa-signature"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  }),
);

app.get("/health", (c) => c.json({ ok: true }));

const api = new Hono();
api.use("*", localeMiddleware);
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

app.route("/api", api);

const env = getEnv();
const port = env.PORT;

serve({
  fetch: app.fetch,
  port,
});

console.log(`API listening on http://localhost:${port}`);
