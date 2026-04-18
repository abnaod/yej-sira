import type { ContentLocale } from "@prisma/client";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

import { pickPromotionCopy } from "../catalog/catalog.localize";
import { prisma, publicListingVisibilityWhere } from "../../lib/db";
import {
  getListingCardInclude,
  mapListingCard,
  minVariantPrice,
} from "../catalog/catalog.mappers";
import { activePromotionWhere, isPromotionActive } from "./promotions.utils";
import { promotionDetailQuerySchema } from "./promotions.schema";

export const promotionsRouter = new Hono();

promotionsRouter.get("/promotions", async (c) => {
  const locale = c.get("locale");
  const now = new Date();
  const tr =
    locale === "en"
      ? null
      : ({
          where: { locale: locale as ContentLocale },
        } as const);

  const rows = await prisma.promotion.findMany({
    where: { ...activePromotionWhere(now) },
    orderBy: [{ sortOrder: "asc" }, { endsAt: "asc" }],
    ...(tr ? { include: { translations: tr } } : {}),
  });

  return c.json({
    promotions: rows.map((p) => {
      const copy = pickPromotionCopy(
        {
          title: p.title,
          subtitle: p.subtitle,
          badgeLabel: p.badgeLabel,
          translations: (p as { translations?: { title: string; subtitle: string | null; badgeLabel: string }[] })
            .translations ?? [],
        },
        locale,
      );
      return {
        slug: p.slug,
        title: copy.title,
        subtitle: copy.subtitle,
        badgeLabel: copy.badgeLabel,
        endsAt: p.endsAt.toISOString(),
        heroImageUrl: p.heroImageUrl ?? undefined,
      };
    }),
  });
});

promotionsRouter.get("/promotions/:slug", async (c) => {
  const locale = c.get("locale");
  const slug = c.req.param("slug");
  const query = promotionDetailQuerySchema.safeParse({
    page: c.req.query("page"),
    pageSize: c.req.query("pageSize"),
  });
  if (!query.success) {
    throw new HTTPException(400, { message: "Invalid query" });
  }
  const { page, pageSize } = query.data;

  const tr =
    locale === "en"
      ? null
      : ({
          where: { locale: locale as ContentLocale },
        } as const);

  const promotion = await prisma.promotion.findUnique({
    where: { slug },
    ...(tr ? { include: { translations: tr } } : {}),
  });
  if (!promotion) {
    throw new HTTPException(404, { message: "Promotion not found" });
  }

  const now = new Date();
  const active = isPromotionActive(promotion, now);
  const cardInclude = getListingCardInclude(now, locale);

  const enrollment = await prisma.promotionListing.findMany({
    where: {
      promotionId: promotion.id,
      listing: publicListingVisibilityWhere,
    },
    include: {
      listing: {
        include: cardInclude,
      },
    },
    orderBy: { sortOrder: "asc" },
  });

  const withPrice = enrollment.map((e) => ({
    enrollment: e,
    minPrice: minVariantPrice(e.listing.variants),
  }));

  const total = withPrice.length;
  const slice = withPrice.slice((page - 1) * pageSize, page * pageSize);

  const promoCopy = pickPromotionCopy(
    {
      title: promotion.title,
      subtitle: promotion.subtitle,
      badgeLabel: promotion.badgeLabel,
      translations:
        (promotion as { translations?: { title: string; subtitle: string | null; badgeLabel: string }[] })
          .translations ?? [],
    },
    locale,
  );

  return c.json({
    promotion: {
      slug: promotion.slug,
      title: promoCopy.title,
      subtitle: promoCopy.subtitle,
      badgeLabel: promoCopy.badgeLabel,
      startsAt: promotion.startsAt.toISOString(),
      endsAt: promotion.endsAt.toISOString(),
      heroImageUrl: promotion.heroImageUrl ?? undefined,
      active,
    },
    listings: slice.map((x) => {
      const card = mapListingCard(x.enrollment.listing, locale);
      if (!active) {
        return card;
      }
      return {
        ...card,
        promotion: {
          slug: promotion.slug,
          badgeLabel: promoCopy.badgeLabel,
          endsAt: promotion.endsAt.toISOString(),
        },
      };
    }),
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  });
});
