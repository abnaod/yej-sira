import type { Locale } from "@ys/intl";
import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { authClient } from "@/lib/auth-client";
import { useLocale } from "@/lib/locale-path";
import { featureCartCheckout, featureConversations } from "@/lib/features";
import { sellerDashboardQuery } from "./dashboard.queries";
import { SellerDashboardSectionCards } from "./dashboard-section-cards";
import { SellerMessageMetricsCards } from "./message-metrics-cards";
import { SellerDashboardRecentOrders } from "./recent-orders-card";
import { sellerOrdersQuery } from "../orders/orders.queries";
import { myShopQuery } from "../shared/shop.queries";

const SellerOrdersChart = React.lazy(() =>
  import("./orders-chart").then((m) => ({ default: m.SellerOrdersChart })),
);

export function SellerDashboardPage() {
  const locale = useLocale() as Locale;
  const { data: session } = authClient.useSession();
  const shopState = useQuery({
    ...myShopQuery(locale),
    enabled: !!session?.user,
  });
  const shopStatus = shopState.data?.shop?.status;
  const sellerCanUsePortal =
    shopStatus === "active" || shopStatus === "pending";

  const dashboardState = useQuery({
    ...sellerDashboardQuery(locale),
    enabled: !!session?.user && sellerCanUsePortal,
  });
  const recentOrdersState = useQuery({
    ...sellerOrdersQuery(locale, { page: 1, pageSize: 8 }),
    enabled: !!session?.user && sellerCanUsePortal,
  });
  if (!session?.user) {
    return (
      <div className="mx-auto max-w-3xl px-4">
        <p className="text-muted-foreground">Sign in to manage your listings.</p>
      </div>
    );
  }

  const shop = shopState.data?.shop;
  if (shopState.isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!shop || shop === null) {
    return (
      <div className="mx-auto max-w-3xl px-4">
        <p className="text-muted-foreground">You don&apos;t have a shop yet.</p>
        <Button className="mt-4" asChild>
          <Link to="/$locale/sell/onboarding" params={{ locale }}>
            Register your shop
          </Link>
        </Button>
      </div>
    );
  }

  if (shop.status === "rejected" || shop.status === "suspended") {
    return (
      <div className="mx-auto max-w-3xl px-4">
        <p className="text-muted-foreground">
          Your shop is {shop.status}. Contact support if you believe this is an error.
        </p>
      </div>
    );
  }

  const stats = dashboardState.data;
  const dashboardLoading = dashboardState.isLoading;

  return (
    <div className="@container/main flex flex-1 flex-col gap-4">
      {featureConversations && !featureCartCheckout ? <SellerMessageMetricsCards /> : null}

      <SellerDashboardSectionCards
        stats={
          stats
            ? {
                revenue30d: stats.revenue30d,
                orders30d: stats.orders30d,
                listingCount: stats.listingCount,
                publishedCount: stats.publishedCount,
              }
            : undefined
        }
        isLoading={dashboardLoading}
      />

      <React.Suspense
        fallback={
          <div className="rounded-lg border bg-card p-6">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="mt-2 h-4 w-64" />
            <Skeleton className="mt-6 h-[250px] w-full" />
          </div>
        }
      >
        <SellerOrdersChart data={stats?.ordersByDay ?? []} isLoading={dashboardLoading} />
      </React.Suspense>

      <SellerDashboardRecentOrders
        orders={recentOrdersState.data?.orders ?? []}
        isLoading={recentOrdersState.isLoading}
        locale={locale}
      />
    </div>
  );
}
