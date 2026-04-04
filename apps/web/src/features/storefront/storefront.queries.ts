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

export type ProductTagDto = {
  slug: string;
  name: string;
};

export type TagsResponse = {
  tags: ProductTagDto[];
};

export const tagsQuery = (locale: Locale) =>
  queryOptions({
    queryKey: ["tags", locale] as const,
    queryFn: () => apiFetchJson<TagsResponse>("/api/tags", { locale }),
  });

export type ProductPromotionDto = {
  slug: string;
  badgeLabel: string;
  endsAt: string;
};

export type ProductCardDto = {
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
  tags: ProductTagDto[];
  promotion?: ProductPromotionDto;
};

export type FeaturedProductsResponse = { products: ProductCardDto[] };

export const featuredProductsQuery = (locale: Locale, limit = 12) =>
  queryOptions({
    queryKey: ["products", "featured", locale, limit] as const,
    queryFn: () =>
      apiFetchJson<FeaturedProductsResponse>(`/api/products/featured?limit=${limit}`, {
        locale,
      }),
  });

export type ProductSearchResponse = { products: ProductCardDto[] };

export const productSearchQuery = (locale: Locale, q: string, limit = 8) =>
  queryOptions({
    queryKey: ["products", "search", locale, q, limit] as const,
    queryFn: () =>
      apiFetchJson<ProductSearchResponse>(
        `/api/products/search?q=${encodeURIComponent(q)}&limit=${limit}`,
        { locale },
      ),
  });
