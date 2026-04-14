import { Link } from "@tanstack/react-router";
import { type ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, ImageIcon } from "lucide-react";

import type { Locale } from "@ys/intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { type SellerProductListItem } from "./seller.queries";

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(n);
}

export function getSellerProductColumns(locale: Locale): ColumnDef<SellerProductListItem>[] {
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
                <img
                  src={url}
                  alt=""
                  className="size-full object-cover"
                />
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
      size: 56,
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Product
          <ArrowUpDown />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="max-w-[min(280px,55vw)] truncate font-medium" title={row.original.name}>
          {row.original.name}
        </div>
      ),
    },
    {
      accessorKey: "isPublished",
      header: "Status",
      cell: ({ row }) =>
        row.original.isPublished ? (
          <Badge variant="secondary">Published</Badge>
        ) : (
          <Badge variant="outline">Draft</Badge>
        ),
    },
    {
      id: "categoryName",
      accessorFn: (row) => row.category.name,
      header: "Category",
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.category.name}</span>
      ),
    },
    {
      accessorKey: "priceFrom",
      header: () => <div className="text-right">From price</div>,
      cell: ({ row }) => (
        <div className="text-right tabular-nums">{formatMoney(row.original.priceFrom)}</div>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <Button variant="outline" size="sm" asChild>
          <Link to="/$locale/sell/products/$productId" params={{ locale, productId: row.original.id }}>
            Edit
          </Link>
        </Button>
      ),
    },
  ];
}
