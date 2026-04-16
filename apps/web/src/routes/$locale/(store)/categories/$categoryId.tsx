import type { Locale } from "@ys/intl";
import { createFileRoute } from "@tanstack/react-router";

import {
  CategoryPage,
  parseTagSlugsParam,
  listingsForCategoryQuery,
  type CategorySort,
} from "@/features/category";
import { promotionsListQuery } from "@/features/promotions/promotions.queries";
import { categoriesQuery, tagsQuery } from "@/features/storefront";

const sortValues = ["relevancy", "price-asc", "price-desc", "newest"] as const;

export const Route = createFileRoute("/$locale/(store)/categories/$categoryId")({
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
    const attributeDefinitionKey =
      typeof search.attributeDefinitionKey === "string" && search.attributeDefinitionKey.trim()
        ? search.attributeDefinitionKey.trim()
        : undefined;
    const allowedValueKey =
      typeof search.allowedValueKey === "string" && search.allowedValueKey.trim()
        ? search.allowedValueKey.trim()
        : undefined;
    if (typeof sort === "string" && sortValues.includes(sort as (typeof sortValues)[number])) {
      return {
        sort: sort as CategorySort,
        tagSlugs,
        promotionSlug,
        attributeDefinitionKey,
        allowedValueKey,
      };
    }
    return {
      sort: "relevancy" as const,
      tagSlugs,
      promotionSlug,
      attributeDefinitionKey,
      allowedValueKey,
    };
  },
  loaderDeps: ({ search }) => ({
    sort: search.sort,
    tagSlugs: search.tagSlugs,
    promotionSlug: search.promotionSlug,
    attributeDefinitionKey: search.attributeDefinitionKey,
    allowedValueKey: search.allowedValueKey,
  }),
  loader: async ({ context, params, deps }) => {
    const locale = params.locale as Locale;
    await Promise.all([
      context.queryClient.ensureQueryData(
        listingsForCategoryQuery(
          locale,
          params.categoryId,
          deps.sort,
          parseTagSlugsParam(deps.tagSlugs),
          deps.promotionSlug,
          deps.attributeDefinitionKey && deps.allowedValueKey
            ? {
                definitionKey: deps.attributeDefinitionKey,
                allowedValueKey: deps.allowedValueKey,
              }
            : undefined,
        ),
      ),
      context.queryClient.ensureQueryData(tagsQuery(locale)),
      context.queryClient.ensureQueryData(categoriesQuery(locale)),
      context.queryClient.ensureQueryData(promotionsListQuery(locale)),
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
