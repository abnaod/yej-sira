import type { Locale } from "@ys/intl";
import { queryOptions } from "@tanstack/react-query";

import type { ListingCardDto } from "@/features/store/home/home.queries";
import type { CategorySort } from "@/features/store/category";
import { apiFetchJson } from "@/lib/api";

const SHOP_LISTING_SORTS = ["relevancy", "price-asc", "price-desc", "newest"] as const satisfies readonly CategorySort[];

export function parseShopListingSort(raw: unknown): CategorySort {
  const s = typeof raw === "string" ? raw : "";
  return SHOP_LISTING_SORTS.includes(s as CategorySort) ? (s as CategorySort) : "relevancy";
}

export type ShopSocialLinks = {
  website?: string;
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  telegram?: string;
  whatsapp?: string;
};

export type ShopPublicResponse = {
  shop: {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    imageUrl: string | null;
    bannerImageUrl: string | null;
    accentColor: string | null;
    contactEmail: string | null;
    contactPhone: string | null;
    socialLinks: ShopSocialLinks | null;
    city: string | null;
    subcity: string | null;
    createdAt: string;
    /** 0.0–1.0; null when there is no data yet. */
    responseRate: number | null;
    estimatedReplyMinutes: number;
    listingCount: number;
    /** Weighted average listing rating (0–5), null when there are no reviews yet. */
    overallRating: number | null;
    /** Total reviews across published listings in this shop. */
    reviewCount: number;
  };
  listings: ListingCardDto[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export const shopPublicQuery = (
  locale: Locale,
  shopSlug: string,
  page = 1,
  pageSize = 24,
  sort: CategorySort = "relevancy",
) =>
  queryOptions({
    queryKey: ["shop", locale, shopSlug, page, pageSize, sort] as const,
    queryFn: () =>
      apiFetchJson<ShopPublicResponse>(
        `/api/shops/${encodeURIComponent(shopSlug)}?page=${page}&pageSize=${pageSize}&sort=${encodeURIComponent(sort)}`,
        { locale },
      ),
  });
