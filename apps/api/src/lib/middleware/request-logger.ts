import type { MiddlewareHandler } from "hono";
import { randomUUID } from "crypto";

import { logger } from "../logger";

/**
 * Attach a request id, log one structured line per request with status + duration.
 * The request id is also echoed in the `X-Request-Id` response header so clients
 * and error reports can reference it.
 */
export const requestLogger: MiddlewareHandler = async (c, next) => {
  const started = Date.now();
  const incoming = c.req.header("x-request-id");
  const requestId = incoming && /^[A-Za-z0-9-_]{6,128}$/.test(incoming) ? incoming : randomUUID();
  c.set("requestId" as never, requestId as never);

  try {
    await next();
  } finally {
    const duration = Date.now() - started;
    c.res.headers.set("X-Request-Id", requestId);
    logger.info("http", {
      id: requestId,
      method: c.req.method,
      path: c.req.path,
      status: c.res.status,
      durationMs: duration,
    });
  }
};
