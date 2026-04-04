import type { Prisma } from "@ys/db";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

import { prisma } from "../../lib/db.js";
import { toNumber } from "../../lib/money.js";
import {
  featuredQuerySchema,
  productListQuerySchema,
  productSearchQuerySchema,
} from "./catalog.schema.js";
import {
  getProductCardInclude,
  mapProductCard,
  minVariantPrice,
} from "./product-card.mapper.js";
import {
  activePromotionWhere,
  pickPromotionForProduct,
} from "../promotions/promotion.utils.js";

function productListWhere(args: {
  categorySlug?: string;
  q?: string;
  tagSlugs?: string[];
  promotionSlug?: string;
  now: Date;
}): Prisma.ProductWhereInput {
  const clauses: Prisma.ProductWhereInput[] = [];
  if (args.categorySlug) {
    clauses.push({ category: { slug: args.categorySlug } });
  }
  if (args.q) {
    clauses.push({
      OR: [
        { name: { contains: args.q, mode: "insensitive" } },
        { description: { contains: args.q, mode: "insensitive" } },
      ],
    });
  }
  // AND: product must include every selected tag (narrowing filter).
  if (args.tagSlugs?.length) {
    for (const slug of args.tagSlugs) {
      clauses.push({ tags: { some: { slug } } });
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
  if (clauses.length === 0) return {};
  if (clauses.length === 1) return clauses[0]!;
  return { AND: clauses };
}

export const catalogRouter = new Hono();

catalogRouter.get("/categories", async (c) => {
  const rows = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
  });
  return c.json({
    categories: rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      imageUrl: row.imageUrl,
      sortOrder: row.sortOrder,
    })),
  });
});

catalogRouter.get("/categories/:slug", async (c) => {
  const slug = c.req.param("slug");
  const row = await prisma.category.findUnique({
    where: { slug },
    include: { _count: { select: { products: true } } },
  });
  if (!row) {
    throw new HTTPException(404, { message: "Category not found" });
  }
  return c.json({
    category: {
      id: row.id,
      slug: row.slug,
      name: row.name,
      imageUrl: row.imageUrl,
      sortOrder: row.sortOrder,
      productCount: row._count.products,
    },
  });
});

catalogRouter.get("/tags", async (c) => {
  const rows = await prisma.tag.findMany({
    orderBy: { name: "asc" },
    select: { slug: true, name: true },
  });
  return c.json({ tags: rows });
});

catalogRouter.get("/products/featured", async (c) => {
  const query = featuredQuerySchema.safeParse({
    limit: c.req.query("limit"),
  });
  if (!query.success) {
    throw new HTTPException(400, { message: "Invalid query" });
  }
  const { limit } = query.data;
  const now = new Date();

  const products = await prisma.product.findMany({
    where: { featured: true },
    include: getProductCardInclude(now),
    orderBy: [{ rating: "desc" }, { createdAt: "desc" }],
    take: limit,
  });

  return c.json({
    products: products.map(mapProductCard),
  });
});

catalogRouter.get("/products", async (c) => {
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
    sort: c.req.query("sort"),
    page: c.req.query("page"),
    pageSize: c.req.query("pageSize"),
  });
  if (!query.success) {
    throw new HTTPException(400, { message: "Invalid query" });
  }

  const { categorySlug, q, tagSlugs, promotionSlug, sort, page, pageSize } = query.data;
  const now = new Date();

  const where = productListWhere({ categorySlug, q, tagSlugs, promotionSlug, now });

  const products = await prisma.product.findMany({
    where,
    include: getProductCardInclude(now),
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
    products: slice.map((x) => mapProductCard(x.product)),
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  });
});

catalogRouter.get("/products/search", async (c) => {
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
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ],
    },
    include: getProductCardInclude(now),
    orderBy: [{ rating: "desc" }, { createdAt: "desc" }],
    take: limit,
  });

  return c.json({
    products: products.map(mapProductCard),
  });
});

catalogRouter.get("/products/:slug/related", async (c) => {
  const slug = c.req.param("slug");
  const product = await prisma.product.findUnique({
    where: { slug },
    select: { id: true, categoryId: true },
  });
  if (!product) {
    throw new HTTPException(404, { message: "Product not found" });
  }

  const now = new Date();
  const related = await prisma.product.findMany({
    where: {
      categoryId: product.categoryId,
      id: { not: product.id },
    },
    include: getProductCardInclude(now),
    take: 8,
    orderBy: { rating: "desc" },
  });

  return c.json({
    products: related.map(mapProductCard),
  });
});

catalogRouter.get("/products/:slug", async (c) => {
  const slug = c.req.param("slug");
  const now = new Date();
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      category: true,
      images: { orderBy: { sortOrder: "asc" } },
      variants: { orderBy: { label: "asc" } },
      tags: { orderBy: { name: "asc" } },
      promotionProducts: {
        where: { promotion: activePromotionWhere(now) },
        include: {
          promotion: {
            select: {
              slug: true,
              badgeLabel: true,
              endsAt: true,
              priority: true,
            },
          },
        },
      },
    },
  });
  if (!product) {
    throw new HTTPException(404, { message: "Product not found" });
  }

  const minPrice = minVariantPrice(product.variants);
  const promotionPick = pickPromotionForProduct(
    product.promotionProducts.map((pp) => pp.promotion),
  );

  return c.json({
    product: {
      id: product.id,
      slug: product.slug,
      name: product.name,
      description: product.description,
      rating: toNumber(product.rating),
      reviewCount: product.reviewCount,
      category: {
        id: product.category.id,
        slug: product.category.slug,
        name: product.category.name,
      },
      images: product.images.map((i) => i.url),
      variants: product.variants.map((v) => ({
        id: v.id,
        label: v.label,
        colorHex: v.colorHex,
        price: toNumber(v.price),
        compareAtPrice: v.compareAtPrice != null ? toNumber(v.compareAtPrice) : undefined,
        stock: v.stock,
      })),
      priceFrom: minPrice,
      tags: product.tags.map((t) => ({ slug: t.slug, name: t.name })),
      promotion: promotionPick
        ? {
            slug: promotionPick.slug,
            badgeLabel: promotionPick.badgeLabel,
            endsAt: promotionPick.endsAt.toISOString(),
          }
        : undefined,
    },
  });
});
