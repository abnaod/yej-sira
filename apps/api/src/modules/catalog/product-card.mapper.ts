import { toNumber } from "../../lib/money.js";
import {
  activePromotionWhere,
  pickPromotionForProduct,
} from "../promotions/promotion.utils.js";

export const productCardInclude = {
  images: { orderBy: { sortOrder: "asc" as const } },
  variants: true,
  productTags: {
    orderBy: { tag: { name: "asc" as const } },
    include: { tag: true },
  },
} as const;

/** Card list queries: tags + active promotion enrollment for ribbons. */
export function getProductCardInclude(now: Date) {
  return {
    ...productCardInclude,
    promotionProducts: {
      where: {
        promotion: activePromotionWhere(now),
      },
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
  } as const;
}

export function minVariantPrice(variants: { price: unknown }[]) {
  if (variants.length === 0) return 0;
  return Math.min(...variants.map((v) => toNumber(v.price)));
}

type PromotionCardSlice = {
  slug: string;
  badgeLabel: string;
  endsAt: Date;
  priority: number;
};

export function mapProductCard(p: {
  id: string;
  slug: string;
  name: string;
  description: string;
  rating: unknown;
  reviewCount: number;
  images: { url: string }[];
  variants: { id: string; price: unknown; compareAtPrice: unknown | null }[];
  productTags: { tag: { slug: string; name: string } }[];
  promotionProducts?: { promotion: PromotionCardSlice }[];
}) {
  const imageUrl = p.images[0]?.url ?? "";
  const price = minVariantPrice(p.variants);
  const compareValues = p.variants
    .map((v) => (v.compareAtPrice != null ? toNumber(v.compareAtPrice) : null))
    .filter((x): x is number => x != null);
  const originalPrice =
    compareValues.length > 0 ? Math.max(...compareValues, price) : undefined;
  const defaultVariantId = p.variants[0]?.id;
  const promos = p.promotionProducts?.map((pp) => pp.promotion) ?? [];
  const promotion = pickPromotionForProduct(promos);
  const base = {
    id: p.id,
    slug: p.slug,
    defaultVariantId,
    name: p.name,
    price,
    originalPrice: originalPrice && originalPrice > price ? originalPrice : undefined,
    description: p.description,
    imageUrl,
    rating: toNumber(p.rating),
    reviewCount: p.reviewCount,
    tags: p.productTags.map((pt) => ({ slug: pt.tag.slug, name: pt.tag.name })),
  };
  if (!promotion) {
    return base;
  }
  return {
    ...base,
    promotion: {
      slug: promotion.slug,
      badgeLabel: promotion.badgeLabel,
      endsAt: promotion.endsAt.toISOString(),
    },
  };
}
