import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { type ColumnDef } from "@tanstack/react-table";
import { ImageIcon, MoreHorizontal } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { assetUrl } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataPagination } from "@/features/shared/data-pagination";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocale } from "@/lib/locale-path";
import type { Locale } from "@ys/intl";

import { SellerShellDataTable } from "@/features/seller/shared/shell-data-table";
import {
  adminListingsQuery,
  deleteAdminListingMutation,
  updateAdminListingMutation,
  type AdminListingListItem,
} from "./listings.queries";
import { formatDateTime, formatMoney } from "@/features/shared/formatters";

function ListingActions({ listing }: { listing: AdminListingListItem }) {
  const queryClient = useQueryClient();
  const updateMutation = useMutation(updateAdminListingMutation(queryClient));
  const deleteMutation = useMutation(deleteAdminListingMutation(queryClient));
  const locale = useLocale() as Locale;

  return (
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
          <Link
            to="/$locale/listings/$listingId"
            params={{ locale, listingId: listing.slug }}
          >
            View on storefront
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={updateMutation.isPending}
          onSelect={(e) => {
            e.preventDefault();
            updateMutation.mutate(
              { id: listing.id, isPublished: !listing.isPublished },
              {
                onSuccess: () =>
                  toast.success(listing.isPublished ? "Unpublished" : "Published"),
                onError: (err: unknown) =>
                  toast.error(err instanceof Error ? err.message : "Failed"),
              },
            );
          }}
        >
          {listing.isPublished ? "Unpublish" : "Publish"}
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={updateMutation.isPending}
          onSelect={(e) => {
            e.preventDefault();
            updateMutation.mutate(
              { id: listing.id, featured: !listing.featured },
              {
                onSuccess: () =>
                  toast.success(listing.featured ? "Unfeatured" : "Featured"),
                onError: (err: unknown) =>
                  toast.error(err instanceof Error ? err.message : "Failed"),
              },
            );
          }}
        >
          {listing.featured ? "Unfeature" : "Feature"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={deleteMutation.isPending}
          onSelect={(e) => {
            e.preventDefault();
            if (!window.confirm(`Delete listing "${listing.name}"? This cannot be undone.`))
              return;
            deleteMutation.mutate(listing.id, {
              onSuccess: () => toast.success("Listing deleted"),
              onError: (err: unknown) =>
                toast.error(err instanceof Error ? err.message : "Failed to delete"),
            });
          }}
          className="text-destructive focus:text-destructive"
        >
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const columns: ColumnDef<AdminListingListItem>[] = [
  {
    id: "image",
    header: () => <span className="sr-only">Image</span>,
    cell: ({ row }) => {
      const url = row.original.imageUrl?.trim();
      return (
        <div className="size-12 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
          {url ? (
            <img src={assetUrl(url)} alt="" className="size-full object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center text-muted-foreground">
              <ImageIcon className="size-5" aria-hidden />
            </div>
          )}
        </div>
      );
    },
    enableSorting: false,
  },
  {
    accessorKey: "name",
    header: "Listing",
    cell: ({ row }) => (
      <div className="min-w-0">
        <p className="truncate font-medium">{row.original.name}</p>
        <p className="truncate text-xs text-muted-foreground">{row.original.slug}</p>
      </div>
    ),
  },
  {
    accessorKey: "shop",
    header: "Shop",
    cell: ({ row }) => (
      <div className="min-w-0">
        <p className="truncate text-sm">{row.original.shop.name}</p>
        <p className="truncate text-xs capitalize text-muted-foreground">
          {row.original.shop.status}
        </p>
      </div>
    ),
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.category.name}</span>
    ),
  },
  {
    accessorKey: "priceFrom",
    header: () => <div className="text-right">Price</div>,
    cell: ({ row }) => (
      <div className="text-right tabular-nums">
        {formatMoney(row.original.priceFrom)}
      </div>
    ),
  },
  {
    id: "flags",
    header: "Status",
    cell: ({ row }) => (
      <div className="flex gap-1">
        <Badge variant={row.original.isPublished ? "default" : "outline"}>
          {row.original.isPublished ? "Published" : "Draft"}
        </Badge>
        {row.original.featured ? <Badge variant="secondary">Featured</Badge> : null}
      </div>
    ),
  },
  {
    accessorKey: "updatedAt",
    header: "Updated",
    cell: ({ row }) => (
      <span className="text-muted-foreground">{formatDateTime(row.original.updatedAt)}</span>
    ),
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => <ListingActions listing={row.original} />,
    enableSorting: false,
    enableHiding: false,
  },
];

export function AdminListingsPage() {
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const { data, isLoading } = useQuery(
    adminListingsQuery({ q: search || undefined, page, pageSize: 25 }),
  );

  return (
    <div className="@container/main flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <input
          className="h-8 w-full max-w-sm rounded-md border border-input bg-background px-3 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          placeholder="Search name, slug, shop…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <span className="text-xs text-muted-foreground">
          {data ? `${data.total} listing${data.total === 1 ? "" : "s"}` : "…"}
        </span>
      </div>

      <SellerShellDataTable
        columns={columns}
        data={data?.listings ?? []}
        filterColumnId="name"
        filterPlaceholder=""
        countNoun="listing"
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
