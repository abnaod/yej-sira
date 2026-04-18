import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

import { prisma, publicListingVisibilityWhere } from "../../lib/db";
import { auth } from "../auth/auth";
import { getListingCardInclude, mapListingCard } from "../catalog/catalog.mappers";
import { favoriteBodySchema } from "./favorites.schema";

export const favoritesRouter = new Hono();

favoritesRouter.get("/favorites", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user) {
    throw new HTTPException(401, { message: "Unauthorized" });
  }

  const locale = c.get("locale");
  const now = new Date();
  const rows = await prisma.favorite.findMany({
    where: {
      userId: session.user.id,
      listing: publicListingVisibilityWhere,
    },
    include: {
      listing: { include: getListingCardInclude(now, locale) },
    },
    orderBy: { createdAt: "desc" },
  });

  const listings = rows.map((r) => mapListingCard(r.listing, locale));
  return c.json({
    listings,
    slugs: listings.map((p) => p.slug),
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

  const listing = await prisma.listing.findFirst({
    where: { slug: parsed.data.slug, ...publicListingVisibilityWhere },
  });
  if (!listing) {
    throw new HTTPException(404, { message: "Listing not found" });
  }

  const existing = await prisma.favorite.findUnique({
    where: {
      userId_listingId: {
        userId: session.user.id,
        listingId: listing.id,
      },
    },
  });
  if (!existing) {
    await prisma.favorite.create({
      data: {
        userId: session.user.id,
        listingId: listing.id,
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
  const listing = await prisma.listing.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (!listing) {
    throw new HTTPException(404, { message: "Listing not found" });
  }

  const deleted = await prisma.favorite.deleteMany({
    where: {
      userId: session.user.id,
      listingId: listing.id,
    },
  });
  if (deleted.count === 0) {
    throw new HTTPException(404, { message: "Favorite not found" });
  }

  return c.json({ ok: true });
});
