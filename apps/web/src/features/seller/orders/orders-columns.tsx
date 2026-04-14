import { Link } from "@tanstack/react-router";
import { type ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, ImageIcon } from "lucide-react";

import type { Locale } from "@ys/intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { type SellerOrderListItem } from "./seller-orders.queries";

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(n);
}

function statusBadgeVariant(s: string): "secondary" | "outline" | "default" | "destructive" {
  switch (s) {
    case "paid":
    case "fulfilled":
      return "secondary";
    case "cancelled":
      return "destructive";
    default:
      return "outline";
  }
}

export function getSellerOrderColumns(locale: Locale): ColumnDef<SellerOrderListItem>[] {
  return [
    {
      id: "image",
      header: () => <span className="sr-only">Image</span>,
      cell: ({ row }) => {
        const url = row.original.imageUrl?.trim();
        return (
          <div className="flex items-center">
            <div className="size-12 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
              {url ? (
                <img src={url} alt="" className="size-full object-cover" />
              ) : (
                <div className="flex size-full items-center justify-center text-muted-foreground">
                  <ImageIcon className="size-5" aria-hidden />
                </div>
              )}
            </div>
          </div>
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: "id",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Order
          <ArrowUpDown />
        </Button>
      ),
      cell: ({ row }) => {
        const id = row.original.id;
        const short = id.length > 12 ? `${id.slice(0, 8)}…` : id;
        return (
          <div className="max-w-[min(200px,40vw)] font-mono text-sm" title={id}>
            {short}
          </div>
        );
      },
    },
    {
      id: "createdAt",
      accessorFn: (row) => row.createdAt,
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Date
          <ArrowUpDown />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {new Date(row.original.createdAt).toLocaleString(undefined, {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={statusBadgeVariant(row.original.status)} className="capitalize">
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: "lineCount",
      header: () => <div className="text-right">Items</div>,
      cell: ({ row }) => (
        <div className="text-right tabular-nums">{row.original.lineCount}</div>
      ),
    },
    {
      accessorKey: "shopTotal",
      header: () => <div className="text-right">Your total</div>,
      cell: ({ row }) => (
        <div className="text-right tabular-nums font-medium">
          {formatMoney(row.original.shopTotal)}
        </div>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <Button variant="outline" size="sm" asChild>
          <Link to="/$locale/orders/$orderId" params={{ locale, orderId: row.original.id }}>
            View
          </Link>
        </Button>
      ),
    },
  ];
}
