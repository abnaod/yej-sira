import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import * as React from "react";

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
import { toast } from "sonner";

import { SellerShellDataTable } from "@/features/seller/shared/shell-data-table";
import {
  adminUsersQuery,
  updateAdminUserRoleMutation,
  type AdminUserListItem,
} from "./users.queries";
import { formatDateTime } from "@/features/shared/formatters";

function UserRoleActions({ user }: { user: AdminUserListItem }) {
  const queryClient = useQueryClient();
  const mutation = useMutation(updateAdminUserRoleMutation(queryClient));
  const nextRole = user.role === "admin" ? "customer" : "admin";

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
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={mutation.isPending}
          onSelect={(e) => {
            e.preventDefault();
            mutation.mutate(
              { id: user.id, role: nextRole },
              {
                onSuccess: () =>
                  toast.success(
                    nextRole === "admin"
                      ? `Promoted ${user.email} to admin`
                      : `Demoted ${user.email} to customer`,
                  ),
                onError: (err: unknown) =>
                  toast.error(err instanceof Error ? err.message : "Failed to update role"),
              },
            );
          }}
        >
          {nextRole === "admin" ? "Promote to admin" : "Demote to customer"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const columns: ColumnDef<AdminUserListItem>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <div className="min-w-0">
        <p className="truncate font-medium">{row.original.name || "—"}</p>
        <p className="truncate text-xs text-muted-foreground">{row.original.email}</p>
      </div>
    ),
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.email}</span>
    ),
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => (
      <Badge variant={row.original.role === "admin" ? "default" : "outline"}>
        {row.original.role}
      </Badge>
    ),
  },
  {
    accessorKey: "shop",
    header: "Shop",
    cell: ({ row }) =>
      row.original.shop ? (
        <div className="flex min-w-0 flex-col">
          <span className="truncate font-medium">{row.original.shop.name}</span>
          <span className="text-xs capitalize text-muted-foreground">
            {row.original.shop.status}
          </span>
        </div>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
  {
    accessorKey: "orderCount",
    header: "Orders",
    cell: ({ row }) => (
      <span className="tabular-nums">{row.original.orderCount}</span>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Joined",
    cell: ({ row }) => (
      <span className="text-muted-foreground">{formatDateTime(row.original.createdAt)}</span>
    ),
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => <UserRoleActions user={row.original} />,
    enableSorting: false,
    enableHiding: false,
  },
];

export function AdminUsersPage() {
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const { data, isLoading } = useQuery(
    adminUsersQuery({ q: search || undefined, page, pageSize: 25 }),
  );

  return (
    <div className="@container/main flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <input
          className="h-8 w-full max-w-sm rounded-md border border-input bg-background px-3 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          placeholder="Search name or email…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <span className="text-xs text-muted-foreground">
          {data ? `${data.total} user${data.total === 1 ? "" : "s"}` : "…"}
        </span>
      </div>

      <SellerShellDataTable
        columns={columns}
        data={data?.users ?? []}
        filterColumnId="email"
        filterPlaceholder="Filter by email…"
        countNoun="user"
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
