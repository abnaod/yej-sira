import { Link } from "@tanstack/react-router";
import { type ColumnDef } from "@tanstack/react-table";
import {
  ArrowUpDown,
  Eye,
  ImageIcon,
  Loader2,
  MoreHorizontal,
  Pencil,
  Rocket,
  Trash2,
} from "lucide-react";

import type { Locale } from "@ys/intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { type SellerProductListItem } from "./products.queries";

export type SellerProductTableActions = {
  onDeleteProduct: (productId: string) => void;
  deletingProductId: string | null;
  onPublishProduct: (productId: string) => void;
  publishingProductId: string | null;
};

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(n);
}

export function getSellerProductColumns(
  locale: Locale,
  actions: SellerProductTableActions,
): ColumnDef<SellerProductListItem>[] {
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
          className="h-8 px-0 has-[>svg]:px-0"
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
          <Badge variant="success">Published</Badge>
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
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => {
        const id = row.original.id;
        const slug = row.original.slug;
        const isPublished = row.original.isPublished;
        const isDeleting = actions.deletingProductId === id;
        const isPublishing = actions.publishingProductId === id;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-42">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                {isPublished ? (
                  <Link
                    to="/$locale/products/$productId"
                    params={{ locale, productId: slug }}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Eye />
                    Preview
                  </Link>
                ) : (
                  <Link
                    to="/$locale/preview/products/$productId"
                    params={{ locale, productId: id }}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Eye />
                    Preview
                  </Link>
                )}
              </DropdownMenuItem>
              {!isPublished && (
                <DropdownMenuItem
                  disabled={isPublishing}
                  onClick={() => actions.onPublishProduct(id)}
                >
                  {isPublishing ? <Loader2 className="animate-spin" /> : <Rocket />}
                  {isPublishing ? "Publishing…" : "Publish"}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem asChild>
                <Link to="/$locale/sell/products" params={{ locale }} search={{ new: false, edit: id }}>
                  <Pencil />
                  Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                disabled={isDeleting}
                onClick={() => actions.onDeleteProduct(id)}
              >
                {isDeleting ? <Loader2 className="animate-spin" /> : <Trash2 />}
                {isDeleting ? "Deleting…" : "Delete"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
  ];
}
