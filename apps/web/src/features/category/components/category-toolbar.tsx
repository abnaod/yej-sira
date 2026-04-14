import { useSuspenseQuery } from "@tanstack/react-query";
import { ChevronDown, SlidersHorizontal } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CATEGORY_SORT_OPTIONS } from "@/features/category/category.queries";
import { tagsQuery } from "@/features/storefront";
import { useLocale } from "@/lib/locale-path";
import { cn } from "@/lib/utils";

import type { CategoryApplyFilters } from "./category-filter-drawer";
import { CategoryFilterDrawer } from "./category-filter-drawer";

type SortValue = (typeof CATEGORY_SORT_OPTIONS)[number]["value"];

export function CategoryToolbar({
  categoryId,
  sort,
  selectedTagSlugs,
  selectedPromotionSlug,
  onSortChange,
  onApplyFilters,
}: {
  categoryId: string;
  sort: SortValue;
  selectedTagSlugs: string[];
  selectedPromotionSlug?: string;
  onSortChange: (sort: SortValue) => void;
  onApplyFilters: (opts: CategoryApplyFilters) => void;
}) {
  const locale = useLocale();
  const { data: tagsData } = useSuspenseQuery(tagsQuery(locale));
  const sortLabel =
    CATEGORY_SORT_OPTIONS.find((o) => o.value === sort)?.label ?? "Relevancy";

  return (
    <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <CategoryFilterDrawer
        currentCategorySlug={categoryId}
        sort={sort}
        tags={tagsData.tags}
        selectedTagSlugs={selectedTagSlugs}
        selectedPromotionSlug={selectedPromotionSlug}
        onApplyFilters={onApplyFilters}
        trigger={
          <button
            type="button"
            className={cn(
              "inline-flex w-fit items-center gap-2 rounded-full bg-neutral-100 px-4 py-2 text-sm font-medium text-foreground",
              "transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 dark:hover:bg-gray-800",
            )}
          >
            All Filters
            <SlidersHorizontal
              className="h-4 w-4 shrink-0 text-foreground/80"
              aria-hidden
            />
          </button>
        }
      />

      <div className="w-fit max-w-full sm:ml-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={cn(
                "inline-flex min-w-0 max-w-full items-center gap-1.5 rounded-full bg-white py-2 pl-4 pr-3 text-sm text-foreground shadow-sm",
                "transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 dark:hover:bg-gray-800",
              )}
              aria-label="Sort products"
            >
              <span className="shrink-0 text-muted-foreground">Sort by:</span>
              <span className="min-w-0 max-w-48 truncate font-semibold sm:max-w-none">
                {sortLabel}
              </span>
              <ChevronDown
                className="h-4 w-4 shrink-0 text-muted-foreground"
                aria-hidden
              />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 border-none shadow-sm">
            <DropdownMenuRadioGroup
              value={sort}
              onValueChange={(v) => onSortChange(v as SortValue)}
            >
              {CATEGORY_SORT_OPTIONS.map((opt) => (
                <DropdownMenuRadioItem key={opt.value} value={opt.value}>
                  {opt.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
