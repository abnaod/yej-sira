import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { type ColumnDef } from "@tanstack/react-table";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataPagination } from "@/features/shared/data-pagination";
import { useLocale } from "@/lib/locale-path";
import type { Locale } from "@ys/intl";

import { SellerShellDataTable } from "@/features/seller/shared/shell-data-table";
import {
  adminOrdersQuery,
  type AdminOrderListItem,
} from "./orders.queries";
import { formatDateTime, formatMoney, shortId } from "@/features/shared/formatters";

type Status = AdminOrderListItem["status"];

const ALL_STATUSES: Status[] = [
  "pending",
  "awaiting_payment",
  "paid",
  "fulfilled",
  "cancelled",
];

function statusVariant(
  s: Status,
): "default" | "secondary" | "outline" | "destructive" | "paid" {
  switch (s) {
    case "paid":
      return "paid";
    case "fulfilled":
      return "secondary";
    case "cancelled":
      return "destructive";
    default:
      return "outline";
  }
}

function getColumns(locale: Locale): ColumnDef<AdminOrderListItem>[] {
  return [
    {
      accessorKey: "id",
      header: "Order",
      cell: ({ row }) => (
        <Link
          to="/$locale/admin/orders/$orderId"
          params={{ locale, orderId: row.original.id }}
          className="font-mono text-sm font-medium uppercase text-indigo-600 hover:underline dark:text-indigo-400"
          title={row.original.id}
        >
          {shortId(row.original.id)}
        </Link>
      ),
    },
    {
      accessorKey: "user",
      header: "Customer",
      cell: ({ row }) => (
        <div className="min-w-0">
          <p className="truncate text-sm">{row.original.user.name || "—"}</p>
          <p className="truncate text-xs text-muted-foreground">{row.original.user.email}</p>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={statusVariant(row.original.status)} className="capitalize">
          {row.original.status.replace(/_/g, " ")}
        </Badge>
      ),
    },
    {
      accessorKey: "itemCount",
      header: "Items",
      cell: ({ row }) => (
        <span className="tabular-nums">
          {row.original.itemCount} {row.original.itemCount === 1 ? "item" : "items"}
        </span>
      ),
    },
    {
      accessorKey: "total",
      header: () => <div className="text-right">Total</div>,
      cell: ({ row }) => (
        <div className="text-right tabular-nums font-medium">
          {formatMoney(row.original.total)}
        </div>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Placed",
      cell: ({ row }) => (
        <span className="text-muted-foreground">{formatDateTime(row.original.createdAt)}</span>
      ),
    },
  ];
}

export function AdminOrdersPage() {
  const locale = useLocale() as Locale;
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState<Status | "all">("all");
  const [page, setPage] = React.useState(1);

  const columns = React.useMemo(() => getColumns(locale), [locale]);

  const { data, isLoading } = useQuery(
    adminOrdersQuery({
      q: search || undefined,
      status: status === "all" ? undefined : status,
      page,
      pageSize: 25,
    }),
  );

  return (
    <div className="@container/main flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          className="h-8 w-full max-w-sm rounded-md border border-input bg-background px-3 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          placeholder="Search order ID, customer…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <div className="flex flex-wrap gap-1">
          {(["all", ...ALL_STATUSES] as const).map((s) => (
            <Button
              key={s}
              variant={status === s ? "default" : "outline"}
              size="sm"
              className="h-8 capitalize"
              onClick={() => {
                setStatus(s);
                setPage(1);
              }}
            >
              {s.replace(/_/g, " ")}
            </Button>
          ))}
        </div>
        <span className="ml-auto text-xs text-muted-foreground">
          {data ? `${data.total} order${data.total === 1 ? "" : "s"}` : "…"}
        </span>
      </div>

      <SellerShellDataTable
        columns={columns}
        data={data?.orders ?? []}
        filterColumnId="id"
        filterPlaceholder=""
        countNoun="order"
        isLoading={isLoading}
        showFilter={false}
        showPagination={false}
      />

      {data ? (
        <DataPagination page={data.page} totalPages={data.totalPages} onPageChange={setPage} />
      ) : null}
    </div>
  );
}
