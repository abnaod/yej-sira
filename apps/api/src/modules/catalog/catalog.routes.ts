import type { Prisma } from "@ys/db";
import type { Locale } from "@ys/intl";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

import {
  getCategoryDefinitionsForApi,
  mapDefinitionsToJson,
  mapProductAttributeValuesForDetail,
} from "../../lib/category-attributes";
import { prisma, publicProductVisibilityWhere } from "../../lib/db";
import { recalculateProductRatingAggregate } from "../../lib/product-rating-aggregate";
import {
  pickCategoryName,
  pickProductDescription,
  pickProductName,
  pickTagName,
  pickVariantLabel,
} from "../../lib/localized-catalog";
import { toNumber } from "../../lib/money";
import {
  featuredQuerySchema,
  productListQuerySchema,
  productSearchQuerySchema,
} from "./catalog.schema";
import {
  getProductCardInclude,
  getProductDetailInclude,
  mapProductCard,
  minVariantPrice,
} from "./product-card.mapper";
import { productReviewPostSchema, productReviewsQuerySchema } from "./product-reviews.schema";
import { auth } from "../auth/auth";
import {
  activePromotionWhere,
  pickPromotionForProduct,
} from "../promotions/promotion.utils";

function productSearchWhere(q: string, locale: Locale): Prisma.ProductWhereInput {
  const or: Prisma.ProductWhereInput[] = [
    { name: { contains: q, mode: "insensitive" } },
    { description: { contains: q, mode: "insensitive" } },
  ];
  if (locale === "am") {
    or.push({
      translations: {
        some: {
          locale: "am",
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
          ],
        },
      },
    });
  }
  return { OR: or };
}

function productListWhere(args: {
  categorySlug?: string;
  q?: string;
  tagSlugs?: string[];
  promotionSlug?: string;
  attributeDefinitionKey?: string;
  allowedValueKey?: string;
  now: Date;
  locale: Locale;
}): Prisma.ProductWhereInput {
  const clauses: Prisma.ProductWhereInput[] = [publicProductVisibilityWhere];
  if (args.categorySlug) {
    clauses.push({ category: { slug: args.categorySlug } });
  }
  if (args.attributeDefinitionKey && args.allowedValueKey && args.categorySlug) {
    clauses.push({
      attributeValues: {
        some: {
          definition: {
            key: args.attributeDefinitionKey,
            category: { slug: args.categorySlug },
          },
          allowedValue: { key: args.allowedValueKey },
        },
      },
    });
  }
  if (args.q) {
    clauses.push(productSearchWhere(args.q, args.locale));
  }
  if (args.tagSlugs?.length) {
    for (const slug of args.tagSlugs) {
      clauses.push({ productTags: { some: { tag: { slug } } } });
    }
  }
  if (args.promotionSlug) {
    clauses.push({
      promotionProducts: {
        some: {
          promotion: {
            slug: args.promotionSlug,
            ...activePromotionWhere(args.now),
          },
        },
      },
    });
  }
  if (clauses.length === 1) return clauses[0]!;
  return { AND: clauses };
}

export const catalogRouter = new Hono();

catalogRouter.get("/categories/:slug/attributes", async (c) => {
  const locale = c.get("locale");
  const slug = c.req.param("slug");
  const category = await prisma.category.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (!category) {
    throw new HTTPException(404, { message: "Category not found" });
  }
  const defs = await getCategoryDefinitionsForApi(category.id);
  return c.json({
    definitions: mapDefinitionsToJson(defs, locale),
  });
});

catalogRouter.get("/categories", async (c) => {
  const locale = c.get("locale");
  const tr =
    locale === "en"
      ? null
      : ({
          where: { locale },
        } as const);

  const rows = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: tr ? { translations: tr } : undefined,
  });
  return c.json({
    categories: rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      name: pickCategoryName(
        {
          name: row.name,
          translations: (row as { translations?: { name: string }[] }).translations ?? [],
        },
        locale,
      ),
      imageUrl: row.imageUrl,
      sortOrder: row.sortOrder,
    })),
  });
});

catalogRouter.get("/categories/:slug", async (c) => {
  const locale = c.get("locale");
  const slug = c.req.param("slug");
  const tr =
    locale === "en"
      ? null
      : ({
          where: { locale },
        } as const);

  const row = await prisma.category.findUnique({
    where: { slug },
    include: {
      _count: {
        select: {
          products: {
            where: publicProductVisibilityWhere,
          },
        },
      },
      ...(tr ? { translations: tr } : {}),
    },
  });
  if (!row) {
    throw new HTTPException(404, { message: "Category not found" });
  }
  return c.json({
    category: {
      id: row.id,
      slug: row.slug,
      name: pickCategoryName(
        {
          name: row.name,
          translations: (row as { translations?: { name: string }[] }).translations ?? [],
        },
        locale,
      ),
      imageUrl: row.imageUrl,
      sortOrder: row.sortOrder,
      productCount: row._count.products,
    },
  });
});

catalogRouter.get("/tags", async (c) => {
  const locale = c.get("locale");
  const tr =
    locale === "en"
      ? null
      : ({
          where: { locale },
        } as const);

  const rows = await prisma.tag.findMany({
    orderBy: { name: "asc" },
    select: {
      slug: true,
      name: true,
      ...(tr ? { translations: tr } : {}),
    },
  });
  return c.json({
    tags: rows.map((row) => ({
      slug: row.slug,
      name: pickTagName(
        { name: row.name, translations: row.translations ?? [] },
        locale,
      ),
    })),
  });
});

catalogRouter.get("/products/featured", async (c) => {
  const locale = c.get("locale");
  const query = featuredQuerySchema.safeParse({
    limit: c.req.query("limit"),
  });
  if (!query.success) {
    throw new HTTPException(400, { message: "Invalid query" });
  }
  const { limit } = query.data;
  const now = new Date();

  const products = await prisma.product.findMany({
    where: { AND: [publicProductVisibilityWhere, { featured: true }] },
    include: getProductCardInclude(now, locale),
    orderBy: [{ rating: "desc" }, { createdAt: "desc" }],
    take: limit,
  });

  return c.json({
    products: products.map((p) => mapProductCard(p, locale)),
  });
});

catalogRouter.get("/products", async (c) => {
  const locale = c.get("locale");
  const tagSlugsList = c.req.queries("tagSlugs") ?? [];
  const tagSlugsParam =
    tagSlugsList.length > 1
      ? tagSlugsList
      : tagSlugsList.length === 1
        ? tagSlugsList[0]
        : c.req.query("tagSlugs");

  const query = productListQuerySchema.safeParse({
    categorySlug: c.req.query("categorySlug"),
    q: c.req.query("q"),
    tagSlugs: tagSlugsParam,
    promotionSlug: c.req.query("promotionSlug"),
    attributeDefinitionKey: c.req.query("attributeDefinitionKey"),
    allowedValueKey: c.req.query("allowedValueKey"),
    sort: c.req.query("sort"),
    page: c.req.query("page"),
    pageSize: c.req.query("pageSize"),
  });
  if (!query.success) {
    throw new HTTPException(400, { message: "Invalid query" });
  }

  const {
    categorySlug,
    q,
    tagSlugs,
    promotionSlug,
    attributeDefinitionKey,
    allowedValueKey,
    sort,
    page,
    pageSize,
  } = query.data;
  const now = new Date();

  const where = productListWhere({
    categorySlug,
    q,
    tagSlugs,
    promotionSlug,
    attributeDefinitionKey,
    allowedValueKey,
    now,
    locale,
  });

  const products = await prisma.product.findMany({
    where,
    include: getProductCardInclude(now, locale),
  });

  const withPrice = products.map((p) => ({
    product: p,
    minPrice: minVariantPrice(p.variants),
  }));

  if (sort === "price-asc") {
    withPrice.sort((a, b) => a.minPrice - b.minPrice);
  } else if (sort === "price-desc") {
    withPrice.sort((a, b) => b.minPrice - a.minPrice);
  } else if (sort === "newest") {
    withPrice.sort(
      (a, b) => b.product.createdAt.getTime() - a.product.createdAt.getTime(),
    );
  } else {
    withPrice.sort((a, b) => {
      const feat = Number(b.product.featured) - Number(a.product.featured);
      if (feat !== 0) return feat;
      const r = toNumber(b.product.rating) - toNumber(a.product.rating);
      if (r !== 0) return r;
      return b.product.createdAt.getTime() - a.product.createdAt.getTime();
    });
  }

  const total = withPrice.length;
  const slice = withPrice.slice((page - 1) * pageSize, page * pageSize);

  return c.json({
    products: slice.map((x) => mapProductCard(x.product, locale)),
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  });
});

catalogRouter.get("/products/search", async (c) => {
  const locale = c.get("locale");
  const query = productSearchQuerySchema.safeParse({
    q: c.req.query("q"),
    limit: c.req.query("limit"),
  });
  if (!query.success) {
    throw new HTTPException(400, { message: "Invalid query" });
  }

  const { q, limit } = query.data;
  const now = new Date();

  const products = await prisma.product.findMany({
    where: {
      AND: [publicProductVisibilityWhere, productSearchWhere(q, locale)],
    },
    include: getProductCardInclude(now, locale),
    orderBy: [{ rating: "desc" }, { createdAt: "desc" }],
    take: limit,
  });

  return c.json({
    products: products.map((p) => mapProductCard(p, locale)),
  });
});

catalogRouter.get("/products/:slug/related", async (c) => {
  const locale = c.get("locale");
  const slug = c.req.param("slug");
  const product = await prisma.product.findFirst({
    where: { slug, ...publicProductVisibilityWhere },
    select: { id: true, categoryId: true },
  });
  if (!product) {
    throw new HTTPException(404, { message: "Product not found" });
  }

  const now = new Date();
  const related = await prisma.product.findMany({
    where: {
      AND: [
        publicProductVisibilityWhere,
        { categoryId: product.categoryId },
        { id: { not: product.id } },
      ],
    },
    include: getProductCardInclude(now, locale),
    take: 8,
    orderBy: { rating: "desc" },
  });

  return c.json({
    products: related.map((p) => mapProductCard(p, locale)),
  });
});

catalogRouter.get("/products/:slug/more-from-shop", async (c) => {
  const locale = c.get("locale");
  const slug = c.req.param("slug");
  const product = await prisma.product.findFirst({
    where: { slug, ...publicProductVisibilityWhere },
    select: { id: true, shopId: true },
  });
  if (!product) {
    throw new HTTPException(404, { message: "Product not found" });
  }

  const now = new Date();
  const fromShop = await prisma.product.findMany({
    where: {
      AND: [
        publicProductVisibilityWhere,
        { shopId: product.shopId },
        { id: { not: product.id } },
      ],
    },
    include: getProductCardInclude(now, locale),
    take: 8,
    orderBy: [{ rating: "desc" }, { createdAt: "desc" }],
  });

  return c.json({
    products: fromShop.map((p) => mapProductCard(p, locale)),
  });
});

catalogRouter.get("/products/:slug/reviews", async (c) => {
  const slug = c.req.param("slug");
  const product = await prisma.product.findFirst({
    where: { slug, ...publicProductVisibilityWhere },
    select: { id: true },
  });
  if (!product) {
    throw new HTTPException(404, { message: "Product not found" });
  }

  const parsed = productReviewsQuerySchema.safeParse({
    take: c.req.query("take"),
    cursor: c.req.query("cursor") ?? undefined,
  });
  if (!parsed.success) {
    throw new HTTPException(400, { message: "Invalid query" });
  }
  const { take, cursor } = parsed.data;

  const rows = await prisma.productRating.findMany({
    where: { productId: product.id },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: take + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: { user: { select: { name: true } } },
  });

  let nextCursor: string | null = null;
  if (rows.length > take) {
    const extra = rows.pop();
    nextCursor = extra?.id ?? null;
  }

  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  let viewerReview: {
    id: string;
    stars: number;
    comment: string | null;
    createdAt: string;
  } | null = null;
  if (session?.user) {
    const mine = await prisma.productRating.findUnique({
      where: {
        userId_productId: {
          userId: session.user.id,
          productId: product.id,
        },
      },
      select: { id: true, stars: true, comment: true, createdAt: true },
    });
    if (mine) {
      viewerReview = {
        id: mine.id,
        stars: mine.stars,
        comment: mine.comment,
        createdAt: mine.createdAt.toISOString(),
      };
    }
  }

  return c.json({
    reviews: rows.map((r: (typeof rows)[number]) => ({
      id: r.id,
      stars: r.stars,
      comment: r.comment,
      createdAt: r.createdAt.toISOString(),
      authorName: r.user.name,
    })),
    nextCursor,
    viewerReview,
  });
});

catalogRouter.post("/products/:slug/reviews", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user) {
    throw new HTTPException(401, { message: "Unauthorized" });
  }

  const slug = c.req.param("slug");
  const product = await prisma.product.findFirst({
    where: { slug, ...publicProductVisibilityWhere },
    select: { id: true },
  });
  if (!product) {
    throw new HTTPException(404, { message: "Product not found" });
  }

  const body = await c.req.json().catch(() => null);
  const parsed = productReviewPostSchema.safeParse(body);
  if (!parsed.success) {
    throw new HTTPException(400, { message: "Invalid body" });
  }

  const row = await prisma.productRating.upsert({
    where: {
      userId_productId: {
        userId: session.user.id,
        productId: product.id,
      },
    },
    create: {
      userId: session.user.id,
      productId: product.id,
      stars: parsed.data.stars,
      comment: parsed.data.comment,
    },
    update: {
      stars: parsed.data.stars,
      comment: parsed.data.comment,
    },
    include: { user: { select: { name: true } } },
  });

  const summary = await recalculateProductRatingAggregate(product.id);

  return c.json({
    review: {
      id: row.id,
      stars: row.stars,
      comment: row.comment,
      createdAt: row.createdAt.toISOString(),
      authorName: row.user.name,
    },
    product: {
      rating: summary.rating,
      reviewCount: summary.reviewCount,
    },
  });
});

catalogRouter.delete("/products/:slug/reviews", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user) {
    throw new HTTPException(401, { message: "Unauthorized" });
  }

  const slug = c.req.param("slug");
  const product = await prisma.product.findFirst({
    where: { slug, ...publicProductVisibilityWhere },
    select: { id: true },
  });
  if (!product) {
    throw new HTTPException(404, { message: "Product not found" });
  }

  const deleted = await prisma.productRating.deleteMany({
    where: {
      userId: session.user.id,
      productId: product.id,
    },
  });
  if (deleted.count === 0) {
    throw new HTTPException(404, { message: "Review not found" });
  }

  await recalculateProductRatingAggregate(product.id);

  return c.json({ ok: true });
});

catalogRouter.get("/products/:slug", async (c) => {
  const locale = c.get("locale");
  const slug = c.req.param("slug");
  const now = new Date();
  const product = await prisma.product.findFirst({
    where: {
      slug,
      ...publicProductVisibilityWhere,
    },
    include: getProductDetailInclude(now, locale),
  });
  if (!product) {
    throw new HTTPException(404, { message: "Product not found" });
  }

  const minPrice = minVariantPrice(product.variants);
  const promotionPick = pickPromotionForProduct(
    product.promotionProducts.map((pp) => pp.promotion),
  );

  const attributes = mapProductAttributeValuesForDetail(
    locale,
    product.attributeValues.map((av) => ({
      definition: av.definition,
      allowedValue: av.allowedValue,
      textValue: av.textValue,
      numberValue: av.numberValue,
      booleanValue: av.booleanValue,
    })),
  );

  const tr = product.translations ?? [];
  const category = product.category as typeof product.category & {
    translations?: { name: string }[];
  };
  const categoryTr = category.translations ?? [];

  return c.json({
    product: {
      id: product.id,
      slug: product.slug,
      name: pickProductName({ name: product.name, translations: tr }, locale),
      description: pickProductDescription(
        { description: product.description, translations: tr },
        locale,
      ),
      rating: toNumber(product.rating),
      reviewCount: product.reviewCount,
      category: {
        id: category.id,
        slug: category.slug,
        name: pickCategoryName(
          { name: category.name, translations: categoryTr },
          locale,
        ),
      },
      shop: {
        slug: product.shop.slug,
        name: product.shop.name,
        imageUrl: product.shop.imageUrl,
      },
      images: product.images.map((i) => i.url),
      variants: product.variants.map((v) => {
        const vt = v as typeof v & { translations?: { label: string }[] };
        return {
          id: v.id,
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
      tags: product.productTags.map((pt) => {
        const tag = pt.tag as typeof pt.tag & {
          translations?: { name: string }[];
        };
        return {
          slug: tag.slug,
          name: pickTagName(
            { name: tag.name, translations: tag.translations ?? [] },
            locale,
          ),
        };
      }),
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
      attributes,
    },
  });
});
