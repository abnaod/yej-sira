import { ChevronRight } from "lucide-react";
import { Link } from "@tanstack/react-router";

import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  /** TanStack Router path, e.g. `/categories/$categoryId` */
  to?: string;
  params?: Record<string, string>;
  search?: Record<string, string | undefined>;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn("flex items-center gap-1 text-xs text-muted-foreground", className)}>
      {items.map((item, i) => {
        const isLast = i === items.length - 1;

        return (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && (
              <ChevronRight className="h-3 w-3 shrink-0" />
            )}
            {item.to && !isLast ? (
              <Link
                to={item.to}
                params={item.params}
                search={item.search}
                className="transition-colors hover:text-primary"
              >
                {item.label}
              </Link>
            ) : (
              <span className={cn(isLast && "font-semibold text-foreground")}>
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
