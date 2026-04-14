"use client";

import type { Locale } from "@ys/intl";
import { Link } from "@tanstack/react-router";
import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { getSellerOrderColumns } from "../orders/orders-columns";
import type { SellerOrderListItem } from "../orders/orders.queries";
import { SellerShellDataTable } from "../shared/shell-data-table";

const RECENT_LIMIT = 8;

export function SellerDashboardRecentOrders({
  orders,
  isLoading,
  locale,
}: {
  orders: SellerOrderListItem[];
  isLoading: boolean;
  locale: Locale;
}) {
  const columns = useMemo(() => getSellerOrderColumns(locale, { showImage: false }), [locale]);
  const data = useMemo(() => orders.slice(0, RECENT_LIMIT), [orders]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent orders</CardTitle>
        <CardDescription>Newest orders from your shop; open one for full details</CardDescription>
        <CardAction>
          <Button variant="outline" size="sm" asChild>
            <Link to="/$locale/sell/orders" params={{ locale }}>
              View all orders
            </Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-2">
        <SellerShellDataTable
          columns={columns}
          data={data}
          filterColumnId="id"
          filterPlaceholder="Filter by order ID…"
          countNoun="order"
          isLoading={isLoading}
          showFilter={false}
          showPagination={false}
          tableBorder={false}
          showRowBorders={false}
          tableSurfaceClassName="rounded-md bg-gray-50"
          tableHeaderClassName="bg-gray-50"
          tableBodyClassName="bg-white"
        />
      </CardContent>
    </Card>
  );
}
