import { useQuery } from "@tanstack/react-query";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { SlidersHorizontal } from "lucide-react";

import type { CategoryApplyFilters } from "@/features/store/category/components/category-filter-drawer";
import { CategoryFilterDrawer } from "@/features/store/category/components/category-filter-drawer";
import type { CategorySort } from "@/features/store/category/category.queries";
import { parseTagSlugsParam } from "@/features/store/category/category.queries";
import { categoriesQuery, tagsQuery } from "@/features/store/home";
import { useLocale } from "@/lib/locale-path";
import { cn } from "@/lib/utils";

export function HeaderFilter() {
  const locale = useLocale();
  const navigate = useNavigate();
  const searchMatch = useRouterState({
    select: (s) =>
      s.matches.find((m) => {
        const search = m.search as { q?: string } | undefined;
        return Boolean(search && "q" in search && m.pathname.includes("/search"));
      }),
  });
  const categoryMatch = useRouterState({
    select: (s) =>
      s.matches.find((m) => {
        const p = m.params as { categoryId?: string };
        return Boolean(p.categoryId && m.pathname.includes("/categories/"));
      }),
  });

  const { data: tagsData } = useQuery(tagsQuery(locale));
  const { data: categoriesData } = useQuery(categoriesQuery(locale));

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
    currentCategorySlug = (categoryMatch.params as { categoryId: string }).categoryId;
    selectedTagSlugs = parseTagSlugsParam(s.tagSlugs);
    sort = s.sort ?? "relevancy";
    promotionSlug = s.promotionSlug;
  }

  const handleApplyFilters = (filters: CategoryApplyFilters) => {
    const nextTagSlugs =
      filters.tagSlugs.length > 0 ? filters.tagSlugs.join(",") : "";

    const facetFromCategory =
      categoryMatch &&
      (categoryMatch.search as {
        attributeDefinitionKey?: string;
        allowedValueKey?: string;
      });

    const categorySearch = {
      sort: filters.sort,
      tagSlugs: nextTagSlugs,
      promotionSlug: filters.promotionSlug,
      attributeDefinitionKey: facetFromCategory?.attributeDefinitionKey,
      allowedValueKey: facetFromCategory?.allowedValueKey,
    };

    if (searchMatch) {
      const s = searchMatch.search as { q: string };
      if (filters.categorySlug) {
        void navigate({
          to: "/$locale/categories/$categoryId",
          params: { locale, categoryId: filters.categorySlug },
          search: categorySearch,
        });
        return;
      }
      void navigate({
        to: "/$locale/search",
        params: { locale },
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
          to: "/$locale/categories/$categoryId",
          params: { locale, categoryId: filters.categorySlug },
          search: categorySearch,
        });
        return;
      }
      if (filters.tagSlugs.length > 0) {
        void navigate({
          to: "/$locale/search",
          params: { locale },
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
            to: "/$locale/categories/$categoryId",
            params: { locale, categoryId: firstSlug },
            search: {
              sort: filters.sort,
              tagSlugs: "",
              promotionSlug: filters.promotionSlug,
              attributeDefinitionKey: undefined,
              allowedValueKey: undefined,
            },
          });
        }
        return;
      }
      const firstSlug = categoriesData?.categories[0]?.slug;
      if (firstSlug) {
        void navigate({
          to: "/$locale/categories/$categoryId",
          params: { locale, categoryId: firstSlug },
          search: {
            sort: filters.sort,
            tagSlugs: "",
            promotionSlug: undefined,
            attributeDefinitionKey: undefined,
            allowedValueKey: undefined,
          },
        });
      }
      return;
    }

    if (categoryMatch) {
      void navigate({
        to: "/$locale/categories/$categoryId",
        params: {
          locale,
          categoryId: filters.categorySlug || currentCategorySlug,
        },
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
            "inline-flex h-9 shrink-0 items-center justify-center rounded-l-md rounded-r-none border border-r-0 border-input bg-transparent px-3 text-muted-foreground transition-colors hover:bg-gray-100 hover:text-primary dark:hover:bg-gray-800",
            "focus-visible:z-10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40",
          )}
          aria-label="Filters"
        >
          <SlidersHorizontal className="h-4 w-4" aria-hidden />
        </button>
      }
    />
  );
}
