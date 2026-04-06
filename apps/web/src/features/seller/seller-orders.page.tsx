import type { Locale } from "@ys/intl";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { useLocale } from "@/lib/locale-path";
import { getSellerOrderColumns } from "./seller-orders-columns";
import { sellerOrdersQuery } from "./seller-orders.queries";
import { myShopQuery } from "./seller-shop.queries";
import { SellerShellDataTable } from "./seller-shell-data-table";

export function SellerOrdersPage() {
  const locale = useLocale() as Locale;
  const { data: session } = authClient.useSession();
  const shopState = useQuery({
    ...myShopQuery(locale),
    enabled: !!session?.user,
  });
  const ordersState = useQuery({
    ...sellerOrdersQuery(locale),
    enabled: !!session?.user && shopState.data?.shop?.status === "active",
  });

  const columns = useMemo(() => getSellerOrderColumns(locale), [locale]);

  if (!session?.user) {
    return (
      <div className="mx-auto max-w-3xl px-4">
        <p className="text-muted-foreground">Sign in to view orders for your shop.</p>
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
          <Link to="/$locale/sell/register" params={{ locale }}>
            Register your shop
          </Link>
        </Button>
      </div>
    );
  }

  if (shop.status !== "active") {
    return (
      <div className="mx-auto max-w-3xl px-4">
        <p className="text-muted-foreground">
          Your shop is {shop.status}. Orders appear here once your shop is active.
        </p>
      </div>
    );
  }

  const orders = ordersState.data?.orders ?? [];
  const ordersLoading = ordersState.isLoading;

  return (
    <div className="@container/main flex flex-1 flex-col">
      {ordersLoading ? (
        <p className="text-sm text-muted-foreground">Loading orders…</p>
      ) : (
        <SellerShellDataTable
          columns={columns}
          data={orders}
          filterColumnId="id"
          filterPlaceholder="Filter by order ID…"
          countNoun="order"
        />
      )}
    </div>
  );
}
