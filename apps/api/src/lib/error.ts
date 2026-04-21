import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";

import { getEnv } from "./env";
import { logger } from "./logger";
import { captureException } from "./sentry";

export function onError(err: Error, c: Context) {
  const status = err instanceof HTTPException ? err.status : 500;
  const isDev = getEnv().NODE_ENV === "development";
  const message = isDev
    ? err.message
    : status === 500
      ? "Internal Server Error"
      : err.message;

  if (status >= 500) {
    logger.error("http.unhandled", {
      path: c.req.path,
      method: c.req.method,
      message: err.message,
      stack: err.stack,
    });
    captureException(err);
  }

  return c.json(
    {
      error: message,
      ...(isDev && err.stack ? { stack: err.stack } : {}),
    },
    status,
  );
}
