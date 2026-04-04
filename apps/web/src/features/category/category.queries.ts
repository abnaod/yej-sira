import type { Locale } from "@ys/intl";
import { queryOptions } from "@tanstack/react-query";

import type { ProductCardDto } from "@/features/storefront";
import { apiFetchJson } from "@/lib/api";

export type ProductsListResponse = {
  products: ProductCardDto[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type CategorySort = "relevancy" | "price-asc" | "price-desc" | "newest";

export const CATEGORY_SORT_OPTIONS = [
  { value: "relevancy", label: "Relevancy" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "newest", label: "Newest" },
] as const;

/** Comma-separated tag slugs from URL search params. */
export function parseTagSlugsParam(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export const productsForCategoryQuery = (
  locale: Locale,
  categorySlug: string,
  sort: CategorySort,
  tagSlugs: string[] = [],
  promotionSlug?: string,
  attributeFacet?: { definitionKey: string; allowedValueKey: string },
) =>
  queryOptions({
    queryKey: [
      "products",
      categorySlug,
      locale,
      sort,
      tagSlugs,
      promotionSlug ?? null,
      attributeFacet?.definitionKey ?? null,
      attributeFacet?.allowedValueKey ?? null,
    ] as const,
    queryFn: () => {
      const params = new URLSearchParams({
        categorySlug,
        sort,
        page: "1",
        pageSize: "48",
      });
      if (tagSlugs.length > 0) {
        params.set("tagSlugs", tagSlugs.join(","));
      }
      if (promotionSlug) {
        params.set("promotionSlug", promotionSlug);
      }
      if (attributeFacet) {
        params.set("attributeDefinitionKey", attributeFacet.definitionKey);
        params.set("allowedValueKey", attributeFacet.allowedValueKey);
      }
      return apiFetchJson<ProductsListResponse>(`/api/products?${params.toString()}`, {
        locale,
      });
    },
  });
