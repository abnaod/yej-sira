import type { Locale } from "@ys/intl";
import { queryOptions } from "@tanstack/react-query";

import type { CategorySort } from "@/features/store/category";
import type { ListingsListResponse } from "@/features/store/category/category.queries";
import { apiFetchJson } from "@/lib/api";

export const listingsSearchQuery = (
  locale: Locale,
  q: string,
  sort: CategorySort,
  tagSlugs: string[] = [],
  promotionSlug?: string,
) =>
  queryOptions({
    queryKey: ["listings", "search", "list", locale, q, sort, tagSlugs, promotionSlug ?? null] as const,
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
      return apiFetchJson<ListingsListResponse>(`/api/listings?${params.toString()}`, {
        locale,
      });
    },
  });
