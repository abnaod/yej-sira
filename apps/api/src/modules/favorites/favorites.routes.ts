import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

import { prisma } from "../../lib/db.js";
import { auth } from "../auth/auth.js";
import { getProductCardInclude, mapProductCard } from "../catalog/product-card.mapper.js";
import { favoriteBodySchema } from "./favorites.schema.js";

export const favoritesRouter = new Hono();

favoritesRouter.get("/favorites", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user) {
    throw new HTTPException(401, { message: "Unauthorized" });
  }

  const now = new Date();
  const rows = await prisma.favorite.findMany({
    where: { userId: session.user.id },
    include: {
      product: { include: getProductCardInclude(now) },
    },
    orderBy: { createdAt: "desc" },
  });

  const products = rows.map((r) => mapProductCard(r.product));
  return c.json({
    products,
    slugs: products.map((p) => p.slug),
  });
});

favoritesRouter.post("/favorites", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user) {
    throw new HTTPException(401, { message: "Unauthorized" });
  }

  const body = await c.req.json().catch(() => null);
  const parsed = favoriteBodySchema.safeParse(body);
  if (!parsed.success) {
    throw new HTTPException(400, { message: "Invalid body" });
  }

  const product = await prisma.product.findUnique({
    where: { slug: parsed.data.slug },
  });
  if (!product) {
    throw new HTTPException(404, { message: "Product not found" });
  }

  const existing = await prisma.favorite.findUnique({
    where: {
      userId_productId: {
        userId: session.user.id,
        productId: product.id,
      },
    },
  });
  if (!existing) {
    await prisma.favorite.create({
      data: {
        userId: session.user.id,
        productId: product.id,
      },
    });
  }

  return c.json({ ok: true });
});

favoritesRouter.delete("/favorites/:slug", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user) {
    throw new HTTPException(401, { message: "Unauthorized" });
  }

  const slug = c.req.param("slug");
  const product = await prisma.product.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (!product) {
    throw new HTTPException(404, { message: "Product not found" });
  }

  const deleted = await prisma.favorite.deleteMany({
    where: {
      userId: session.user.id,
      productId: product.id,
    },
  });
  if (deleted.count === 0) {
    throw new HTTPException(404, { message: "Favorite not found" });
  }

  return c.json({ ok: true });
});
