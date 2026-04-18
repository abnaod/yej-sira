import * as React from "react";

import { cn } from "@/lib/utils";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

type DataPaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
  /** Optional text shown on the left (e.g. "Page 1 of 5" or "25 listings"). */
  label?: React.ReactNode;
  /** Maximum number of page links to show (excluding prev/next). Defaults to 7. */
  siblingCount?: number;
};

/**
 * Returns the page numbers to show, inserting `null` where an ellipsis should appear.
 * Ensures first and last pages are always shown when `totalPages` exceeds `maxVisible`.
 */
function buildPageItems(page: number, totalPages: number, maxVisible: number) {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const items: (number | null)[] = [];
  const siblings = Math.max(1, Math.floor((maxVisible - 3) / 2));
  const left = Math.max(2, page - siblings);
  const right = Math.min(totalPages - 1, page + siblings);

  items.push(1);
  if (left > 2) items.push(null);
  for (let i = left; i <= right; i += 1) items.push(i);
  if (right < totalPages - 1) items.push(null);
  items.push(totalPages);

  return items;
}

export function DataPagination({
  page,
  totalPages,
  onPageChange,
  className,
  label,
  siblingCount = 7,
}: DataPaginationProps) {
  if (totalPages <= 1) return null;

  const items = buildPageItems(page, totalPages, siblingCount);
  const canPrev = page > 1;
  const canNext = page < totalPages;

  const go = (target: number) => {
    const clamped = Math.min(totalPages, Math.max(1, target));
    if (clamped !== page) onPageChange(clamped);
  };

  return (
    <div className={cn("flex items-center justify-between gap-2", className)}>
      <p className="text-sm text-muted-foreground">
        {label ?? (
          <>
            Page {page} of {totalPages}
          </>
        )}
      </p>
      <Pagination className="mx-0 w-auto justify-end">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              aria-disabled={!canPrev}
              data-disabled={!canPrev || undefined}
              className={cn(!canPrev && "pointer-events-none opacity-50")}
              onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                e.preventDefault();
                if (canPrev) go(page - 1);
              }}
            />
          </PaginationItem>
          {items.map((item, idx) =>
            item === null ? (
              <PaginationItem key={`ellipsis-${idx}`}>
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={item}>
                <PaginationLink
                  href="#"
                  isActive={item === page}
                  onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                    e.preventDefault();
                    go(item);
                  }}
                >
                  {item}
                </PaginationLink>
              </PaginationItem>
            ),
          )}
          <PaginationItem>
            <PaginationNext
              href="#"
              aria-disabled={!canNext}
              data-disabled={!canNext || undefined}
              className={cn(!canNext && "pointer-events-none opacity-50")}
              onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                e.preventDefault();
                if (canNext) go(page + 1);
              }}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
