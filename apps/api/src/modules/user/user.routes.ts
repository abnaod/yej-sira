import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

import { auth } from "../auth/auth";
import { getUserById } from "./service";

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
