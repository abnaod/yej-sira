import { Package, Store } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** Distinct soft tints behind each stat icon (revenue → published). */
const ICON_ACCENTS = [
  { wrap: "bg-emerald-500/15", fg: "text-emerald-600 dark:text-emerald-400" },
  { wrap: "bg-sky-500/15", fg: "text-sky-600 dark:text-sky-400" },
  { wrap: "bg-violet-500/15", fg: "text-violet-600 dark:text-violet-400" },
  { wrap: "bg-amber-500/15", fg: "text-amber-600 dark:text-amber-400" },
] as const;

export type SellerDashboardStats = {
  listingCount: number;
  publishedCount: number;
};

export function SellerDashboardSectionCards({
  stats,
  isLoading,
  className,
}: {
  stats: SellerDashboardStats | undefined;
  isLoading: boolean;
  className?: string;
}) {
  if (isLoading) {
    return (
      <div className={cn("grid gap-4 sm:grid-cols-2", className)}>
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i} className="gap-2 py-4">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-0">
              <Skeleton className="h-4 w-24" />
              <div
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-lg",
                  ICON_ACCENTS[i]!.wrap
                )}
              >
                <Skeleton className="size-4 rounded-md" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="mt-1 h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const listings = stats?.listingCount ?? 0;
  const published = stats?.publishedCount ?? 0;

  const items = [
    {
      title: "Listings",
      value: String(listings),
      description: "In your catalog",
      icon: Package,
    },
    {
      title: "Published",
      value: String(published),
      description: "Live listings",
      icon: Store,
    },
  ];

  return (
    <div className={cn("grid gap-4 sm:grid-cols-2", className)}>
      {items.map((item, index) => (
        <Card key={item.title} className="gap-2 py-4">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-0">
            <CardDescription>{item.title}</CardDescription>
            <div
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-lg",
                ICON_ACCENTS[index]!.wrap
              )}
            >
              <item.icon
                className={cn("size-4", ICON_ACCENTS[index]!.fg)}
                aria-hidden
              />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-2xl font-semibold leading-none tracking-tight tabular-nums">{item.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
