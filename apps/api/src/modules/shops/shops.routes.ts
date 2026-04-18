import type { Shop } from "@prisma/client";
import type { Locale } from "@ys/intl";
import type { Context } from "hono";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

import { prisma, publicListingVisibilityWhere } from "../../lib/db";
import { requireUserId } from "../../lib/auth";
import { getOwnedShop } from "./shops.authz";
import { getListingCardInclude, mapListingCard } from "../catalog/catalog.mappers";
import { createShopBodySchema, publicShopListingsQuerySchema } from "./shops.schema";

export const shopsRouter = new Hono();

function jsonShopForOwner(shop: Shop) {
  return {
    id: shop.id,
    slug: shop.slug,
    name: shop.name,
    description: shop.description,
    imageUrl: shop.imageUrl,
    status: shop.status,
    contactEmail: shop.contactEmail,
    contactPhone: shop.contactPhone,
    socialLinks: shop.socialLinks,
    shippingPolicy: shop.shippingPolicy,
    returnsPolicy: shop.returnsPolicy,
    businessType: shop.businessType,
    businessLegalName: shop.businessLegalName,
    businessTaxId: shop.businessTaxId,
    businessCity: shop.businessCity,
    businessSubcity: shop.businessSubcity,
    businessWoreda: shop.businessWoreda,
    businessKebele: shop.businessKebele,
    businessHouseNumber: shop.businessHouseNumber,
    businessSpecificLocation: shop.businessSpecificLocation,
    createdAt: shop.createdAt.toISOString(),
    updatedAt: shop.updatedAt.toISOString(),
  };
}

/** Must be registered before `/shops/:slug` or `me` is captured as a slug. */
async function shopsMeHandler(c: Context) {
  const userId = await requireUserId(c);
  const shop = await getOwnedShop(userId);
  if (!shop) {
    return c.json({ shop: null });
  }
  return c.json({ shop: jsonShopForOwner(shop) });
}

shopsRouter.get("/shops/me", shopsMeHandler);
/** Some clients/proxies normalize with a trailing slash; without this, `/shops/me/` 404s. */
shopsRouter.get("/shops/me/", shopsMeHandler);

shopsRouter.get("/shops/:slug", async (c) => {
  const locale = c.get("locale") as Locale;
  const slug = c.req.param("slug");
  const q = publicShopListingsQuerySchema.safeParse({
    page: c.req.query("page"),
    pageSize: c.req.query("pageSize"),
  });
  if (!q.success) {
    throw new HTTPException(400, { message: "Invalid query" });
  }
  const { page, pageSize } = q.data;

  const shop = await prisma.shop.findFirst({
    where: { slug, status: "active" },
  });
  if (!shop) {
    throw new HTTPException(404, { message: "Shop not found" });
  }

  const now = new Date();
  const where = {
    shopId: shop.id,
    ...publicListingVisibilityWhere,
  };

  const [total, listings] = await prisma.$transaction([
    prisma.listing.count({ where }),
    prisma.listing.findMany({
      where,
      include: getListingCardInclude(now, locale),
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return c.json({
    shop: {
      id: shop.id,
      slug: shop.slug,
      name: shop.name,
      description: shop.description,
      imageUrl: shop.imageUrl,
    },
    listings: listings.map((p) => mapListingCard(p, locale)),
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  });
});

shopsRouter.post("/shops", async (c) => {
  const userId = await requireUserId(c);
  const existing = await getOwnedShop(userId);
  if (existing) {
    throw new HTTPException(400, { message: "You already have a shop" });
  }

  const body = await c.req.json().catch(() => null);
  const parsed = createShopBodySchema.safeParse(body);
  if (!parsed.success) {
    throw new HTTPException(400, { message: "Invalid body" });
  }

  const d = parsed.data;

  const shop = await prisma.shop.create({
    data: {
      name: d.name,
      slug: d.slug,
      description: d.description,
      imageUrl: d.imageUrl,
      contactEmail: d.contactEmail,
      contactPhone: d.contactPhone,
      socialLinks: d.socialLinks,
      shippingPolicy: d.shippingPolicy,
      returnsPolicy: d.returnsPolicy,
      businessType: d.businessType,
      businessLegalName: d.businessLegalName,
      businessTaxId: d.businessTaxId,
      businessCity: d.businessCity,
      businessSubcity: d.businessSubcity,
      businessWoreda: d.businessWoreda,
      businessKebele: d.businessKebele,
      businessHouseNumber: d.businessHouseNumber,
      businessSpecificLocation: d.businessSpecificLocation,
      ownerUserId: userId,
      // No admin moderation UI yet — new shops go live immediately.
      status: "active",
    },
  });

  return c.json({ shop: jsonShopForOwner(shop) });
});
