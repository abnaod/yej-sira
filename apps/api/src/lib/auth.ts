import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";

import { prisma } from "./db";
import { auth } from "../modules/auth/auth";

export async function getSessionUserId(c: Context): Promise<string | null> {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  return session?.user?.id ?? null;
}

export async function requireUserId(c: Context): Promise<string> {
  const id = await getSessionUserId(c);
  if (!id) {
    throw new HTTPException(401, { message: "Unauthorized" });
  }
  return id;
}

/**
 * Asserts the current session belongs to a user with `role = "admin"`.
 * Returns the admin user id so handlers can use it for audit purposes.
 * Role lives on `User.role` (see `libs/db/prisma/schema.prisma`) and is not
 * surfaced through Better Auth's session cookie cache — we always re-read it
 * from the DB so revoking admin takes effect on the next request.
 */
export async function requireAdminUserId(c: Context): Promise<string> {
  const userId = await requireUserId(c);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user || user.role !== "admin") {
    throw new HTTPException(403, { message: "Admin access required" });
  }
  return userId;
}
