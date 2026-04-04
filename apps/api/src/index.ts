import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";

import { onError } from "./lib/error.js";
import { getEnv } from "./lib/env.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { cartRouter } from "./modules/cart/cart.routes.js";
import { catalogRouter } from "./modules/catalog/catalog.routes.js";
import { ordersRouter } from "./modules/orders/orders.routes.js";
import { userRouter } from "./modules/user/user.routes.js";
import { favoritesRouter } from "./modules/favorites/favorites.routes.js";
import { promotionsRouter } from "./modules/promotions/promotions.routes.js";

// Validate env early
getEnv();

const app = new Hono();

app.onError(onError);

app.use(
  "*",
  cors({
    origin: getEnv().CORS_ORIGIN,
    allowHeaders: ["Content-Type", "Authorization", "Cookie", "X-Cart-Token"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  }),
);

app.get("/health", (c) => c.json({ ok: true }));

const api = new Hono();
api.route("/", authRouter);
api.route("/", userRouter);
api.route("/", catalogRouter);
api.route("/", promotionsRouter);
api.route("/", cartRouter);
api.route("/", ordersRouter);
api.route("/", favoritesRouter);

app.route("/api", api);

const env = getEnv();
const port = env.PORT;

serve({
  fetch: app.fetch,
  port,
});

console.log(`API listening on http://localhost:${port}`);
