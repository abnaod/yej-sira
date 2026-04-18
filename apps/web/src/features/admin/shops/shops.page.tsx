import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { type ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

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
  adminShopsQuery,
  updateAdminShopStatusMutation,
  type AdminShopListItem,
} from "./shops.queries";
import { formatDateTime } from "@/features/shared/formatters";

type Status = AdminShopListItem["status"];

function badgeVariant(
  s: Status,
): "default" | "secondary" | "outline" | "destructive" {
  switch (s) {
    case "active":
      return "default";
    case "pending":
      return "outline";
    case "rejected":
    case "suspended":
      return "destructive";
    default:
      return "secondary";
  }
}

const ALL_STATUSES: Status[] = ["pending", "active", "suspended", "rejected"];

function ShopStatusActions({ shop }: { shop: AdminShopListItem }) {
  const queryClient = useQueryClient();
  const mutation = useMutation(updateAdminShopStatusMutation(queryClient));
  const locale = useLocale() as Locale;

  const setStatus = (status: Status) => {
    mutation.mutate(
      { id: shop.id, status },
      {
        onSuccess: () => toast.success(`Shop marked ${status}`),
        onError: (err: unknown) =>
          toast.error(err instanceof Error ? err.message : "Failed to update shop"),
      },
    );
  };

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
            to="/$locale/shops/$shopSlug"
            params={{ locale, shopSlug: shop.slug }}
            search={{ page: 1 }}
          >
            View storefront
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {ALL_STATUSES.filter((s) => s !== shop.status).map((s) => (
          <DropdownMenuItem
            key={s}
            disabled={mutation.isPending}
            onSelect={(e) => {
              e.preventDefault();
              setStatus(s);
            }}
            className="capitalize"
          >
            Mark as {s}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const columns: ColumnDef<AdminShopListItem>[] = [
  {
    accessorKey: "name",
    header: "Shop",
    cell: ({ row }) => (
      <div className="min-w-0">
        <p className="truncate font-medium">{row.original.name}</p>
        <p className="truncate text-xs text-muted-foreground">{row.original.slug}</p>
      </div>
    ),
  },
  {
    accessorKey: "owner",
    header: "Owner",
    cell: ({ row }) =>
      row.original.owner ? (
        <div className="min-w-0">
          <p className="truncate text-sm">{row.original.owner.name}</p>
          <p className="truncate text-xs text-muted-foreground">{row.original.owner.email}</p>
        </div>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={badgeVariant(row.original.status)} className="capitalize">
        {row.original.status}
      </Badge>
    ),
  },
  {
    accessorKey: "listingCount",
    header: "Listings",
    cell: ({ row }) => (
      <span className="tabular-nums">{row.original.listingCount}</span>
    ),
  },
  {
    accessorKey: "businessType",
    header: "Type",
    cell: ({ row }) => (
      <span className="capitalize text-muted-foreground">
        {row.original.businessType ?? "—"}
      </span>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => (
      <span className="text-muted-foreground">{formatDateTime(row.original.createdAt)}</span>
    ),
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => <ShopStatusActions shop={row.original} />,
    enableSorting: false,
    enableHiding: false,
  },
];

export function AdminShopsPage() {
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState<Status | "all">("all");
  const [page, setPage] = React.useState(1);
  const { data, isLoading } = useQuery(
    adminShopsQuery({
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
          placeholder="Search name, slug, email…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <div className="flex gap-1">
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
              {s}
            </Button>
          ))}
        </div>
        <span className="ml-auto text-xs text-muted-foreground">
          {data ? `${data.total} shop${data.total === 1 ? "" : "s"}` : "…"}
        </span>
      </div>

      <SellerShellDataTable
        columns={columns}
        data={data?.shops ?? []}
        filterColumnId="name"
        filterPlaceholder=""
        countNoun="shop"
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
