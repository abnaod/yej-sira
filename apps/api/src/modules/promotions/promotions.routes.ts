import type { ContentLocale } from "@prisma/client";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

import { pickPromotionCopy } from "../../lib/localized-catalog";
import { prisma, publicProductVisibilityWhere } from "../../lib/db";
import {
  getProductCardInclude,
  mapProductCard,
  minVariantPrice,
} from "../catalog/product-card.mapper";
import { activePromotionWhere, isPromotionActive } from "./promotion.utils";
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
  const cardInclude = getProductCardInclude(now, locale);

  const enrollment = await prisma.promotionProduct.findMany({
    where: {
      promotionId: promotion.id,
      product: publicProductVisibilityWhere,
    },
    include: {
      product: {
        include: cardInclude,
      },
    },
    orderBy: { sortOrder: "asc" },
  });

  const withPrice = enrollment.map((e) => ({
    enrollment: e,
    minPrice: minVariantPrice(e.product.variants),
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
    products: slice.map((x) => {
      const card = mapProductCard(x.enrollment.product, locale);
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
