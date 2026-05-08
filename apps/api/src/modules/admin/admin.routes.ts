import { ContentLocale, type OrderStatus, Prisma, type ShopStatus } from "@prisma/client";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

import { requireAdminUserId } from "../../lib/auth";
import { prisma } from "../../lib/db";
import { toNumber } from "../../lib/money";
import {
  createCategorySchema,
  createAdminShopSchema,
  createPromoCodeSchema,
  createPromotionSchema,
  listQuerySchema,
  patchCategorySchema,
  patchListingSchema,
  patchOrderSchema,
  patchPromoCodeSchema,
  patchPromotionSchema,
  patchShopStatusSchema,
  patchUserSchema,
} from "./admin.schema";

export const adminRouter = new Hono();

/** All admin routes require `role = "admin"`. */
adminRouter.use("/admin/*", async (c, next) => {
  await requireAdminUserId(c);
  await next();
});

function parseListQuery(c: { req: { query: (k: string) => string | undefined } }) {
  const parsed = listQuerySchema.safeParse({
    page: c.req.query("page"),
    pageSize: c.req.query("pageSize"),
    q: c.req.query("q"),
  });
  if (!parsed.success) {
    throw new HTTPException(400, { message: "Invalid query" });
  }
  return parsed.data;
}

// ---------------------------------------------------------------------------
// Platform stats (admin dashboard)
// ---------------------------------------------------------------------------

adminRouter.get("/admin/stats", async (c) => {
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - 30);
  since.setUTCHours(0, 0, 0, 0);

  const [
    userCount,
    shopCount,
    pendingShopCount,
    listingCount,
    publishedListingCount,
    orderCount,
    orders30d,
    recentOrders,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.shop.count(),
    prisma.shop.count({ where: { status: "pending" } }),
    prisma.listing.count(),
    prisma.listing.count({ where: { isPublished: true } }),
    prisma.order.count(),
    prisma.order.findMany({
      where: { createdAt: { gte: since } },
      select: { id: true, createdAt: true, total: true, status: true },
    }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        createdAt: true,
        status: true,
        total: true,
        user: { select: { id: true, email: true, name: true } },
      },
    }),
  ]);

  let revenue30d = 0;
  const ordersByDayMap = new Map<string, number>();
  for (const o of orders30d) {
    if (o.status === "paid" || o.status === "fulfilled") {
      revenue30d += toNumber(o.total);
    }
    const day = o.createdAt.toISOString().slice(0, 10);
    ordersByDayMap.set(day, (ordersByDayMap.get(day) ?? 0) + 1);
  }

  const ordersByDay: { date: string; orders: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setUTCHours(0, 0, 0, 0);
    d.setUTCDate(d.getUTCDate() - i);
    const date = d.toISOString().slice(0, 10);
    ordersByDay.push({ date, orders: ordersByDayMap.get(date) ?? 0 });
  }

  return c.json({
    userCount,
    shopCount,
    pendingShopCount,
    listingCount,
    publishedListingCount,
    orderCount,
    orders30dCount: orders30d.length,
    revenue30d,
    ordersByDay,
    recentOrders: recentOrders.map((o) => ({
      id: o.id,
      createdAt: o.createdAt.toISOString(),
      status: o.status,
      total: toNumber(o.total),
      user: o.user ? { id: o.user.id, email: o.user.email, name: o.user.name } : null,
    })),
  });
});

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

adminRouter.get("/admin/users", async (c) => {
  const { page, pageSize, q } = parseListQuery(c);
  const where: Prisma.UserWhereInput = q
    ? {
        OR: [
          { email: { contains: q, mode: "insensitive" } },
          { name: { contains: q, mode: "insensitive" } },
        ],
      }
    : {};

  const [total, rows] = await prisma.$transaction([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        image: true,
        role: true,
        createdAt: true,
        _count: { select: { orders: true } },
        ownedShop: { select: { id: true, slug: true, name: true, status: true } },
      },
    }),
  ]);

  return c.json({
    users: rows.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      emailVerified: u.emailVerified,
      image: u.image,
      role: u.role,
      orderCount: u._count.orders,
      shop: u.ownedShop,
      createdAt: u.createdAt.toISOString(),
    })),
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  });
});

adminRouter.patch("/admin/users/:id", async (c) => {
  const adminId = await requireAdminUserId(c);
  const id = c.req.param("id");
  const body = await c.req.json().catch(() => null);
  const parsed = patchUserSchema.safeParse(body);
  if (!parsed.success) {
    throw new HTTPException(400, { message: "Invalid body" });
  }
  const target = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true },
  });
  if (!target) {
    throw new HTTPException(404, { message: "User not found" });
  }

  // Never let the last admin demote themselves — leaves the system with no admin.
  if (
    parsed.data.role &&
    parsed.data.role !== "admin" &&
    target.role === "admin"
  ) {
    const adminCount = await prisma.user.count({ where: { role: "admin" } });
    if (adminCount <= 1) {
      throw new HTTPException(400, {
        message: "Cannot demote the last admin",
      });
    }
    if (target.id === adminId) {
      throw new HTTPException(400, {
        message: "You cannot demote yourself",
      });
    }
  }

  const updated = await prisma.user.update({
    where: { id },
    data: {
      ...(parsed.data.role != null ? { role: parsed.data.role } : {}),
    },
    select: { id: true, role: true, email: true },
  });
  return c.json({ user: updated });
});

// ---------------------------------------------------------------------------
// Shops
// ---------------------------------------------------------------------------

adminRouter.get("/admin/shops", async (c) => {
  const { page, pageSize, q } = parseListQuery(c);
  const statusParam = c.req.query("status");
  const where: Prisma.ShopWhereInput = {
    ...(statusParam && ["pending", "active", "rejected", "suspended"].includes(statusParam)
      ? { status: statusParam as ShopStatus }
      : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { slug: { contains: q, mode: "insensitive" } },
            { contactEmail: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [total, rows] = await prisma.$transaction([
    prisma.shop.count({ where }),
    prisma.shop.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        slug: true,
        name: true,
        imageUrl: true,
        status: true,
        contactEmail: true,
        contactPhone: true,
        businessType: true,
        createdAt: true,
        owner: { select: { id: true, name: true, email: true } },
        _count: { select: { listings: true } },
      },
    }),
  ]);

  return c.json({
    shops: rows.map((s) => ({
      id: s.id,
      slug: s.slug,
      name: s.name,
      imageUrl: s.imageUrl,
      status: s.status,
      contactEmail: s.contactEmail,
      contactPhone: s.contactPhone,
      businessType: s.businessType,
      listingCount: s._count.listings,
      owner: s.owner,
      createdAt: s.createdAt.toISOString(),
    })),
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  });
});

adminRouter.get("/admin/shops/:id", async (c) => {
  const id = c.req.param("id");
  const shop = await prisma.shop.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      _count: { select: { listings: true } },
    },
  });
  if (!shop) {
    throw new HTTPException(404, { message: "Shop not found" });
  }
  return c.json({ shop });
});

adminRouter.post("/admin/shops", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = createAdminShopSchema.safeParse(body);
  if (!parsed.success) {
    throw new HTTPException(400, { message: "Invalid body" });
  }
  const d = parsed.data;

  let ownerUserId: string | undefined;
  if (d.ownerEmail) {
    const owner = await prisma.user.findUnique({
      where: { email: d.ownerEmail },
      select: { id: true, ownedShop: { select: { id: true } } },
    });
    if (!owner) {
      throw new HTTPException(400, { message: "Owner email does not match a user" });
    }
    if (owner.ownedShop) {
      throw new HTTPException(400, { message: "Owner already has a shop" });
    }
    ownerUserId = owner.id;
  }

  try {
    const shop = await prisma.shop.create({
      data: {
        name: d.name,
        slug: d.slug,
        ownerUserId,
        status: d.status,
        description: d.description,
        imageUrl: d.imageUrl,
        contactEmail: d.contactEmail,
        contactPhone: d.contactPhone,
        businessType: d.businessType,
        listingsLimit: d.listingsLimit,
        onboardingCompletedAt: new Date(),
      },
      select: { id: true, slug: true, name: true, status: true },
    });
    return c.json({ shop }, 201);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new HTTPException(400, { message: "Shop slug or owner is already in use" });
    }
    throw err;
  }
});

adminRouter.patch("/admin/shops/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json().catch(() => null);
  const parsed = patchShopStatusSchema.safeParse(body);
  if (!parsed.success) {
    throw new HTTPException(400, { message: "Invalid body" });
  }
  const shop = await prisma.shop.findUnique({ where: { id }, select: { id: true } });
  if (!shop) {
    throw new HTTPException(404, { message: "Shop not found" });
  }
  const updated = await prisma.shop.update({
    where: { id },
    data: { status: parsed.data.status },
    select: { id: true, status: true },
  });
  return c.json({ shop: updated });
});

// ---------------------------------------------------------------------------
// Listings
// ---------------------------------------------------------------------------

adminRouter.get("/admin/listings", async (c) => {
  const { page, pageSize, q } = parseListQuery(c);
  const where: Prisma.ListingWhereInput = q
    ? {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { slug: { contains: q, mode: "insensitive" } },
          { shop: { name: { contains: q, mode: "insensitive" } } },
        ],
      }
    : {};

  const [total, rows] = await prisma.$transaction([
    prisma.listing.count({ where }),
    prisma.listing.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
        shop: { select: { id: true, slug: true, name: true, status: true } },
        category: { select: { id: true, slug: true, name: true } },
        variants: { select: { price: true } },
      },
    }),
  ]);

  return c.json({
    listings: rows.map((l) => {
      const minPrice = l.variants.length
        ? Math.min(...l.variants.map((v) => toNumber(v.price)))
        : 0;
      return {
        id: l.id,
        slug: l.slug,
        name: l.name,
        isPublished: l.isPublished,
        featured: l.featured,
        priceFrom: minPrice,
        imageUrl: l.images[0]?.url ?? "",
        shop: l.shop,
        category: l.category,
        updatedAt: l.updatedAt.toISOString(),
      };
    }),
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  });
});

adminRouter.patch("/admin/listings/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json().catch(() => null);
  const parsed = patchListingSchema.safeParse(body);
  if (!parsed.success) {
    throw new HTTPException(400, { message: "Invalid body" });
  }
  const existing = await prisma.listing.findUnique({ where: { id }, select: { id: true } });
  if (!existing) {
    throw new HTTPException(404, { message: "Listing not found" });
  }
  const updated = await prisma.listing.update({
    where: { id },
    data: {
      ...(parsed.data.isPublished != null ? { isPublished: parsed.data.isPublished } : {}),
      ...(parsed.data.featured != null ? { featured: parsed.data.featured } : {}),
    },
    select: { id: true, isPublished: true, featured: true },
  });
  return c.json({ listing: updated });
});

adminRouter.delete("/admin/listings/:id", async (c) => {
  const id = c.req.param("id");
  const existing = await prisma.listing.findUnique({ where: { id }, select: { id: true } });
  if (!existing) {
    throw new HTTPException(404, { message: "Listing not found" });
  }
  await prisma.listing.delete({ where: { id } });
  return c.json({ ok: true });
});

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

adminRouter.get("/admin/orders", async (c) => {
  const { page, pageSize, q } = parseListQuery(c);
  const statusParam = c.req.query("status");
  const where: Prisma.OrderWhereInput = {
    ...(statusParam &&
    ["pending", "awaiting_payment", "paid", "fulfilled", "cancelled"].includes(statusParam)
      ? { status: statusParam as OrderStatus }
      : {}),
    ...(q
      ? {
          OR: [
            { id: { contains: q, mode: "insensitive" } },
            { user: { email: { contains: q, mode: "insensitive" } } },
            { user: { name: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const [total, rows] = await prisma.$transaction([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        status: true,
        total: true,
        createdAt: true,
        user: { select: { id: true, name: true, email: true } },
        _count: { select: { items: true } },
      },
    }),
  ]);

  return c.json({
    orders: rows.map((o) => ({
      id: o.id,
      status: o.status,
      total: toNumber(o.total),
      createdAt: o.createdAt.toISOString(),
      user: o.user,
      itemCount: o._count.items,
    })),
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  });
});

adminRouter.get("/admin/orders/:id", async (c) => {
  const id = c.req.param("id");
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { orderBy: { id: "asc" } },
      payment: true,
      pickupLocation: true,
      user: { select: { id: true, name: true, email: true } },
    },
  });
  if (!order) {
    throw new HTTPException(404, { message: "Order not found" });
  }
  return c.json({
    order: {
      id: order.id,
      status: order.status,
      subtotal: toNumber(order.subtotal),
      shipping: toNumber(order.shipping),
      tax: toNumber(order.tax),
      total: toNumber(order.total),
      deliveryMethod: order.deliveryMethod,
      pickupLocation: order.pickupLocation,
      shippingAddress: {
        city: order.shippingCity,
        subcity: order.shippingSubcity,
        woreda: order.shippingWoreda,
        kebele: order.shippingKebele,
        specificLocation: order.shippingSpecificLocation,
      },
      user: order.user,
      payment: order.payment
        ? {
            status: order.payment.status,
            method: order.payment.paymentMethod,
            amount: toNumber(order.payment.amount),
            txRef: order.payment.txRef,
          }
        : null,
      items: order.items.map((i) => ({
        id: i.id,
        listingId: i.listingId,
        listingName: i.listingName,
        variantLabel: i.variantLabel,
        unitPrice: toNumber(i.unitPrice),
        quantity: i.quantity,
        imageUrl: i.imageUrl,
      })),
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    },
  });
});

adminRouter.patch("/admin/orders/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json().catch(() => null);
  const parsed = patchOrderSchema.safeParse(body);
  if (!parsed.success) {
    throw new HTTPException(400, { message: "Invalid body" });
  }
  const existing = await prisma.order.findUnique({ where: { id }, select: { id: true } });
  if (!existing) {
    throw new HTTPException(404, { message: "Order not found" });
  }
  const updated = await prisma.order.update({
    where: { id },
    data: { status: parsed.data.status },
    select: { id: true, status: true },
  });
  return c.json({ order: updated });
});

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

adminRouter.get("/admin/categories", async (c) => {
  const { page, pageSize, q } = parseListQuery(c);
  const qTrim = q?.trim();
  const where: Prisma.CategoryWhereInput = qTrim
    ? {
        OR: [
          { name: { contains: qTrim, mode: "insensitive" } },
          { slug: { contains: qTrim, mode: "insensitive" } },
        ],
      }
    : {};

  const [total, rows] = await prisma.$transaction([
    prisma.category.count({ where }),
    prisma.category.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        translations: true,
        _count: { select: { listings: true, attributeDefinitions: true } },
      },
    }),
  ]);

  return c.json({
    categories: rows.map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      nameAm: c.translations.find((t) => t.locale === "am")?.name ?? null,
      imageUrl: c.imageUrl,
      sortOrder: c.sortOrder,
      listingCount: c._count.listings,
      attributeDefinitionCount: c._count.attributeDefinitions,
      updatedAt: c.updatedAt.toISOString(),
    })),
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  });
});

adminRouter.post("/admin/categories", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = createCategorySchema.safeParse(body);
  if (!parsed.success) {
    throw new HTTPException(400, { message: "Invalid body" });
  }
  const d = parsed.data;
  const slugTaken = await prisma.category.findUnique({ where: { slug: d.slug } });
  if (slugTaken) {
    throw new HTTPException(400, { message: "Slug already in use" });
  }

  const created = await prisma.category.create({
    data: {
      slug: d.slug,
      name: d.name,
      imageUrl: d.imageUrl,
      sortOrder: d.sortOrder,
      ...(d.nameAm
        ? {
            translations: {
              create: { locale: ContentLocale.am, name: d.nameAm },
            },
          }
        : {}),
    },
  });
  return c.json({ category: { id: created.id, slug: created.slug } });
});

adminRouter.patch("/admin/categories/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json().catch(() => null);
  const parsed = patchCategorySchema.safeParse(body);
  if (!parsed.success) {
    throw new HTTPException(400, { message: "Invalid body" });
  }
  const existing = await prisma.category.findUnique({ where: { id }, select: { id: true, slug: true } });
  if (!existing) {
    throw new HTTPException(404, { message: "Category not found" });
  }
  const d = parsed.data;
  if (d.slug && d.slug !== existing.slug) {
    const taken = await prisma.category.findUnique({ where: { slug: d.slug } });
    if (taken) {
      throw new HTTPException(400, { message: "Slug already in use" });
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.category.update({
      where: { id },
      data: {
        ...(d.slug != null ? { slug: d.slug } : {}),
        ...(d.name != null ? { name: d.name } : {}),
        ...(d.imageUrl != null ? { imageUrl: d.imageUrl } : {}),
        ...(d.sortOrder != null ? { sortOrder: d.sortOrder } : {}),
      },
    });
    if (d.nameAm === null) {
      await tx.categoryTranslation.deleteMany({
        where: { categoryId: id, locale: ContentLocale.am },
      });
    } else if (d.nameAm !== undefined) {
      await tx.categoryTranslation.upsert({
        where: {
          categoryId_locale: {
            categoryId: id,
            locale: ContentLocale.am,
          },
        },
        create: { categoryId: id, locale: ContentLocale.am, name: d.nameAm },
        update: { name: d.nameAm },
      });
    }
  });
  return c.json({ ok: true });
});

adminRouter.delete("/admin/categories/:id", async (c) => {
  const id = c.req.param("id");
  const existing = await prisma.category.findUnique({
    where: { id },
    select: { id: true, _count: { select: { listings: true } } },
  });
  if (!existing) {
    throw new HTTPException(404, { message: "Category not found" });
  }
  if (existing._count.listings > 0) {
    throw new HTTPException(400, {
      message: "Cannot delete a category that still has listings",
    });
  }
  await prisma.category.delete({ where: { id } });
  return c.json({ ok: true });
});

// ---------------------------------------------------------------------------
// Promotions
// ---------------------------------------------------------------------------

adminRouter.get("/admin/promotions", async (c) => {
  const { page, pageSize, q } = parseListQuery(c);
  const qTrim = q?.trim();
  const where: Prisma.PromotionWhereInput = qTrim
    ? {
        OR: [
          { title: { contains: qTrim, mode: "insensitive" } },
          { slug: { contains: qTrim, mode: "insensitive" } },
        ],
      }
    : {};

  const [total, rows] = await prisma.$transaction([
    prisma.promotion.count({ where }),
    prisma.promotion.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { endsAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        translations: true,
        _count: { select: { listings: true } },
      },
    }),
  ]);

  return c.json({
    promotions: rows.map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      subtitle: p.subtitle,
      badgeLabel: p.badgeLabel,
      startsAt: p.startsAt.toISOString(),
      endsAt: p.endsAt.toISOString(),
      heroImageUrl: p.heroImageUrl,
      sortOrder: p.sortOrder,
      priority: p.priority,
      listingCount: p._count.listings,
      titleAm: p.translations.find((t) => t.locale === "am")?.title ?? null,
      subtitleAm: p.translations.find((t) => t.locale === "am")?.subtitle ?? null,
      badgeLabelAm: p.translations.find((t) => t.locale === "am")?.badgeLabel ?? null,
    })),
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  });
});

adminRouter.post("/admin/promotions", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = createPromotionSchema.safeParse(body);
  if (!parsed.success) {
    throw new HTTPException(400, { message: "Invalid body" });
  }
  const d = parsed.data;
  if (new Date(d.startsAt) >= new Date(d.endsAt)) {
    throw new HTTPException(400, { message: "startsAt must be before endsAt" });
  }
  const slugTaken = await prisma.promotion.findUnique({ where: { slug: d.slug } });
  if (slugTaken) {
    throw new HTTPException(400, { message: "Slug already in use" });
  }
  const created = await prisma.promotion.create({
    data: {
      slug: d.slug,
      title: d.title,
      subtitle: d.subtitle,
      badgeLabel: d.badgeLabel,
      startsAt: new Date(d.startsAt),
      endsAt: new Date(d.endsAt),
      heroImageUrl: d.heroImageUrl,
      sortOrder: d.sortOrder,
      priority: d.priority,
      ...(d.titleAm || d.subtitleAm || d.badgeLabelAm
        ? {
            translations: {
              create: {
                locale: ContentLocale.am,
                title: d.titleAm ?? d.title,
                subtitle: d.subtitleAm ?? d.subtitle,
                badgeLabel: d.badgeLabelAm ?? d.badgeLabel,
              },
            },
          }
        : {}),
    },
  });
  return c.json({ promotion: { id: created.id, slug: created.slug } });
});

adminRouter.patch("/admin/promotions/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json().catch(() => null);
  const parsed = patchPromotionSchema.safeParse(body);
  if (!parsed.success) {
    throw new HTTPException(400, { message: "Invalid body" });
  }
  const existing = await prisma.promotion.findUnique({
    where: { id },
    select: { id: true, slug: true, startsAt: true, endsAt: true },
  });
  if (!existing) {
    throw new HTTPException(404, { message: "Promotion not found" });
  }
  const d = parsed.data;
  const nextStarts = d.startsAt ? new Date(d.startsAt) : existing.startsAt;
  const nextEnds = d.endsAt ? new Date(d.endsAt) : existing.endsAt;
  if (nextStarts >= nextEnds) {
    throw new HTTPException(400, { message: "startsAt must be before endsAt" });
  }
  if (d.slug && d.slug !== existing.slug) {
    const taken = await prisma.promotion.findUnique({ where: { slug: d.slug } });
    if (taken) {
      throw new HTTPException(400, { message: "Slug already in use" });
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.promotion.update({
      where: { id },
      data: {
        ...(d.slug != null ? { slug: d.slug } : {}),
        ...(d.title != null ? { title: d.title } : {}),
        ...(d.subtitle != null ? { subtitle: d.subtitle } : {}),
        ...(d.badgeLabel != null ? { badgeLabel: d.badgeLabel } : {}),
        ...(d.startsAt != null ? { startsAt: new Date(d.startsAt) } : {}),
        ...(d.endsAt != null ? { endsAt: new Date(d.endsAt) } : {}),
        ...(d.heroImageUrl != null ? { heroImageUrl: d.heroImageUrl } : {}),
        ...(d.sortOrder != null ? { sortOrder: d.sortOrder } : {}),
        ...(d.priority != null ? { priority: d.priority } : {}),
      },
    });

    const wantsAm = d.titleAm != null || d.subtitleAm != null || d.badgeLabelAm != null;
    if (wantsAm) {
      const current = await tx.promotion.findUnique({
        where: { id },
        select: { title: true, subtitle: true, badgeLabel: true },
      });
      await tx.promotionTranslation.upsert({
        where: { promotionId_locale: { promotionId: id, locale: ContentLocale.am } },
        create: {
          promotionId: id,
          locale: ContentLocale.am,
          title: d.titleAm ?? current!.title,
          subtitle: d.subtitleAm ?? current!.subtitle,
          badgeLabel: d.badgeLabelAm ?? current!.badgeLabel,
        },
        update: {
          ...(d.titleAm != null ? { title: d.titleAm } : {}),
          ...(d.subtitleAm != null ? { subtitle: d.subtitleAm } : {}),
          ...(d.badgeLabelAm != null ? { badgeLabel: d.badgeLabelAm } : {}),
        },
      });
    }
  });
  return c.json({ ok: true });
});

adminRouter.delete("/admin/promotions/:id", async (c) => {
  const id = c.req.param("id");
  const existing = await prisma.promotion.findUnique({ where: { id }, select: { id: true } });
  if (!existing) {
    throw new HTTPException(404, { message: "Promotion not found" });
  }
  await prisma.promotion.delete({ where: { id } });
  return c.json({ ok: true });
});

// ---------------------------------------------------------------------------
// Promo codes (admin CRUD)
// ---------------------------------------------------------------------------

function serializePromoCode(p: {
  id: string;
  code: string;
  description: string | null;
  discountPercent: number | null;
  discountAmount: Prisma.Decimal | null;
  minSubtotal: Prisma.Decimal | null;
  maxRedemptions: number | null;
  perUserLimit: number | null;
  redemptions: number;
  validFrom: Date | null;
  validUntil: Date | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: p.id,
    code: p.code,
    description: p.description,
    discountPercent: p.discountPercent,
    discountAmount: p.discountAmount != null ? toNumber(p.discountAmount) : null,
    minSubtotal: p.minSubtotal != null ? toNumber(p.minSubtotal) : null,
    maxRedemptions: p.maxRedemptions,
    perUserLimit: p.perUserLimit,
    redemptions: p.redemptions,
    validFrom: p.validFrom?.toISOString() ?? null,
    validUntil: p.validUntil?.toISOString() ?? null,
    active: p.active,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

adminRouter.get("/admin/promo-codes", async (c) => {
  const { page, pageSize, q } = parseListQuery(c);
  const where: Prisma.PromoCodeWhereInput = q
    ? { code: { contains: q.toUpperCase() } }
    : {};
  const [total, rows] = await prisma.$transaction([
    prisma.promoCode.count({ where }),
    prisma.promoCode.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);
  return c.json({
    promoCodes: rows.map(serializePromoCode),
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  });
});

adminRouter.post("/admin/promo-codes", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = createPromoCodeSchema.safeParse(body);
  if (!parsed.success) {
    throw new HTTPException(400, { message: "Invalid body" });
  }
  const d = parsed.data;
  try {
    const created = await prisma.promoCode.create({
      data: {
        code: d.code,
        description: d.description ?? null,
        discountPercent: d.discountPercent ?? null,
        discountAmount: d.discountAmount != null ? new Prisma.Decimal(d.discountAmount) : null,
        minSubtotal: d.minSubtotal != null ? new Prisma.Decimal(d.minSubtotal) : null,
        maxRedemptions: d.maxRedemptions ?? null,
        perUserLimit: d.perUserLimit ?? null,
        validFrom: d.validFrom ? new Date(d.validFrom) : null,
        validUntil: d.validUntil ? new Date(d.validUntil) : null,
        active: d.active,
      },
    });
    return c.json({ promoCode: serializePromoCode(created) });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new HTTPException(400, { message: "Promo code already exists" });
    }
    throw err;
  }
});

adminRouter.patch("/admin/promo-codes/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json().catch(() => null);
  const parsed = patchPromoCodeSchema.safeParse(body);
  if (!parsed.success) {
    throw new HTTPException(400, { message: "Invalid body" });
  }
  const existing = await prisma.promoCode.findUnique({ where: { id } });
  if (!existing) {
    throw new HTTPException(404, { message: "Promo code not found" });
  }
  const d = parsed.data;
  const updated = await prisma.promoCode.update({
    where: { id },
    data: {
      ...(d.code != null ? { code: d.code } : {}),
      ...(d.description !== undefined ? { description: d.description ?? null } : {}),
      ...(d.discountPercent !== undefined ? { discountPercent: d.discountPercent ?? null } : {}),
      ...(d.discountAmount !== undefined
        ? { discountAmount: d.discountAmount != null ? new Prisma.Decimal(d.discountAmount) : null }
        : {}),
      ...(d.minSubtotal !== undefined
        ? { minSubtotal: d.minSubtotal != null ? new Prisma.Decimal(d.minSubtotal) : null }
        : {}),
      ...(d.maxRedemptions !== undefined ? { maxRedemptions: d.maxRedemptions ?? null } : {}),
      ...(d.perUserLimit !== undefined ? { perUserLimit: d.perUserLimit ?? null } : {}),
      ...(d.validFrom !== undefined ? { validFrom: d.validFrom ? new Date(d.validFrom) : null } : {}),
      ...(d.validUntil !== undefined ? { validUntil: d.validUntil ? new Date(d.validUntil) : null } : {}),
      ...(d.active !== undefined ? { active: d.active } : {}),
    },
  });
  return c.json({ promoCode: serializePromoCode(updated) });
});

adminRouter.delete("/admin/promo-codes/:id", async (c) => {
  const id = c.req.param("id");
  const existing = await prisma.promoCode.findUnique({ where: { id }, select: { id: true } });
  if (!existing) {
    throw new HTTPException(404, { message: "Promo code not found" });
  }
  await prisma.promoCode.delete({ where: { id } });
  return c.json({ ok: true });
});
