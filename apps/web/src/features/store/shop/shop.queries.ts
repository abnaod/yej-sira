import type { Locale } from "@ys/intl";
import { queryOptions } from "@tanstack/react-query";

import type { ListingCardDto } from "@/features/store/home/home.queries";
import { apiFetchJson } from "@/lib/api";

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
  };
  listings: ListingCardDto[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export const shopPublicQuery = (locale: Locale, shopSlug: string, page = 1, pageSize = 24) =>
  queryOptions({
    queryKey: ["shop", locale, shopSlug, page, pageSize] as const,
    queryFn: () =>
      apiFetchJson<ShopPublicResponse>(
        `/api/shops/${encodeURIComponent(shopSlug)}?page=${page}&pageSize=${pageSize}`,
        { locale },
      ),
  });
