import { queryOptions } from "@tanstack/react-query";

import type { CategorySort } from "@/features/category";
import type { ProductsListResponse } from "@/features/category/category.queries";
import { apiFetchJson } from "@/lib/api";

export const productsSearchQuery = (
  q: string,
  sort: CategorySort,
  tagSlugs: string[] = [],
  promotionSlug?: string,
) =>
  queryOptions({
    queryKey: ["products", "search", "list", q, sort, tagSlugs, promotionSlug ?? null] as const,
    queryFn: () => {
      const params = new URLSearchParams({
        q,
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
      return apiFetchJson<ProductsListResponse>(`/api/products?${params.toString()}`);
    },
  });
