import type { ContentLocale } from "@prisma/client";
import type { Locale } from "@ys/intl";

import { toNumber } from "../../lib/money";
import {
  pickProductDescription,
  pickProductName,
  pickTagName,
} from "../../lib/localized-catalog";
import {
  activePromotionWhere,
  pickPromotionForProduct,
} from "../promotions/promotion.utils";

export const productCardInclude = {
  images: { orderBy: { sortOrder: "asc" as const } },
  variants: true,
  productTags: {
    orderBy: { tag: { name: "asc" as const } },
    include: { tag: true },
  },
} as const;

/** Card list queries: tags + active promotion enrollment for ribbons. */
export function getProductCardInclude(now: Date, locale: Locale = "en") {
  const tr =
    locale === "en"
      ? null
      : {
          where: { locale: locale as ContentLocale },
        };

  return {
    shop: { select: { slug: true, name: true, imageUrl: true } },
    images: { orderBy: { sortOrder: "asc" as const } },
    variants: tr ? { include: { translations: tr } } : true,
    ...(tr ? { translations: tr } : {}),
    productTags: {
      orderBy: { tag: { name: "asc" as const } },
      include: {
        tag: tr ? { include: { translations: tr } } : true,
      },
    },
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
            ...(tr
              ? {
                  translations: {
                    ...tr,
                    select: { badgeLabel: true },
                  },
                }
              : {}),
          },
        },
      },
    },
  } as const;
}

export function getProductDetailInclude(now: Date, locale: Locale) {
  const tr =
    locale === "en"
      ? null
      : {
          where: { locale: locale as ContentLocale },
        };

  return {
    shop: { select: { slug: true, name: true, imageUrl: true } },
    category: tr ? { include: { translations: tr } } : true,
    images: { orderBy: { sortOrder: "asc" as const } },
    variants: tr
      ? { orderBy: { label: "asc" as const }, include: { translations: tr } }
      : { orderBy: { label: "asc" as const } },
    ...(tr ? { translations: tr } : {}),
    productTags: {
      orderBy: { tag: { name: "asc" as const } },
      include: {
        tag: tr ? { include: { translations: tr } } : true,
      },
    },
    promotionProducts: {
      where: { promotion: activePromotionWhere(now) },
      include: {
        promotion: {
          select: {
            slug: true,
            badgeLabel: true,
            endsAt: true,
            priority: true,
            ...(tr
              ? {
                  translations: {
                    ...tr,
                    select: { badgeLabel: true },
                  },
                }
              : {}),
          },
        },
      },
    },
    attributeValues: {
      orderBy: { definition: { sortOrder: "asc" as const } },
      include: {
        definition: {
          include: {
            translations: true,
          },
        },
        allowedValue: {
          include: {
            translations: true,
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

export type PromotionCardSlice = {
  slug: string;
  badgeLabel: string;
  endsAt: Date;
  priority: number;
  translations?: { badgeLabel: string }[];
};

export function mapProductCard(
  p: {
    id: string;
    slug: string;
    name: string;
    description: string;
    rating: unknown;
    reviewCount: number;
    shop: { slug: string; name: string; imageUrl: string | null };
    images: { url: string }[];
    variants: { id: string; price: unknown; compareAtPrice: unknown | null }[];
    productTags: {
      tag: {
        slug: string;
        name: string;
        translations?: { name: string }[];
      };
    }[];
    translations?: { name: string; description: string }[];
    promotionProducts?: { promotion: PromotionCardSlice }[];
  },
  locale: Locale,
) {
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
  const tr = p.translations ?? [];
  const name = pickProductName({ name: p.name, translations: tr }, locale);
  const description = pickProductDescription(
    { description: p.description, translations: tr },
    locale,
  );
  const base = {
    id: p.id,
    slug: p.slug,
    defaultVariantId,
    name,
    price,
    originalPrice: originalPrice && originalPrice > price ? originalPrice : undefined,
    description,
    imageUrl,
    rating: toNumber(p.rating),
    reviewCount: p.reviewCount,
    shop: {
      slug: p.shop.slug,
      name: p.shop.name,
      imageUrl: p.shop.imageUrl,
    },
    tags: p.productTags.map((pt) => ({
      slug: pt.tag.slug,
      name: pickTagName(
        {
          name: pt.tag.name,
          translations: pt.tag.translations ?? [],
        },
        locale,
      ),
    })),
  };
  if (!promotion) {
    return base;
  }
  const badgeLabel =
    locale === "en"
      ? promotion.badgeLabel
      : (promotion.translations?.[0]?.badgeLabel ?? promotion.badgeLabel);
  return {
    ...base,
    promotion: {
      slug: promotion.slug,
      badgeLabel,
      endsAt: promotion.endsAt.toISOString(),
    },
  };
}
