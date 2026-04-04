import type { Locale } from "@ys/intl";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

import { prisma, publicProductVisibilityWhere } from "../../lib/db";
import {
  assertSellerCanManageShop,
  getOwnedShop,
  requireAdminUserId,
  requireUserId,
} from "../../lib/authz";
import { getProductCardInclude, mapProductCard } from "../catalog/product-card.mapper";
import {
  adminCreateShopBodySchema,
  adminPatchShopBodySchema,
  adminShopListQuerySchema,
  createShopBodySchema,
  publicShopProductsQuerySchema,
} from "./shops.schema";

export const shopsRouter = new Hono();

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

  const { name, slug, description } = parsed.data;

  const shop = await prisma.shop.create({
    data: {
      name,
      slug,
      description,
      ownerUserId: userId,
      status: "pending",
    },
  });

  return c.json({
    shop: {
      id: shop.id,
      slug: shop.slug,
      name: shop.name,
      description: shop.description,
      status: shop.status,
    },
  });
});

shopsRouter.get("/shops/me", async (c) => {
  const userId = await requireUserId(c);
  const shop = await getOwnedShop(userId);
  if (!shop) {
    throw new HTTPException(404, { message: "No shop" });
  }
  return c.json({
    shop: {
      id: shop.id,
      slug: shop.slug,
      name: shop.name,
      description: shop.description,
      imageUrl: shop.imageUrl,
      status: shop.status,
      createdAt: shop.createdAt.toISOString(),
      updatedAt: shop.updatedAt.toISOString(),
    },
  });
});

shopsRouter.get("/admin/shops", async (c) => {
  await requireAdminUserId(c);
  const q = adminShopListQuerySchema.safeParse({
    status: c.req.query("status") ?? undefined,
  });
  if (!q.success) {
    throw new HTTPException(400, { message: "Invalid query" });
  }

  const shops = await prisma.shop.findMany({
    where: q.data.status ? { status: q.data.status } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      owner: {
        select: { id: true, name: true, email: true },
      },
      _count: { select: { products: true } },
    },
  });

  return c.json({
    shops: shops.map((s) => ({
      id: s.id,
      slug: s.slug,
      name: s.name,
      description: s.description,
      imageUrl: s.imageUrl,
      status: s.status,
      owner: s.owner,
      productCount: s._count.products,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    })),
  });
});

shopsRouter.post("/admin/shops", async (c) => {
  await requireAdminUserId(c);
  const body = await c.req.json().catch(() => null);
  const parsed = adminCreateShopBodySchema.safeParse(body);
  if (!parsed.success) {
    throw new HTTPException(400, { message: "Invalid body" });
  }

  const { ownerUserId, name, slug, description, status } = parsed.data;

  const owner = await prisma.user.findUnique({ where: { id: ownerUserId } });
  if (!owner) {
    throw new HTTPException(400, { message: "Owner user not found" });
  }

  const taken = await prisma.shop.findUnique({ where: { ownerUserId } });
  if (taken) {
    throw new HTTPException(400, { message: "User already has a shop" });
  }

  const shop = await prisma.shop.create({
    data: {
      ownerUserId,
      name,
      slug,
      description,
      status: status ?? "active",
    },
  });

  return c.json({
    shop: {
      id: shop.id,
      slug: shop.slug,
      name: shop.name,
      status: shop.status,
    },
  });
});

shopsRouter.patch("/admin/shops/:id", async (c) => {
  await requireAdminUserId(c);
  const id = c.req.param("id");
  const body = await c.req.json().catch(() => null);
  const parsed = adminPatchShopBodySchema.safeParse(body);
  if (!parsed.success) {
    throw new HTTPException(400, { message: "Invalid body" });
  }

  const shop = await prisma.shop.findUnique({ where: { id } });
  if (!shop) {
    throw new HTTPException(404, { message: "Shop not found" });
  }

  const updated = await prisma.shop.update({
    where: { id },
    data: {
      ...(parsed.data.status != null ? { status: parsed.data.status } : {}),
      ...(parsed.data.name != null ? { name: parsed.data.name } : {}),
      ...(parsed.data.description !== undefined ? { description: parsed.data.description } : {}),
      ...(parsed.data.imageUrl !== undefined ? { imageUrl: parsed.data.imageUrl } : {}),
    },
  });

  return c.json({
    shop: {
      id: updated.id,
      slug: updated.slug,
      name: updated.name,
      status: updated.status,
      description: updated.description,
      imageUrl: updated.imageUrl,
    },
  });
});
