import { ContentLocale, Prisma } from "@prisma/client";
import type { Locale } from "@ys/intl";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

import { requireUserId } from "../../lib/auth";
import { prisma } from "../../lib/db";
import {
  assertSellerCanManageShop,
  assertShopActiveForPublish,
  getOwnedShop,
} from "../shops/shops.authz";
import { tryActivateShopIfOnboardingComplete } from "../shops/shops.onboarding";
import {
  getListingDetailInclude,
  minVariantPrice,
} from "../catalog/catalog.mappers";
import {
  pickCategoryName,
  pickListingDescription,
  pickListingName,
  pickVariantLabel,
} from "../catalog/catalog.localize";
import { pickPromotionForListing } from "../promotions/promotions.utils";
import { toNumber } from "../../lib/money";
import { getSellerMessageMetrics } from "../conversations/conversations.service";
import {
  mapListingAttributeValuesForDetail,
  serializeListingAttributeValuesForSeller,
  validateListingAttributeInputs,
} from "../catalog/category-attributes";
import { z } from "zod";

import { listQuerySchema } from "../admin/admin.schema";
import {
  sellerListingCreateSchema,
  sellerListingPatchSchema,
  sellerListingStockUpdateSchema,
} from "./seller.schema";

/** Threshold (inclusive) used to flag a variant as "low stock" for the seller UI. */
const LOW_STOCK_THRESHOLD = 5;

const stockStatusSchema = z.enum(["all", "in_stock", "low_stock", "out_of_stock"]);
type StockStatus = z.infer<typeof stockStatusSchema>;

const sellerListingsListQuerySchema = listQuerySchema.extend({
  stockStatus: stockStatusSchema.optional(),
});

export const sellerRouter = new Hono();

function parseSellerListQuery(c: { req: { query: (k: string) => string | undefined } }) {
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

function parseSellerListingsQuery(c: {
  req: { query: (k: string) => string | undefined };
}) {
  const parsed = sellerListingsListQuerySchema.safeParse({
    page: c.req.query("page"),
    pageSize: c.req.query("pageSize"),
    q: c.req.query("q"),
    stockStatus: c.req.query("stockStatus"),
  });
  if (!parsed.success) {
    throw new HTTPException(400, { message: "Invalid query" });
  }
  return parsed.data;
}

function stockStatusWhere(status: StockStatus | undefined): Prisma.ListingWhereInput {
  switch (status) {
    case "out_of_stock":
      return {
        variants: { some: {} },
        NOT: { variants: { some: { stock: { gt: 0 } } } },
      };
    case "in_stock":
      return { variants: { some: { stock: { gt: 0 } } } };
    case "low_stock":
      return {
        variants: { some: { stock: { gt: 0, lte: LOW_STOCK_THRESHOLD } } },
      };
    case "all":
    case undefined:
    default:
      return {};
  }
}

async function resolveCategoryId(
  categorySlug: string | undefined,
  categoryId: string | undefined,
): Promise<string> {
  if (categoryId) {
    const c = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!c) throw new HTTPException(400, { message: "Category not found" });
    return c.id;
  }
  if (categorySlug) {
    const c = await prisma.category.findUnique({ where: { slug: categorySlug } });
    if (!c) throw new HTTPException(400, { message: "Category not found" });
    return c.id;
  }
  throw new HTTPException(400, { message: "Category required" });
}

async function assertTagSlugsExist(tagSlugs: string[]): Promise<void> {
  const found = await prisma.tag.findMany({
    where: { slug: { in: tagSlugs } },
    select: { slug: true },
  });
  if (found.length !== tagSlugs.length) {
    throw new HTTPException(400, { message: "One or more tags not found" });
  }
}

sellerRouter.get("/seller/dashboard", async (c) => {
  const userId = await requireUserId(c);
  const shop = await getOwnedShop(userId);
  if (!shop) {
    throw new HTTPException(404, { message: "No shop" });
  }
  assertSellerCanManageShop(shop, userId);

  const shopListingIds = await prisma.listing.findMany({
    where: { shopId: shop.id },
    select: { id: true },
  });
  const ids = shopListingIds.map((p) => p.id);

  const [listingCount, publishedCount] = await Promise.all([
    prisma.listing.count({ where: { shopId: shop.id } }),
    prisma.listing.count({ where: { shopId: shop.id, isPublished: true } }),
  ]);

  if (ids.length === 0) {
    const ordersByDay: { date: string; orders: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setUTCHours(0, 0, 0, 0);
      d.setUTCDate(d.getUTCDate() - i);
      ordersByDay.push({ date: d.toISOString().slice(0, 10), orders: 0 });
    }
    return c.json({
      listingCount,
      publishedCount,
      revenue30d: 0,
      orders30d: 0,
      ordersByDay,
    });
  }

  const since = new Date();
  since.setUTCDate(since.getUTCDate() - 30);
  since.setUTCHours(0, 0, 0, 0);

  const items = await prisma.orderItem.findMany({
    where: {
      listingId: { in: ids },
      order: { createdAt: { gte: since } },
    },
    select: {
      orderId: true,
      unitPrice: true,
      quantity: true,
      order: { select: { createdAt: true } },
    },
  });

  let revenue30d = 0;
  const ordersByDayMap = new Map<string, Set<string>>();
  for (const row of items) {
    revenue30d += toNumber(row.unitPrice) * row.quantity;
    const day = row.order.createdAt.toISOString().slice(0, 10);
    if (!ordersByDayMap.has(day)) ordersByDayMap.set(day, new Set());
    ordersByDayMap.get(day)!.add(row.orderId);
  }

  const orders30d = new Set(items.map((i) => i.orderId)).size;

  const ordersByDay: { date: string; orders: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setUTCHours(0, 0, 0, 0);
    d.setUTCDate(d.getUTCDate() - i);
    const date = d.toISOString().slice(0, 10);
    ordersByDay.push({
      date,
      orders: ordersByDayMap.get(date)?.size ?? 0,
    });
  }

  return c.json({
    listingCount,
    publishedCount,
    revenue30d,
    orders30d,
    ordersByDay,
  });
});

/** Conversation-first metrics: leads, reply rate, avg first-response time. */
sellerRouter.get("/seller/messages/metrics", async (c) => {
  const userId = await requireUserId(c);
  const shop = await getOwnedShop(userId);
  if (!shop) {
    throw new HTTPException(404, { message: "No shop" });
  }
  assertSellerCanManageShop(shop, userId);
  const metrics = await getSellerMessageMetrics(shop.id);
  return c.json(metrics);
});

function sellerOrderLineListingLabel(listingName: string, variantLabel: string | null): string {
  const v = variantLabel?.trim();
  return v ? `${listingName} (${v})` : listingName;
}

/** Orders that include at least one line item for this shop's listings (aggregated per order). */
sellerRouter.get("/seller/orders", async (c) => {
  const { page, pageSize, q } = parseSellerListQuery(c);
  const userId = await requireUserId(c);
  const shop = await getOwnedShop(userId);
  if (!shop) {
    throw new HTTPException(404, { message: "No shop" });
  }
  assertSellerCanManageShop(shop, userId);

  const shopListingIds = await prisma.listing.findMany({
    where: { shopId: shop.id },
    select: { id: true },
  });
  const ids = shopListingIds.map((p) => p.id);
  if (ids.length === 0) {
    return c.json({
      orders: [],
      page,
      pageSize,
      total: 0,
      totalPages: 1,
    });
  }

  const qTrim = q?.trim();
  const orderWhere: Prisma.OrderWhereInput = {
    items: { some: { listingId: { in: ids } } },
    ...(qTrim ? { id: { contains: qTrim, mode: "insensitive" } } : {}),
  };

  const [total, orderRows] = await prisma.$transaction([
    prisma.order.count({ where: orderWhere }),
    prisma.order.findMany({
      where: orderWhere,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        status: true,
        createdAt: true,
      },
    }),
  ]);

  const orderIds = orderRows.map((o) => o.id);
  if (orderIds.length === 0) {
    return c.json({
      orders: [],
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    });
  }

  const itemRows = await prisma.orderItem.findMany({
    where: {
      orderId: { in: orderIds },
      listingId: { in: ids },
    },
    orderBy: { id: "asc" },
    select: {
      orderId: true,
      listingName: true,
      variantLabel: true,
      imageUrl: true,
      unitPrice: true,
      quantity: true,
      id: true,
    },
  });

  const itemsByOrder = new Map<string, typeof itemRows>();
  for (const row of itemRows) {
    const list = itemsByOrder.get(row.orderId) ?? [];
    list.push(row);
    itemsByOrder.set(row.orderId, list);
  }

  const orders = orderRows.map((o) => {
    const lines = itemsByOrder.get(o.id) ?? [];
    const sorted = [...lines].sort((a, b) => a.id.localeCompare(b.id));
    const first = sorted[0];
    let shopTotal = 0;
    for (const li of sorted) {
      shopTotal += toNumber(li.unitPrice) * li.quantity;
    }
    return {
      id: o.id,
      status: o.status,
      createdAt: o.createdAt.toISOString(),
      lineCount: sorted.length,
      shopTotal,
      imageUrl: first?.imageUrl?.trim() ?? "",
      listingName: first
        ? sellerOrderLineListingLabel(first.listingName, first.variantLabel)
        : "",
    };
  });

  return c.json({
    orders,
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  });
});

/** Single order with only this shop's line items (for seller fulfillment). */
sellerRouter.get("/seller/orders/:orderId", async (c) => {
  const userId = await requireUserId(c);
  const shop = await getOwnedShop(userId);
  if (!shop) {
    throw new HTTPException(404, { message: "No shop" });
  }
  assertSellerCanManageShop(shop, userId);

  const orderId = c.req.param("orderId");

  const shopListingIds = await prisma.listing.findMany({
    where: { shopId: shop.id },
    select: { id: true },
  });
  const ids = shopListingIds.map((p) => p.id);
  if (ids.length === 0) {
    throw new HTTPException(404, { message: "Order not found" });
  }

  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      items: { some: { listingId: { in: ids } } },
    },
    include: {
      items: {
        where: { listingId: { in: ids } },
        orderBy: { id: "asc" },
      },
      payment: { select: { paymentMethod: true, status: true } },
      pickupLocation: {
        select: {
          id: true,
          name: true,
          line1: true,
          line2: true,
          city: true,
          postalCode: true,
          country: true,
        },
      },
    },
  });

  if (!order) {
    throw new HTTPException(404, { message: "Order not found" });
  }

  let shopSubtotal = 0;
  const items = order.items.map((i) => {
    const line = toNumber(i.unitPrice) * i.quantity;
    shopSubtotal += line;
    return {
      id: i.id,
      listingName: i.listingName,
      variantLabel: i.variantLabel,
      unitPrice: toNumber(i.unitPrice),
      quantity: i.quantity,
      imageUrl: i.imageUrl,
    };
  });

  return c.json({
    order: {
      id: order.id,
      status: order.status,
      shopSubtotal,
      deliveryMethod: order.deliveryMethod,
      pickupLocation: order.pickupLocation,
      shippingAddress: {
        city: order.shippingCity,
        subcity: order.shippingSubcity,
        woreda: order.shippingWoreda,
        kebele: order.shippingKebele,
        specificLocation: order.shippingSpecificLocation,
      },
      createdAt: order.createdAt.toISOString(),
      payment: order.payment
        ? {
            method: order.payment.paymentMethod,
            status: order.payment.status,
          }
        : null,
      items,
    },
  });
});

sellerRouter.get("/seller/listings", async (c) => {
  const { page, pageSize, q, stockStatus } = parseSellerListingsQuery(c);
  const userId = await requireUserId(c);
  const shop = await getOwnedShop(userId);
  if (!shop) {
    throw new HTTPException(404, { message: "No shop" });
  }
  assertSellerCanManageShop(shop, userId);

  const locale = c.get("locale") as Locale;
  const tr =
    locale === "en"
      ? null
      : ({
          where: { locale: locale as ContentLocale },
        } as const);

  const qTrim = q?.trim();
  const where: Prisma.ListingWhereInput = {
    shopId: shop.id,
    ...(qTrim
      ? {
          OR: [
            { name: { contains: qTrim, mode: "insensitive" } },
            { slug: { contains: qTrim, mode: "insensitive" } },
          ],
        }
      : {}),
    ...stockStatusWhere(stockStatus),
  };

  const baseWhere: Prisma.ListingWhereInput = { shopId: shop.id };

  const [total, listings, statusCountRows] = await prisma.$transaction([
    prisma.listing.count({ where }),
    prisma.listing.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        variants: tr ? { include: { translations: tr } } : true,
        ...(tr ? { translations: tr } : {}),
        category: tr ? { include: { translations: tr } } : true,
      },
    }),
    prisma.listing.findMany({
      where: baseWhere,
      select: {
        id: true,
        variants: { select: { stock: true } },
      },
    }),
  ]);

  const stockCounts = { all: 0, in_stock: 0, low_stock: 0, out_of_stock: 0 };
  for (const row of statusCountRows) {
    stockCounts.all += 1;
    if (row.variants.length === 0) continue;
    const totalStock = row.variants.reduce((s, v) => s + v.stock, 0);
    const hasLow = row.variants.some(
      (v) => v.stock > 0 && v.stock <= LOW_STOCK_THRESHOLD,
    );
    if (totalStock === 0) stockCounts.out_of_stock += 1;
    else stockCounts.in_stock += 1;
    if (hasLow) stockCounts.low_stock += 1;
  }

  return c.json({
    listings: listings.map((p) => {
      const minPrice = minVariantPrice(p.variants);
      const trList = p.translations ?? [];
      const variantCount = p.variants.length;
      const stock = p.variants.reduce((s, v) => s + v.stock, 0);
      const outOfStockVariants = p.variants.filter((v) => v.stock === 0).length;
      return {
        id: p.id,
        slug: p.slug,
        name: pickListingName({ name: p.name, translations: trList }, locale),
        description: pickListingDescription(
          { description: p.description, translations: trList },
          locale,
        ),
        isPublished: p.isPublished,
        featured: p.featured,
        rating: toNumber(p.rating),
        reviewCount: p.reviewCount,
        priceFrom: minPrice,
        imageUrl: p.images[0]?.url ?? "",
        stock,
        variantCount,
        outOfStockVariants,
        variants: p.variants.map((v) => {
          const vt = v as typeof v & { translations?: { label: string }[] };
          return {
            id: v.id,
            label: pickVariantLabel(
              { label: v.label, translations: vt.translations ?? [] },
              locale,
            ),
            stock: v.stock,
          };
        }),
        category: {
          slug: p.category.slug,
          name: pickCategoryName(
            {
              name: p.category.name,
              translations: (p.category as { translations?: { name: string }[] }).translations ?? [],
            },
            locale,
          ),
        },
        updatedAt: p.updatedAt.toISOString(),
      };
    }),
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    stockCounts,
    lowStockThreshold: LOW_STOCK_THRESHOLD,
  });
});

sellerRouter.post("/seller/listings", async (c) => {
  const userId = await requireUserId(c);
  const shop = await getOwnedShop(userId);
  if (!shop) {
    throw new HTTPException(404, { message: "No shop" });
  }
  assertSellerCanManageShop(shop, userId);

  const body = await c.req.json().catch(() => null);
  const parsed = sellerListingCreateSchema.safeParse(body);
  if (!parsed.success) {
    throw new HTTPException(400, { message: "Invalid body" });
  }
  const data = parsed.data;

  const categoryId = await resolveCategoryId(data.categorySlug, data.categoryId);
  if (data.tagSlugs?.length) {
    await assertTagSlugsExist(data.tagSlugs);
  }

  const isPublished = data.isPublished ?? false;
  if (isPublished) {
    assertShopActiveForPublish(shop);
  }

  const slugTaken = await prisma.listing.findUnique({ where: { slug: data.slug } });
  if (slugTaken) {
    throw new HTTPException(400, { message: "Slug already in use" });
  }

  const listingCount = await prisma.listing.count({ where: { shopId: shop.id } });
  if (listingCount >= shop.listingsLimit) {
    throw new HTTPException(400, {
      message: `Listing limit reached (${shop.listingsLimit}). Delete a listing or contact support to raise your limit.`,
    });
  }

  const validatedAttributes = await validateListingAttributeInputs(
    categoryId,
    data.attributes ?? [],
  );

  const listing = await prisma.$transaction(async (tx) => {
    const created = await tx.listing.create({
      data: {
        slug: data.slug,
        shopId: shop.id,
        categoryId,
        name: data.name,
        description: data.description,
        rating: new Prisma.Decimal("0"),
        reviewCount: 0,
        featured: data.featured ?? false,
        isPublished,
        images: {
          create: data.images.map((url, i) => ({
            url,
            sortOrder: i,
          })),
        },
        variants: {
          create: data.variants.map((v, i) => ({
            sku: v.sku ?? `${data.slug}-v${i}`,
            label: v.label,
            colorHex: v.colorHex,
            price: new Prisma.Decimal(String(v.price)),
            compareAtPrice:
              v.compareAtPrice != null ? new Prisma.Decimal(String(v.compareAtPrice)) : null,
            stock: v.stock,
          })),
        },
        ...(data.tagSlugs?.length
          ? {
              listingTags: {
                create: data.tagSlugs.map((slug) => ({
                  tag: { connect: { slug } },
                })),
              },
            }
          : {}),
      },
      include: { variants: true },
    });

    if (validatedAttributes && validatedAttributes.length > 0) {
      await tx.listingAttributeValue.createMany({
        data: validatedAttributes.map((v) => ({
          listingId: created.id,
          definitionId: v.definitionId,
          allowedValueId: v.allowedValueId,
          textValue: v.textValue,
          numberValue: v.numberValue,
          booleanValue: v.booleanValue,
        })),
      });
    }

    if (data.translationAm) {
      await tx.listingTranslation.create({
        data: {
          listingId: created.id,
          locale: ContentLocale.am,
          name: data.translationAm.name,
          description: data.translationAm.description,
        },
      });
      for (let i = 0; i < data.variants.length; i++) {
        const v = data.variants[i]!;
        const variantRow = created.variants[i];
        if (!variantRow || !v.labelAm) continue;
        await tx.listingVariantTranslation.create({
          data: {
            variantId: variantRow.id,
            locale: ContentLocale.am,
            label: v.labelAm,
          },
        });
      }
    }

    return created;
  });

  await tryActivateShopIfOnboardingComplete(shop.id);

  return c.json({ listing: { id: listing.id, slug: listing.slug } });
});

sellerRouter.get("/seller/listings/:id", async (c) => {
  const userId = await requireUserId(c);
  const shop = await getOwnedShop(userId);
  if (!shop) {
    throw new HTTPException(404, { message: "No shop" });
  }
  assertSellerCanManageShop(shop, userId);

  const id = c.req.param("id");
  const locale = c.get("locale") as Locale;
  const now = new Date();

  const listing = await prisma.listing.findFirst({
    where: { id, shopId: shop.id },
    include: getListingDetailInclude(now, locale),
  });
  if (!listing) {
    throw new HTTPException(404, { message: "Listing not found" });
  }

  const minPrice = minVariantPrice(listing.variants);
  const promotionPick = pickPromotionForListing(
    listing.promotionListings.map((pp) => pp.promotion),
  );
  const storefrontAttributes = mapListingAttributeValuesForDetail(
    locale,
    listing.attributeValues.map((av) => ({
      definition: av.definition,
      allowedValue: av.allowedValue,
      textValue: av.textValue,
      numberValue: av.numberValue,
      booleanValue: av.booleanValue,
    })),
  );
  const tr = listing.translations ?? [];
  const category = listing.category as typeof listing.category & {
    translations?: { name: string }[];
  };
  const categoryTr = category.translations ?? [];

  return c.json({
    listing: {
      id: listing.id,
      slug: listing.slug,
      name: pickListingName({ name: listing.name, translations: tr }, locale),
      description: pickListingDescription(
        { description: listing.description, translations: tr },
        locale,
      ),
      isPublished: listing.isPublished,
      featured: listing.featured,
      rating: toNumber(listing.rating),
      reviewCount: listing.reviewCount,
      categoryId: listing.categoryId,
      categorySlug: category.slug,
      category: {
        id: category.id,
        slug: category.slug,
        name: pickCategoryName(
          { name: category.name, translations: categoryTr },
          locale,
        ),
      },
      shop: {
        slug: listing.shop.slug,
        name: listing.shop.name,
        imageUrl: listing.shop.imageUrl,
      },
      storefrontAttributes,
      promotion: promotionPick
        ? {
            slug: promotionPick.slug,
            badgeLabel:
              locale === "en"
                ? promotionPick.badgeLabel
                : (promotionPick.translations?.[0]?.badgeLabel ?? promotionPick.badgeLabel),
            endsAt: promotionPick.endsAt.toISOString(),
          }
        : undefined,
      images: listing.images.map((i) => i.url),
      variants: listing.variants.map((v) => {
        const vt = v as typeof v & { translations?: { label: string }[] };
        return {
          id: v.id,
          sku: v.sku,
          label: pickVariantLabel(
            { label: v.label, translations: vt.translations ?? [] },
            locale,
          ),
          colorHex: v.colorHex,
          price: toNumber(v.price),
          compareAtPrice: v.compareAtPrice != null ? toNumber(v.compareAtPrice) : undefined,
          stock: v.stock,
        };
      }),
      priceFrom: minPrice,
      tags: listing.listingTags.map((pt) => pt.tag.slug),
      attributes: serializeListingAttributeValuesForSeller(
        listing.attributeValues.map((av) => ({
          definition: av.definition,
          allowedValue: av.allowedValue,
          textValue: av.textValue,
          numberValue: av.numberValue,
          booleanValue: av.booleanValue,
        })),
      ),
    },
  });
});

sellerRouter.patch("/seller/listings/:id", async (c) => {
  const userId = await requireUserId(c);
  const shop = await getOwnedShop(userId);
  if (!shop) {
    throw new HTTPException(404, { message: "No shop" });
  }
  assertSellerCanManageShop(shop, userId);

  const id = c.req.param("id");
  const body = await c.req.json().catch(() => null);
  const parsed = sellerListingPatchSchema.safeParse(body);
  if (!parsed.success) {
    throw new HTTPException(400, { message: "Invalid body" });
  }

  const existing = await prisma.listing.findFirst({
    where: { id, shopId: shop.id },
    include: { variants: true },
  });
  if (!existing) {
    throw new HTTPException(404, { message: "Listing not found" });
  }

  const data = parsed.data;
  if (data.slug != null && data.slug !== existing.slug) {
    const taken = await prisma.listing.findUnique({ where: { slug: data.slug } });
    if (taken) {
      throw new HTTPException(400, { message: "Slug already in use" });
    }
  }

  if (data.isPublished === true) {
    assertShopActiveForPublish(shop);
  }

  if (data.tagSlugs?.length) {
    await assertTagSlugsExist(data.tagSlugs);
  }

  const categoryId =
    data.categorySlug != null || data.categoryId != null
      ? await resolveCategoryId(data.categorySlug, data.categoryId)
      : undefined;

  const nextCategoryId = categoryId ?? existing.categoryId;

  const slugForSkus = data.slug ?? existing.slug;

  await prisma.$transaction(async (tx) => {
    await tx.listing.update({
      where: { id },
      data: {
        ...(data.name != null ? { name: data.name } : {}),
        ...(data.description != null ? { description: data.description } : {}),
        ...(data.slug != null ? { slug: data.slug } : {}),
        ...(data.featured != null ? { featured: data.featured } : {}),
        ...(data.isPublished != null ? { isPublished: data.isPublished } : {}),
        ...(categoryId != null ? { categoryId } : {}),
      },
    });

    if (data.attributes !== undefined) {
      await tx.listingAttributeValue.deleteMany({ where: { listingId: id } });
      const validated = await validateListingAttributeInputs(nextCategoryId, data.attributes);
      if (validated && validated.length > 0) {
        await tx.listingAttributeValue.createMany({
          data: validated.map((v) => ({
            listingId: id,
            definitionId: v.definitionId,
            allowedValueId: v.allowedValueId,
            textValue: v.textValue,
            numberValue: v.numberValue,
            booleanValue: v.booleanValue,
          })),
        });
      }
    } else if (categoryId != null && categoryId !== existing.categoryId) {
      await tx.listingAttributeValue.deleteMany({ where: { listingId: id } });
    }

    if (data.images) {
      await tx.listingImage.deleteMany({ where: { listingId: id } });
      await tx.listingImage.createMany({
        data: data.images.map((url, i) => ({
          listingId: id,
          url,
          sortOrder: i,
        })),
      });
    }

    if (data.tagSlugs) {
      await tx.listingTag.deleteMany({ where: { listingId: id } });
      const tags = await tx.tag.findMany({
        where: { slug: { in: data.tagSlugs } },
      });
      if (tags.length !== data.tagSlugs.length) {
        throw new HTTPException(400, { message: "One or more tags not found" });
      }
      await tx.listingTag.createMany({
        data: tags.map((t) => ({
          listingId: id,
          tagId: t.id,
        })),
      });
    }

    if (data.variants) {
      await tx.listingVariant.deleteMany({ where: { listingId: id } });
      for (let i = 0; i < data.variants.length; i++) {
        const v = data.variants[i]!;
        const created = await tx.listingVariant.create({
          data: {
            listingId: id,
            sku: v.sku ?? `${slugForSkus}-v${i}`,
            label: v.label,
            colorHex: v.colorHex,
            price: new Prisma.Decimal(String(v.price)),
            compareAtPrice:
              v.compareAtPrice != null ? new Prisma.Decimal(String(v.compareAtPrice)) : null,
            stock: v.stock,
          },
        });
        if (v.labelAm) {
          await tx.listingVariantTranslation.create({
            data: {
              variantId: created.id,
              locale: ContentLocale.am,
              label: v.labelAm,
            },
          });
        }
      }
    }

    if (data.translationAm) {
      await tx.listingTranslation.upsert({
        where: {
          listingId_locale: {
            listingId: id,
            locale: ContentLocale.am,
          },
        },
        create: {
          listingId: id,
          locale: ContentLocale.am,
          name: data.translationAm.name,
          description: data.translationAm.description,
        },
        update: {
          name: data.translationAm.name,
          description: data.translationAm.description,
        },
      });
    } else if (data.translationAm === null) {
      await tx.listingTranslation.deleteMany({
        where: { listingId: id, locale: ContentLocale.am },
      });
    }
  });

  return c.json({ ok: true });
});

/**
 * Lightweight stock-only update. Lets sellers restock variants (e.g. clear
 * "out of stock" state) without touching the rest of the listing. Only variant
 * IDs that belong to the target listing are applied; others are ignored.
 */
sellerRouter.patch("/seller/listings/:id/stock", async (c) => {
  const userId = await requireUserId(c);
  const shop = await getOwnedShop(userId);
  if (!shop) {
    throw new HTTPException(404, { message: "No shop" });
  }
  assertSellerCanManageShop(shop, userId);

  const id = c.req.param("id");
  const body = await c.req.json().catch(() => null);
  const parsed = sellerListingStockUpdateSchema.safeParse(body);
  if (!parsed.success) {
    throw new HTTPException(400, { message: "Invalid body" });
  }

  const existing = await prisma.listing.findFirst({
    where: { id, shopId: shop.id },
    include: { variants: { select: { id: true } } },
  });
  if (!existing) {
    throw new HTTPException(404, { message: "Listing not found" });
  }
  const ownedIds = new Set(existing.variants.map((v) => v.id));

  const updates = parsed.data.variants.filter((v) => ownedIds.has(v.id));
  if (updates.length === 0) {
    throw new HTTPException(400, { message: "No matching variants" });
  }

  await prisma.$transaction(
    updates.map((v) =>
      prisma.listingVariant.update({
        where: { id: v.id },
        data: { stock: v.stock },
      }),
    ),
  );

  await prisma.listing.update({
    where: { id },
    data: { updatedAt: new Date() },
  });

  return c.json({ ok: true, updated: updates.length });
});

sellerRouter.delete("/seller/listings/:id", async (c) => {
  const userId = await requireUserId(c);
  const shop = await getOwnedShop(userId);
  if (!shop) {
    throw new HTTPException(404, { message: "No shop" });
  }
  assertSellerCanManageShop(shop, userId);

  const id = c.req.param("id");
  const existing = await prisma.listing.findFirst({
    where: { id, shopId: shop.id },
  });
  if (!existing) {
    throw new HTTPException(404, { message: "Listing not found" });
  }

  await prisma.listing.delete({ where: { id } });
  return c.json({ ok: true });
});
