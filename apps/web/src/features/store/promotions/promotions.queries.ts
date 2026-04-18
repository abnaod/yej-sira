import type { Locale } from "@ys/intl";
import { queryOptions } from "@tanstack/react-query";

import type { ListingCardDto } from "@/features/store/home/home.queries";
import { apiFetchJson } from "@/lib/api";

export type PromotionSummaryDto = {
  slug: string;
  title: string;
  subtitle?: string;
  badgeLabel: string;
  endsAt: string;
  heroImageUrl?: string;
};

export type PromotionsListResponse = {
  promotions: PromotionSummaryDto[];
};

export const promotionsListQuery = (locale: Locale) =>
  queryOptions({
    queryKey: ["promotions", "list", locale] as const,
    queryFn: () => apiFetchJson<PromotionsListResponse>("/api/promotions", { locale }),
  });

export type PromotionDetailResponse = {
  promotion: {
    slug: string;
    title: string;
    subtitle?: string;
    badgeLabel: string;
    startsAt: string;
    endsAt: string;
    heroImageUrl?: string;
    active: boolean;
  };
  listings: ListingCardDto[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export const promotionDetailQuery = (locale: Locale, slug: string) =>
  queryOptions({
    queryKey: ["promotions", "detail", locale, slug] as const,
    queryFn: () =>
      apiFetchJson<PromotionDetailResponse>(
        `/api/promotions/${encodeURIComponent(slug)}`,
        { locale },
      ),
  });
