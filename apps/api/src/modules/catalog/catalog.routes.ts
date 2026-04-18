import type { Prisma } from "@ys/db";
import type { Locale } from "@ys/intl";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

import {
  getCategoryDefinitionsForApi,
  mapDefinitionsToJson,
  mapListingAttributeValuesForDetail,
} from "./category-attributes";
import { prisma, publicListingVisibilityWhere } from "../../lib/db";
import { recalculateListingRatingAggregate } from "./catalog.rating";
import {
  pickCategoryName,
  pickListingDescription,
  pickListingName,
  pickTagName,
  pickVariantLabel,
} from "./catalog.localize";
import { toNumber } from "../../lib/money";
import {
  featuredQuerySchema,
  listingListQuerySchema,
  listingSearchQuerySchema,
} from "./catalog.schema";
import {
  getListingCardInclude,
  getListingDetailInclude,
  mapListingCard,
  minVariantPrice,
} from "./catalog.mappers";
import { listingReviewPostSchema, listingReviewsQuerySchema } from "./reviews.schema";
import { auth } from "../auth/auth";
import {
  activePromotionWhere,
  pickPromotionForListing,
} from "../promotions/promotions.utils";

function listingSearchWhere(q: string, locale: Locale): Prisma.ListingWhereInput {
  const or: Prisma.ListingWhereInput[] = [
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

function listingListWhere(args: {
  categorySlug?: string;
  q?: string;
  tagSlugs?: string[];
  promotionSlug?: string;
  attributeDefinitionKey?: string;
  allowedValueKey?: string;
  now: Date;
  locale: Locale;
}): Prisma.ListingWhereInput {
  const clauses: Prisma.ListingWhereInput[] = [publicListingVisibilityWhere];
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
    clauses.push(listingSearchWhere(args.q, args.locale));
  }
  if (args.tagSlugs?.length) {
    for (const slug of args.tagSlugs) {
      clauses.push({ listingTags: { some: { tag: { slug } } } });
    }
  }
  if (args.promotionSlug) {
    clauses.push({
      promotionListings: {
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
          listings: {
            where: publicListingVisibilityWhere,
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
      listingCount: row._count.listings,
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

catalogRouter.get("/listings/featured", async (c) => {
  const locale = c.get("locale");
  const query = featuredQuerySchema.safeParse({
    limit: c.req.query("limit"),
  });
  if (!query.success) {
    throw new HTTPException(400, { message: "Invalid query" });
  }
  const { limit } = query.data;
  const now = new Date();

  const listings = await prisma.listing.findMany({
    where: { AND: [publicListingVisibilityWhere, { featured: true }] },
    include: getListingCardInclude(now, locale),
    orderBy: [{ rating: "desc" }, { createdAt: "desc" }],
    take: limit,
  });

  return c.json({
    listings: listings.map((p) => mapListingCard(p, locale)),
  });
});

catalogRouter.get("/listings", async (c) => {
  const locale = c.get("locale");
  const tagSlugsList = c.req.queries("tagSlugs") ?? [];
  const tagSlugsParam =
    tagSlugsList.length > 1
      ? tagSlugsList
      : tagSlugsList.length === 1
        ? tagSlugsList[0]
        : c.req.query("tagSlugs");

  const query = listingListQuerySchema.safeParse({
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

  const where = listingListWhere({
    categorySlug,
    q,
    tagSlugs,
    promotionSlug,
    attributeDefinitionKey,
    allowedValueKey,
    now,
    locale,
  });

  const listings = await prisma.listing.findMany({
    where,
    include: getListingCardInclude(now, locale),
  });

  const withPrice = listings.map((p) => ({
    listing: p,
    minPrice: minVariantPrice(p.variants),
  }));

  if (sort === "price-asc") {
    withPrice.sort((a, b) => a.minPrice - b.minPrice);
  } else if (sort === "price-desc") {
    withPrice.sort((a, b) => b.minPrice - a.minPrice);
  } else if (sort === "newest") {
    withPrice.sort(
      (a, b) => b.listing.createdAt.getTime() - a.listing.createdAt.getTime(),
    );
  } else {
    withPrice.sort((a, b) => {
      const feat = Number(b.listing.featured) - Number(a.listing.featured);
      if (feat !== 0) return feat;
      const r = toNumber(b.listing.rating) - toNumber(a.listing.rating);
      if (r !== 0) return r;
      return b.listing.createdAt.getTime() - a.listing.createdAt.getTime();
    });
  }

  const total = withPrice.length;
  const slice = withPrice.slice((page - 1) * pageSize, page * pageSize);

  return c.json({
    listings: slice.map((x) => mapListingCard(x.listing, locale)),
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  });
});

catalogRouter.get("/listings/search", async (c) => {
  const locale = c.get("locale");
  const query = listingSearchQuerySchema.safeParse({
    q: c.req.query("q"),
    limit: c.req.query("limit"),
  });
  if (!query.success) {
    throw new HTTPException(400, { message: "Invalid query" });
  }

  const { q, limit } = query.data;
  const now = new Date();

  const listings = await prisma.listing.findMany({
    where: {
      AND: [publicListingVisibilityWhere, listingSearchWhere(q, locale)],
    },
    include: getListingCardInclude(now, locale),
    orderBy: [{ rating: "desc" }, { createdAt: "desc" }],
    take: limit,
  });

  return c.json({
    listings: listings.map((p) => mapListingCard(p, locale)),
  });
});

catalogRouter.get("/listings/:slug/related", async (c) => {
  const locale = c.get("locale");
  const slug = c.req.param("slug");
  const listing = await prisma.listing.findFirst({
    where: { slug, ...publicListingVisibilityWhere },
    select: { id: true, categoryId: true },
  });
  if (!listing) {
    throw new HTTPException(404, { message: "Listing not found" });
  }

  const now = new Date();
  const related = await prisma.listing.findMany({
    where: {
      AND: [
        publicListingVisibilityWhere,
        { categoryId: listing.categoryId },
        { id: { not: listing.id } },
      ],
    },
    include: getListingCardInclude(now, locale),
    take: 8,
    orderBy: { rating: "desc" },
  });

  return c.json({
    listings: related.map((p) => mapListingCard(p, locale)),
  });
});

catalogRouter.get("/listings/:slug/more-from-shop", async (c) => {
  const locale = c.get("locale");
  const slug = c.req.param("slug");
  const listing = await prisma.listing.findFirst({
    where: { slug, ...publicListingVisibilityWhere },
    select: { id: true, shopId: true },
  });
  if (!listing) {
    throw new HTTPException(404, { message: "Listing not found" });
  }

  const now = new Date();
  const fromShop = await prisma.listing.findMany({
    where: {
      AND: [
        publicListingVisibilityWhere,
        { shopId: listing.shopId },
        { id: { not: listing.id } },
      ],
    },
    include: getListingCardInclude(now, locale),
    take: 8,
    orderBy: [{ rating: "desc" }, { createdAt: "desc" }],
  });

  return c.json({
    listings: fromShop.map((p) => mapListingCard(p, locale)),
  });
});

catalogRouter.get("/listings/:slug/reviews", async (c) => {
  const slug = c.req.param("slug");
  const listing = await prisma.listing.findFirst({
    where: { slug, ...publicListingVisibilityWhere },
    select: { id: true, rating: true, reviewCount: true },
  });
  if (!listing) {
    throw new HTTPException(404, { message: "Listing not found" });
  }

  const parsed = listingReviewsQuerySchema.safeParse({
    take: c.req.query("take"),
    cursor: c.req.query("cursor") ?? undefined,
  });
  if (!parsed.success) {
    throw new HTTPException(400, { message: "Invalid query" });
  }
  const { take, cursor } = parsed.data;

  const [rows, starGroups] = await Promise.all([
    prisma.listingRating.findMany({
      where: { listingId: listing.id },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: { user: { select: { name: true } } },
    }),
    prisma.listingRating.groupBy({
      by: ["stars"],
      where: { listingId: listing.id },
      _count: { _all: true },
    }),
  ]);

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
    const mine = await prisma.listingRating.findUnique({
      where: {
        userId_listingId: {
          userId: session.user.id,
          listingId: listing.id,
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

  const counts: [number, number, number, number, number] = [0, 0, 0, 0, 0];
  for (const g of starGroups) {
    if (g.stars >= 1 && g.stars <= 5) {
      counts[g.stars - 1] = g._count._all;
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
    summary: {
      average: toNumber(listing.rating),
      total: listing.reviewCount,
      counts,
    },
  });
});

catalogRouter.post("/listings/:slug/reviews", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user) {
    throw new HTTPException(401, { message: "Unauthorized" });
  }

  const slug = c.req.param("slug");
  const listing = await prisma.listing.findFirst({
    where: { slug, ...publicListingVisibilityWhere },
    select: { id: true },
  });
  if (!listing) {
    throw new HTTPException(404, { message: "Listing not found" });
  }

  const body = await c.req.json().catch(() => null);
  const parsed = listingReviewPostSchema.safeParse(body);
  if (!parsed.success) {
    throw new HTTPException(400, { message: "Invalid body" });
  }

  const row = await prisma.listingRating.upsert({
    where: {
      userId_listingId: {
        userId: session.user.id,
        listingId: listing.id,
      },
    },
    create: {
      userId: session.user.id,
      listingId: listing.id,
      stars: parsed.data.stars,
      comment: parsed.data.comment,
    },
    update: {
      stars: parsed.data.stars,
      comment: parsed.data.comment,
    },
    include: { user: { select: { name: true } } },
  });

  const summary = await recalculateListingRatingAggregate(listing.id);

  return c.json({
    review: {
      id: row.id,
      stars: row.stars,
      comment: row.comment,
      createdAt: row.createdAt.toISOString(),
      authorName: row.user.name,
    },
    listing: {
      rating: summary.rating,
      reviewCount: summary.reviewCount,
    },
  });
});

catalogRouter.delete("/listings/:slug/reviews", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user) {
    throw new HTTPException(401, { message: "Unauthorized" });
  }

  const slug = c.req.param("slug");
  const listing = await prisma.listing.findFirst({
    where: { slug, ...publicListingVisibilityWhere },
    select: { id: true },
  });
  if (!listing) {
    throw new HTTPException(404, { message: "Listing not found" });
  }

  const deleted = await prisma.listingRating.deleteMany({
    where: {
      userId: session.user.id,
      listingId: listing.id,
    },
  });
  if (deleted.count === 0) {
    throw new HTTPException(404, { message: "Review not found" });
  }

  await recalculateListingRatingAggregate(listing.id);

  return c.json({ ok: true });
});

catalogRouter.get("/listings/:slug", async (c) => {
  const locale = c.get("locale");
  const slug = c.req.param("slug");
  const now = new Date();
  const listing = await prisma.listing.findFirst({
    where: {
      slug,
      ...publicListingVisibilityWhere,
    },
    include: getListingDetailInclude(now, locale),
  });
  if (!listing) {
    throw new HTTPException(404, { message: "Listing not found" });
  }

  const minPrice = minVariantPrice(listing.variants);
  const promotionPick = pickPromotionForListing(
    listing.promotionListings.map((pp) => pp.promotion),
  );

  const attributes = mapListingAttributeValuesForDetail(
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
      rating: toNumber(listing.rating),
      reviewCount: listing.reviewCount,
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
      images: listing.images.map((i) => i.url),
      variants: listing.variants.map((v) => {
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
      tags: listing.listingTags.map((pt) => {
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
