import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";

export function onError(err: Error, c: Context) {
  const status = err instanceof HTTPException ? err.status : 500;
  const message =
    typeof process !== "undefined" && process.env.NODE_ENV === "development"
      ? err.message
      : status === 500
        ? "Internal Server Error"
        : err.message;

  return c.json(
    {
      error: message,
      ...(process.env.NODE_ENV === "development" && err.stack ? { stack: err.stack } : {}),
    },
    status,
  );
}
