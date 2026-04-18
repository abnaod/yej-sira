import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  DollarSign,
  Package,
  ShieldAlert,
  ShoppingBag,
  Store,
  Users,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/locale-path";
import type { Locale } from "@ys/intl";

import { adminStatsQuery } from "./dashboard.queries";
import { formatDateTime, formatMoney, shortId } from "@/features/shared/formatters";

const ICON_ACCENTS = [
  { wrap: "bg-emerald-500/15", fg: "text-emerald-600 dark:text-emerald-400" },
  { wrap: "bg-sky-500/15", fg: "text-sky-600 dark:text-sky-400" },
  { wrap: "bg-violet-500/15", fg: "text-violet-600 dark:text-violet-400" },
  { wrap: "bg-amber-500/15", fg: "text-amber-600 dark:text-amber-400" },
  { wrap: "bg-pink-500/15", fg: "text-pink-600 dark:text-pink-400" },
  { wrap: "bg-indigo-500/15", fg: "text-indigo-600 dark:text-indigo-400" },
] as const;

export function AdminDashboardPage() {
  const locale = useLocale() as Locale;
  const { data, isLoading } = useQuery(adminStatsQuery());

  const items = [
    {
      title: "Revenue (30d)",
      value: formatMoney(data?.revenue30d ?? 0),
      description: "Paid + fulfilled orders",
      icon: DollarSign,
    },
    {
      title: "Orders (30d)",
      value: String(data?.orders30dCount ?? 0),
      description: `${data?.orderCount ?? 0} total`,
      icon: ShoppingBag,
    },
    {
      title: "Users",
      value: String(data?.userCount ?? 0),
      description: "All accounts",
      icon: Users,
    },
    {
      title: "Shops",
      value: String(data?.shopCount ?? 0),
      description: `${data?.pendingShopCount ?? 0} pending review`,
      icon: Store,
    },
    {
      title: "Listings",
      value: String(data?.listingCount ?? 0),
      description: `${data?.publishedListingCount ?? 0} published`,
      icon: Package,
    },
    {
      title: "Pending approvals",
      value: String(data?.pendingShopCount ?? 0),
      description: "Shops awaiting review",
      icon: ShieldAlert,
    },
  ];

  return (
    <div className="@container/main flex flex-1 flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {items.map((item, index) => (
          <Card key={item.title} className="gap-2 py-4">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-0">
              <CardDescription>{item.title}</CardDescription>
              <div
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-lg",
                  ICON_ACCENTS[index % ICON_ACCENTS.length]!.wrap,
                )}
              >
                <item.icon
                  className={cn(
                    "size-4",
                    ICON_ACCENTS[index % ICON_ACCENTS.length]!.fg,
                  )}
                  aria-hidden
                />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {isLoading ? (
                <>
                  <Skeleton className="h-7 w-24" />
                  <Skeleton className="mt-1 h-3 w-32" />
                </>
              ) : (
                <>
                  <p className="text-2xl font-semibold leading-none tracking-tight tabular-nums">
                    {item.value}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.description}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="gap-0 py-4">
        <CardHeader className="pb-2">
          <CardDescription>Recent orders</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : data?.recentOrders && data.recentOrders.length > 0 ? (
            <ul className="divide-y divide-border">
              {data.recentOrders.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-4 py-2">
                  <div className="flex min-w-0 flex-col">
                    <Link
                      to="/$locale/admin/orders/$orderId"
                      params={{ locale, orderId: o.id }}
                      className="truncate font-mono text-sm font-medium uppercase text-indigo-600 hover:underline dark:text-indigo-400"
                    >
                      {shortId(o.id)}
                    </Link>
                    <span className="truncate text-xs text-muted-foreground">
                      {o.user?.email ?? "guest"} · {formatDateTime(o.createdAt)}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-xs capitalize text-muted-foreground">
                      {o.status}
                    </span>
                    <span className="tabular-nums font-medium">
                      {formatMoney(o.total)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-4 text-sm text-muted-foreground">No orders yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
