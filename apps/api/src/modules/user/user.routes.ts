import { randomUUID } from "node:crypto";

import { hashPassword } from "better-auth/crypto";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";

import { prisma } from "../../lib/db";
import { auth } from "../auth/auth";
import { getUserById } from "./user.service";

export const userRouter = new Hono();

userRouter.get("/users/me", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user) {
    throw new HTTPException(401, { message: "Unauthorized" });
  }

  const user = await getUserById(session.user.id);
  if (!user) {
    throw new HTTPException(404, { message: "User not found" });
  }

  return c.json({ user });
});

const changePasswordSchema = z.object({
  newPassword: z.string().min(8).max(256),
});

userRouter.post("/users/me/password", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user) {
    throw new HTTPException(401, { message: "Unauthorized" });
  }

  const body = await c.req.json().catch(() => null);
  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) {
    throw new HTTPException(400, { message: "Invalid body" });
  }

  const now = new Date();
  const passwordHash = await hashPassword(parsed.data.newPassword);
  const account = await prisma.account.findFirst({
    where: { userId: session.user.id, providerId: "credential" },
    select: { id: true },
  });

  if (account) {
    await prisma.account.update({
      where: { id: account.id },
      data: { password: passwordHash, updatedAt: now },
    });
  } else {
    await prisma.account.create({
      data: {
        id: randomUUID(),
        accountId: session.user.id,
        providerId: "credential",
        userId: session.user.id,
        password: passwordHash,
        createdAt: now,
        updatedAt: now,
      },
    });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { mustChangePassword: false, emailVerified: true },
  });

  return c.json({ ok: true });
});
