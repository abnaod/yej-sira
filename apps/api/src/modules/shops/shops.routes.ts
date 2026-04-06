import type { Shop } from "@prisma/client";
import type { Locale } from "@ys/intl";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

import { prisma, publicProductVisibilityWhere } from "../../lib/db";
import { getOwnedShop, requireUserId } from "../../lib/authz";
import { getProductCardInclude, mapProductCard } from "../catalog/product-card.mapper";
import { createShopBodySchema, publicShopProductsQuerySchema } from "./shops.schema";

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
    businessLegalName: shop.businessLegalName,
    businessTaxId: shop.businessTaxId,
    businessAddressLine1: shop.businessAddressLine1,
    businessAddressLine2: shop.businessAddressLine2,
    businessCity: shop.businessCity,
    businessPostalCode: shop.businessPostalCode,
    businessCountry: shop.businessCountry,
    createdAt: shop.createdAt.toISOString(),
    updatedAt: shop.updatedAt.toISOString(),
  };
}

/** Must be registered before `/shops/:slug` or `me` is captured as a slug. */
shopsRouter.get("/shops/me", async (c) => {
  const userId = await requireUserId(c);
  const shop = await getOwnedShop(userId);
  if (!shop) {
    throw new HTTPException(404, { message: "No shop" });
  }
  return c.json({ shop: jsonShopForOwner(shop) });
});

shopsRouter.get("/shops/:slug", async (c) => {
  const locale = c.get("locale") as Locale;
  const slug = c.req.param("slug");
  const q = publicShopProductsQuerySchema.safeParse({
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
    ...publicProductVisibilityWhere,
  };

  const [total, products] = await prisma.$transaction([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      include: getProductCardInclude(now, locale),
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
    products: products.map((p) => mapProductCard(p, locale)),
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
      businessLegalName: d.businessLegalName,
      businessTaxId: d.businessTaxId,
      businessAddressLine1: d.businessAddressLine1,
      businessAddressLine2: d.businessAddressLine2,
      businessCity: d.businessCity,
      businessPostalCode: d.businessPostalCode,
      businessCountry: d.businessCountry,
      ownerUserId: userId,
      // No admin moderation UI yet — new shops go live immediately.
      status: "active",
    },
  });

  return c.json({ shop: jsonShopForOwner(shop) });
});
