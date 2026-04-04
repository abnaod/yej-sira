import type { Locale } from "@ys/intl";
import { createFileRoute, redirect } from "@tanstack/react-router";

import { parseTagSlugsParam } from "@/features/category";
import type { CategorySort } from "@/features/category";
import { SearchPage, productsSearchQuery } from "@/features/search";
import { tagsQuery } from "@/features/storefront";

const sortValues = ["relevancy", "price-asc", "price-desc", "newest"] as const;

export const Route = createFileRoute("/$locale/search/")({
  validateSearch: (search: Record<string, unknown>) => {
    const sortRaw = search.sort;
    const sort =
      typeof sortRaw === "string" && sortValues.includes(sortRaw as (typeof sortValues)[number])
        ? (sortRaw as (typeof sortValues)[number])
        : "relevancy";
    const q = typeof search.q === "string" ? search.q.trim() : "";
    const tagSlugs =
      typeof search.tagSlugs === "string" && search.tagSlugs.trim()
        ? search.tagSlugs.trim()
        : "";
    const promotionSlug =
      typeof search.promotionSlug === "string" && search.promotionSlug.trim()
        ? search.promotionSlug.trim()
        : undefined;
    return { q, sort: sort as CategorySort, tagSlugs, promotionSlug };
  },
  loaderDeps: ({ search }) => ({
    q: search.q,
    sort: search.sort,
    tagSlugs: search.tagSlugs,
    promotionSlug: search.promotionSlug,
  }),
  beforeLoad: ({ search, params }) => {
    const hasTags = parseTagSlugsParam(search.tagSlugs).length > 0;
    if (search.q.length < 2 && !hasTags) {
      const locale = params.locale as Locale;
      throw redirect({ to: "/$locale", params: { locale } });
    }
  },
  loader: async ({ context, deps, params }) => {
    const locale = params.locale as Locale;
    await Promise.all([
      context.queryClient.ensureQueryData(
        productsSearchQuery(
          locale,
          deps.q,
          deps.sort,
          parseTagSlugsParam(deps.tagSlugs),
          deps.promotionSlug,
        ),
      ),
      context.queryClient.ensureQueryData(tagsQuery(locale)),
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
  component: SearchPage,
});
