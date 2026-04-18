import type { Locale } from "@ys/intl";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { DataPagination } from "@/features/shared/data-pagination";
import { authClient } from "@/lib/auth-client";
import { useLocale } from "@/lib/locale-path";
import { getSellerOrderColumns } from "./orders-columns";
import { sellerOrdersQuery } from "./orders.queries";
import { myShopQuery } from "../shared/shop.queries";
import { SellerShellDataTable } from "../shared/shell-data-table";

export function SellerOrdersPage() {
  const locale = useLocale() as Locale;
  const [orderSearch, setOrderSearch] = useState("");
  const [orderPage, setOrderPage] = useState(1);
  const orderPageSize = 25;
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const shopState = useQuery({
    ...myShopQuery(locale),
    enabled: !!session?.user,
  });
  const ordersState = useQuery({
    ...sellerOrdersQuery(locale, {
      page: orderPage,
      pageSize: orderPageSize,
      q: orderSearch.trim() || undefined,
    }),
    enabled: !!session?.user && shopState.data?.shop?.status === "active",
  });

  const columns = useMemo(() => getSellerOrderColumns(locale), [locale]);

  if (sessionPending) {
    return (
      <div className="@container/main flex min-h-0 flex-1 flex-col">
        <SellerShellDataTable
          columns={columns}
          data={[]}
          filterColumnId="id"
          filterPlaceholder="Filter by order ID…"
          countNoun="order"
          isLoading
          loadingTitle="Loading…"
        />
      </div>
    );
  }

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
  const ordersMeta = ordersState.data;

  return (
    <div className="@container/main flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <input
          className="h-8 w-full max-w-sm rounded-md border border-input bg-background px-3 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          placeholder="Search order ID…"
          value={orderSearch}
          onChange={(e) => {
            setOrderSearch(e.target.value);
            setOrderPage(1);
          }}
        />
        <span className="text-xs text-muted-foreground">
          {ordersMeta
            ? `${ordersMeta.total} order${ordersMeta.total === 1 ? "" : "s"}`
            : "…"}
        </span>
      </div>
      <SellerShellDataTable
        columns={columns}
        data={orders}
        filterColumnId="id"
        filterPlaceholder="Filter by order ID…"
        countNoun="order"
        isLoading={ordersLoading}
        showFilter={false}
        showPagination={false}
      />
      {ordersMeta ? (
        <DataPagination
          page={ordersMeta.page}
          totalPages={ordersMeta.totalPages}
          onPageChange={setOrderPage}
        />
      ) : null}
    </div>
  );
}
