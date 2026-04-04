import { useQuery } from "@tanstack/react-query";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { SlidersHorizontal } from "lucide-react";

import type { CategoryApplyFilters } from "@/features/category/components/category-filter-drawer";
import { CategoryFilterDrawer } from "@/features/category/components/category-filter-drawer";
import type { CategorySort } from "@/features/category/category.queries";
import { parseTagSlugsParam } from "@/features/category/category.queries";
import { categoriesQuery, tagsQuery } from "@/features/storefront";
import { cn } from "@/lib/utils";

export function HeaderFilter() {
  const navigate = useNavigate();
  const searchMatch = useRouterState({
    select: (s) => s.matches.find((m) => m.routeId === "/search/"),
  });
  const categoryMatch = useRouterState({
    select: (s) => s.matches.find((m) => m.routeId === "/categories/$categoryId"),
  });

  const { data: tagsData } = useQuery(tagsQuery());
  const { data: categoriesData } = useQuery(categoriesQuery());

  const tags = tagsData?.tags ?? [];

  let selectedTagSlugs: string[] = [];
  let sort: CategorySort = "relevancy";
  let promotionSlug: string | undefined;
  let currentCategorySlug = "";

  if (searchMatch) {
    const s = searchMatch.search as {
      q: string;
      tagSlugs: string;
      sort: CategorySort;
      promotionSlug?: string;
    };
    selectedTagSlugs = parseTagSlugsParam(s.tagSlugs);
    sort = s.sort ?? "relevancy";
    promotionSlug = s.promotionSlug;
  } else if (categoryMatch) {
    const s = categoryMatch.search as {
      tagSlugs: string;
      sort: CategorySort;
      promotionSlug?: string;
    };
    currentCategorySlug = categoryMatch.params.categoryId;
    selectedTagSlugs = parseTagSlugsParam(s.tagSlugs);
    sort = s.sort ?? "relevancy";
    promotionSlug = s.promotionSlug;
  }

  const handleApplyFilters = (filters: CategoryApplyFilters) => {
    const nextTagSlugs =
      filters.tagSlugs.length > 0 ? filters.tagSlugs.join(",") : "";

    const categorySearch = {
      sort: filters.sort,
      tagSlugs: nextTagSlugs,
      promotionSlug: filters.promotionSlug,
    };

    if (searchMatch) {
      const s = searchMatch.search as { q: string };
      if (filters.categorySlug) {
        void navigate({
          to: "/categories/$categoryId",
          params: { categoryId: filters.categorySlug },
          search: categorySearch,
        });
        return;
      }
      void navigate({
        to: "/search",
        search: {
          q: s.q,
          sort: filters.sort,
          tagSlugs: nextTagSlugs,
          promotionSlug: filters.promotionSlug,
        },
      });
      return;
    }

    if (!searchMatch && !categoryMatch) {
      if (filters.categorySlug) {
        void navigate({
          to: "/categories/$categoryId",
          params: { categoryId: filters.categorySlug },
          search: categorySearch,
        });
        return;
      }
      if (filters.tagSlugs.length > 0) {
        void navigate({
          to: "/search",
          search: {
            q: "",
            sort: filters.sort,
            tagSlugs: nextTagSlugs,
            promotionSlug: filters.promotionSlug,
          },
        });
        return;
      }
      if (filters.promotionSlug) {
        const firstSlug = categoriesData?.categories[0]?.slug;
        if (firstSlug) {
          void navigate({
            to: "/categories/$categoryId",
            params: { categoryId: firstSlug },
            search: {
              sort: filters.sort,
              tagSlugs: "",
              promotionSlug: filters.promotionSlug,
            },
          });
        }
        return;
      }
      const firstSlug = categoriesData?.categories[0]?.slug;
      if (firstSlug) {
        void navigate({
          to: "/categories/$categoryId",
          params: { categoryId: firstSlug },
          search: {
            sort: filters.sort,
            tagSlugs: "",
            promotionSlug: undefined,
          },
        });
      }
      return;
    }

    if (categoryMatch) {
      void navigate({
        to: "/categories/$categoryId",
        params: { categoryId: filters.categorySlug || categoryMatch.params.categoryId },
        search: categorySearch,
      });
    }
  };

  return (
    <CategoryFilterDrawer
      currentCategorySlug={currentCategorySlug}
      sort={sort}
      tags={tags}
      selectedTagSlugs={selectedTagSlugs}
      selectedPromotionSlug={promotionSlug}
      onApplyFilters={handleApplyFilters}
      trigger={
        <button
          type="button"
          className={cn(
            "inline-flex shrink-0 items-center justify-center rounded-md p-1.5 text-foreground transition-colors hover:bg-neutral-100 hover:text-primary",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
          )}
          aria-label="Filters"
        >
          <SlidersHorizontal className="h-4 w-4" aria-hidden />
        </button>
      }
    />
  );
}
