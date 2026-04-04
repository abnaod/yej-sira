import { queryOptions } from "@tanstack/react-query";

import type { ProductCardDto } from "@/features/storefront/storefront.queries";
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

export const promotionsListQuery = () =>
  queryOptions({
    queryKey: ["promotions", "list"] as const,
    queryFn: () => apiFetchJson<PromotionsListResponse>("/api/promotions"),
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
  products: ProductCardDto[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export const promotionDetailQuery = (slug: string) =>
  queryOptions({
    queryKey: ["promotions", "detail", slug] as const,
    queryFn: () =>
      apiFetchJson<PromotionDetailResponse>(
        `/api/promotions/${encodeURIComponent(slug)}`,
      ),
  });
