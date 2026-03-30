import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";

import { onError } from "./lib/error.js";
import { getEnv } from "./lib/env.js";
import { authRouter } from "./modules/auth/routes.js";
import { userRouter } from "./modules/user/routes.js";

// Validate env early
getEnv();

const app = new Hono();

app.onError(onError);

app.use(
  "*",
  cors({
    origin: getEnv().CORS_ORIGIN,
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  }),
);

app.get("/health", (c) => c.json({ ok: true }));

const api = new Hono();
api.route("/", authRouter);
api.route("/", userRouter);

app.route("/api", api);

const env = getEnv();
const port = env.PORT;

serve({
  fetch: app.fetch,
  port,
});

console.log(`API listening on http://localhost:${port}`);
