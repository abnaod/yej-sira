import type { Locale } from "@ys/intl";
import { queryOptions } from "@tanstack/react-query";

import { apiFetchJson } from "@/lib/api";

export type CategoryCardDto = {
  id: string;
  slug: string;
  name: string;
  imageUrl: string;
  sortOrder: number;
};

export type CategoriesResponse = {
  categories: CategoryCardDto[];
};

export const categoriesQuery = (locale: Locale) =>
  queryOptions({
    queryKey: ["categories", locale] as const,
    queryFn: () => apiFetchJson<CategoriesResponse>("/api/categories", { locale }),
  });

export type ListingTagDto = {
  slug: string;
  name: string;
};

export type TagsResponse = {
  tags: ListingTagDto[];
};

export const tagsQuery = (locale: Locale) =>
  queryOptions({
    queryKey: ["tags", locale] as const,
    queryFn: () => apiFetchJson<TagsResponse>("/api/tags", { locale }),
  });

export type ListingPromotionDto = {
  slug: string;
  badgeLabel: string;
  endsAt: string;
};

export type ListingCardDto = {
  id: string;
  slug: string;
  defaultVariantId?: string;
  name: string;
  price: number;
  originalPrice?: number;
  description: string;
  imageUrl: string;
  rating: number;
  reviewCount: number;
  shop: { slug: string; name: string; imageUrl: string | null };
  tags: ListingTagDto[];
  promotion?: ListingPromotionDto;
};

export type FeaturedListingsResponse = { listings: ListingCardDto[] };

export const featuredListingsQuery = (locale: Locale, limit = 12) =>
  queryOptions({
    queryKey: ["listings", "featured", locale, limit] as const,
    queryFn: () =>
      apiFetchJson<FeaturedListingsResponse>(`/api/listings/featured?limit=${limit}`, {
        locale,
      }),
  });

export type ListingSearchResponse = { listings: ListingCardDto[] };

export const listingSearchQuery = (locale: Locale, q: string, limit = 8) =>
  queryOptions({
    queryKey: ["listings", "search", locale, q, limit] as const,
    queryFn: () =>
      apiFetchJson<ListingSearchResponse>(
        `/api/listings/search?q=${encodeURIComponent(q)}&limit=${limit}`,
        { locale },
      ),
  });
