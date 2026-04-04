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

export const categoriesQuery = () =>
  queryOptions({
    queryKey: ["categories"] as const,
    queryFn: () => apiFetchJson<CategoriesResponse>("/api/categories"),
  });

export type ProductTagDto = {
  slug: string;
  name: string;
};

export type TagsResponse = {
  tags: ProductTagDto[];
};

export const tagsQuery = () =>
  queryOptions({
    queryKey: ["tags"] as const,
    queryFn: () => apiFetchJson<TagsResponse>("/api/tags"),
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
  tags: ProductTagDto[];
  promotion?: ProductPromotionDto;
};

export type FeaturedProductsResponse = { products: ProductCardDto[] };

export const featuredProductsQuery = (limit = 12) =>
  queryOptions({
    queryKey: ["products", "featured", limit] as const,
    queryFn: () =>
      apiFetchJson<FeaturedProductsResponse>(`/api/products/featured?limit=${limit}`),
  });

export type ProductSearchResponse = { products: ProductCardDto[] };

export const productSearchQuery = (q: string, limit = 8) =>
  queryOptions({
    queryKey: ["products", "search", q, limit] as const,
    queryFn: () =>
      apiFetchJson<ProductSearchResponse>(
        `/api/products/search?q=${encodeURIComponent(q)}&limit=${limit}`,
      ),
  });
