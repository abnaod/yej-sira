import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataPagination } from "@/features/shared/data-pagination";
import { SellerShellDataTable } from "@/features/seller/shared/shell-data-table";

import {
  adminPromoCodesQuery,
  createPromoCodeMutation,
  deletePromoCodeMutation,
  updatePromoCodeMutation,
  type AdminPromoCode,
  type CreatePromoCodeBody,
} from "./promo-codes.queries";
import { type ColumnDef } from "@tanstack/react-table";

function numberOrUndefined(v: string): number | undefined {
  if (!v.trim()) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function CreateDialog() {
  const queryClient = useQueryClient();
  const createMutation = useMutation(createPromoCodeMutation(queryClient));
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState<CreatePromoCodeBody>({ code: "", active: true });

  const reset = () => setForm({ code: "", active: true });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.code.trim()) return;
    try {
      await createMutation.mutateAsync({ ...form, code: form.code.toUpperCase() });
      toast.success("Promo code created");
      setOpen(false);
      reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-1.5 size-4" /> New promo code
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New promo code</DialogTitle>
          <DialogDescription>
            Provide either a percent or a fixed ETB discount amount.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-3" onSubmit={onSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="code">Code</Label>
            <Input
              id="code"
              required
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              placeholder="SAVE10"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="discountPercent">Discount %</Label>
              <Input
                id="discountPercent"
                type="number"
                min={1}
                max={100}
                value={form.discountPercent ?? ""}
                onChange={(e) =>
                  setForm({ ...form, discountPercent: numberOrUndefined(e.target.value) })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="discountAmount">Discount ETB</Label>
              <Input
                id="discountAmount"
                type="number"
                min={0}
                step={0.01}
                value={form.discountAmount ?? ""}
                onChange={(e) =>
                  setForm({ ...form, discountAmount: numberOrUndefined(e.target.value) })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="minSubtotal">Min subtotal ETB</Label>
              <Input
                id="minSubtotal"
                type="number"
                min={0}
                value={form.minSubtotal ?? ""}
                onChange={(e) =>
                  setForm({ ...form, minSubtotal: numberOrUndefined(e.target.value) })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="maxRedemptions">Max redemptions</Label>
              <Input
                id="maxRedemptions"
                type="number"
                min={1}
                value={form.maxRedemptions ?? ""}
                onChange={(e) =>
                  setForm({ ...form, maxRedemptions: numberOrUndefined(e.target.value) })
                }
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Input
              id="description"
              value={form.description ?? ""}
              onChange={(e) => setForm({ ...form, description: e.target.value || undefined })}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RowActions({ row }: { row: AdminPromoCode }) {
  const queryClient = useQueryClient();
  const update = useMutation(updatePromoCodeMutation(queryClient));
  const del = useMutation(deletePromoCodeMutation(queryClient));

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        variant="outline"
        disabled={update.isPending}
        onClick={() =>
          update.mutate(
            { id: row.id, body: { active: !row.active } },
            {
              onSuccess: () => toast.success(`Marked ${!row.active ? "active" : "inactive"}`),
              onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
            },
          )
        }
      >
        {row.active ? "Deactivate" : "Activate"}
      </Button>
      <Button
        size="sm"
        variant="ghost"
        disabled={del.isPending}
        onClick={() => {
          if (!window.confirm(`Delete ${row.code}?`)) return;
          del.mutate(
            { id: row.id },
            {
              onSuccess: () => toast.success("Deleted"),
              onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
            },
          );
        }}
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}

const columns: ColumnDef<AdminPromoCode>[] = [
  {
    accessorKey: "code",
    header: "Code",
    cell: ({ row }) => <span className="font-mono text-sm">{row.original.code}</span>,
  },
  {
    id: "discount",
    header: "Discount",
    cell: ({ row }) =>
      row.original.discountPercent != null
        ? `${row.original.discountPercent}%`
        : row.original.discountAmount != null
          ? `${row.original.discountAmount} ETB`
          : "—",
  },
  {
    accessorKey: "minSubtotal",
    header: "Min subtotal",
    cell: ({ row }) =>
      row.original.minSubtotal != null ? `${row.original.minSubtotal} ETB` : "—",
  },
  {
    accessorKey: "redemptions",
    header: "Redemptions",
    cell: ({ row }) =>
      `${row.original.redemptions}${row.original.maxRedemptions != null ? ` / ${row.original.maxRedemptions}` : ""}`,
  },
  {
    accessorKey: "active",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={row.original.active ? "default" : "secondary"}>
        {row.original.active ? "active" : "inactive"}
      </Badge>
    ),
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => <RowActions row={row.original} />,
    enableSorting: false,
  },
];

export function AdminPromoCodesPage() {
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState("");
  const { data, isLoading } = useQuery(adminPromoCodesQuery({ page, q: search || undefined }));

  return (
    <div className="@container/main flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          className="h-8 w-full max-w-sm"
          placeholder="Search code…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <div className="ml-auto">
          <CreateDialog />
        </div>
      </div>

      <SellerShellDataTable
        columns={columns}
        data={data?.promoCodes ?? []}
        filterColumnId="code"
        filterPlaceholder=""
        countNoun="promo code"
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
