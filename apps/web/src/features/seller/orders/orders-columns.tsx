import { Link } from "@tanstack/react-router";
import { type ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, ImageIcon, MoreHorizontal } from "lucide-react";

import type { Locale } from "@ys/intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { type SellerOrderListItem } from "./orders.queries";

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "ETB",
    currencyDisplay: "code",
    minimumFractionDigits: 2,
  }).format(n);
}

function statusBadgeVariant(s: string): "secondary" | "outline" | "default" | "destructive" | "paid" {
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

export function getSellerOrderColumns(
  locale: Locale,
  options: { showImage?: boolean } = {},
): ColumnDef<SellerOrderListItem>[] {
  const { showImage = true } = options;

  return [
    ...(showImage
      ? [
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
          } satisfies ColumnDef<SellerOrderListItem>,
        ]
      : []),
    {
      accessorKey: "id",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-0 has-[>svg]:px-0"
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
          <Link
            to="/$locale/sell/orders/$orderId"
            params={{ locale, orderId: id }}
            title={id}
            className="max-w-[min(200px,40vw)] cursor-pointer font-mono text-sm font-medium uppercase text-indigo-600 dark:text-indigo-400"
          >
            {short}
          </Link>
        );
      },
    },
    {
      accessorKey: "listingName",
      header: "Listing",
      cell: ({ row }) => {
        const name = row.original.listingName?.trim() || "—";
        const extra = row.original.lineCount > 1 ? row.original.lineCount - 1 : 0;
        return (
          <div className="max-w-[min(260px,45vw)]">
            <span className="line-clamp-2 text-foreground">{name}</span>
            {extra > 0 ? (
              <span className="text-muted-foreground"> +{extra} more</span>
            ) : null}
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
          className="h-8 px-0 has-[>svg]:px-0"
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
      header: "Items",
      cell: ({ row }) => {
        const n = row.original.lineCount;
        const label = n === 1 ? "item" : "items";
        return <span className="tabular-nums">{n} {label}</span>;
      },
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
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link to="/$locale/sell/orders/$orderId" params={{ locale, orderId: row.original.id }}>
                View order
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      enableSorting: false,
      enableHiding: false,
    },
  ];
}
