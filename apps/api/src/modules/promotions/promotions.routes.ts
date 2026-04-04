import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

import { prisma } from "../../lib/db.js";
import {
  getProductCardInclude,
  mapProductCard,
  minVariantPrice,
} from "../catalog/product-card.mapper.js";
import { activePromotionWhere, isPromotionActive } from "./promotion.utils.js";
import { promotionDetailQuerySchema } from "./promotions.schema.js";

export const promotionsRouter = new Hono();

promotionsRouter.get("/promotions", async (c) => {
  const now = new Date();
  const rows = await prisma.promotion.findMany({
    where: { ...activePromotionWhere(now) },
    orderBy: [{ sortOrder: "asc" }, { endsAt: "asc" }],
  });

  return c.json({
    promotions: rows.map((p) => ({
      slug: p.slug,
      title: p.title,
      subtitle: p.subtitle ?? undefined,
      badgeLabel: p.badgeLabel,
      endsAt: p.endsAt.toISOString(),
      heroImageUrl: p.heroImageUrl ?? undefined,
    })),
  });
});

promotionsRouter.get("/promotions/:slug", async (c) => {
  const slug = c.req.param("slug");
  const query = promotionDetailQuerySchema.safeParse({
    page: c.req.query("page"),
    pageSize: c.req.query("pageSize"),
  });
  if (!query.success) {
    throw new HTTPException(400, { message: "Invalid query" });
  }
  const { page, pageSize } = query.data;

  const promotion = await prisma.promotion.findUnique({
    where: { slug },
  });
  if (!promotion) {
    throw new HTTPException(404, { message: "Promotion not found" });
  }

  const now = new Date();
  const active = isPromotionActive(promotion, now);
  const cardInclude = getProductCardInclude(now);

  const enrollment = await prisma.promotionProduct.findMany({
    where: { promotionId: promotion.id },
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

  return c.json({
    promotion: {
      slug: promotion.slug,
      title: promotion.title,
      subtitle: promotion.subtitle ?? undefined,
      badgeLabel: promotion.badgeLabel,
      startsAt: promotion.startsAt.toISOString(),
      endsAt: promotion.endsAt.toISOString(),
      heroImageUrl: promotion.heroImageUrl ?? undefined,
      active,
    },
    products: slice.map((x) => {
      const card = mapProductCard(x.enrollment.product);
      if (!active) {
        return card;
      }
      return {
        ...card,
        promotion: {
          slug: promotion.slug,
          badgeLabel: promotion.badgeLabel,
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
