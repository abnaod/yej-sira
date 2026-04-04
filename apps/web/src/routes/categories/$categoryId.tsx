import { createFileRoute } from "@tanstack/react-router";

import {
  CategoryPage,
  parseTagSlugsParam,
  productsForCategoryQuery,
  type CategorySort,
} from "@/features/category";
import { promotionsListQuery } from "@/features/promotions/promotions.queries";
import { categoriesQuery, tagsQuery } from "@/features/storefront";

const sortValues = ["relevancy", "price-asc", "price-desc", "newest"] as const;

export const Route = createFileRoute("/categories/$categoryId")({
  validateSearch: (search: Record<string, unknown>) => {
    const sort = search.sort;
    const tagSlugs =
      typeof search.tagSlugs === "string" && search.tagSlugs.trim()
        ? search.tagSlugs.trim()
        : "";
    const promotionSlug =
      typeof search.promotionSlug === "string" && search.promotionSlug.trim()
        ? search.promotionSlug.trim()
        : undefined;
    if (typeof sort === "string" && sortValues.includes(sort as (typeof sortValues)[number])) {
      return { sort: sort as CategorySort, tagSlugs, promotionSlug };
    }
    return { sort: "relevancy" as const, tagSlugs, promotionSlug };
  },
  loaderDeps: ({ search }) => ({
    sort: search.sort,
    tagSlugs: search.tagSlugs,
    promotionSlug: search.promotionSlug,
  }),
  loader: async ({ context, params, deps }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(
        productsForCategoryQuery(
          params.categoryId,
          deps.sort,
          parseTagSlugsParam(deps.tagSlugs),
          deps.promotionSlug,
        ),
      ),
      context.queryClient.ensureQueryData(tagsQuery()),
      context.queryClient.ensureQueryData(categoriesQuery()),
      context.queryClient.ensureQueryData(promotionsListQuery()),
    ]);
  },
  pendingComponent: () => (
    <main className="p-8 text-muted-foreground">Loading…</main>
  ),
  errorComponent: ({ error }) => (
    <main className="p-8 text-destructive">
      {error instanceof Error ? error.message : "Something went wrong"}
    </main>
  ),
  component: CategoryPage,
});
