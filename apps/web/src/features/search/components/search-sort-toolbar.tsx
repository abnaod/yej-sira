import { ChevronDown } from "lucide-react";

import type { CategorySort } from "@/features/category";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const sortOptions = [
  { value: "relevancy", label: "Relevancy" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "newest", label: "Newest" },
] as const;

type SortValue = (typeof sortOptions)[number]["value"];

export function SearchSortToolbar({
  sort,
  onSortChange,
}: {
  sort: SortValue;
  onSortChange: (sort: CategorySort) => void;
}) {
  const sortLabel =
    sortOptions.find((o) => o.value === sort)?.label ?? "Relevancy";

  return (
    <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-end sm:gap-4">
      <div className="w-fit max-w-full sm:ml-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={cn(
                "inline-flex min-w-0 max-w-full items-center gap-1.5 rounded-full bg-white py-2 pl-4 pr-3 text-sm text-foreground shadow-sm",
                "transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2",
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
              onValueChange={(v) => onSortChange(v as CategorySort)}
            >
              {sortOptions.map((opt) => (
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
