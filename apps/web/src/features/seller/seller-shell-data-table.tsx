import * as React from "react";
import {
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { Package, Search, ShoppingBag, type LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type SellerTableEmptyState = {
  icon: LucideIcon;
  title: string;
  description?: string;
};

function defaultEmptyState(countNoun: string): SellerTableEmptyState {
  switch (countNoun) {
    case "order":
      return {
        icon: ShoppingBag,
        title: "No orders yet",
        description: "When customers buy your products, their orders will show up here.",
      };
    case "product":
    default:
      return {
        icon: Package,
        title: "No products yet",
        description: "Add your first product to start selling from your shop.",
      };
  }
}

export type SellerShellDataTableProps<TData, TValue> = {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  /** Column id used for the string filter (e.g. `name`, `id`). */
  filterColumnId: string;
  filterPlaceholder: string;
  /** Singular noun for row counts (e.g. `product`, `order`). */
  countNoun: string;
  toolbarEnd?: React.ReactNode;
  /** Overrides the default empty copy for this `countNoun`. */
  emptyState?: SellerTableEmptyState;
  noFilterMatchMessage?: string;
};

export function SellerShellDataTable<TData, TValue>({
  columns,
  data,
  filterColumnId,
  filterPlaceholder,
  countNoun,
  toolbarEnd,
  emptyState: emptyStateProp,
  noFilterMatchMessage,
}: SellerShellDataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  const filterCol = table.getColumn(filterColumnId);
  const filteredCount = table.getFilteredRowModel().rows.length;
  const plural = (n: number) => `${n} ${countNoun}${n === 1 ? "" : "s"}`;

  const defaultNoMatch = `No ${countNoun}s match your filter.`;
  const emptyState = emptyStateProp ?? defaultEmptyState(countNoun);
  const EmptyIcon = emptyState.icon;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Input
          placeholder={filterPlaceholder}
          value={(filterCol?.getFilterValue() as string) ?? ""}
          onChange={(event) => filterCol?.setFilterValue(event.target.value)}
          className="max-w-sm min-w-[12rem]"
        />
        {toolbarEnd ? <div className="flex shrink-0 items-center gap-2">{toolbarEnd}</div> : null}
      </div>
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader className="bg-gray-100">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-px p-0">
                  <div className="flex flex-col items-center justify-center gap-3 px-4 py-14 text-center">
                    <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <EmptyIcon className="size-6" aria-hidden />
                    </div>
                    <div className="flex max-w-sm flex-col gap-1">
                      <p className="text-sm font-medium text-foreground">{emptyState.title}</p>
                      {emptyState.description ? (
                        <p className="text-sm text-muted-foreground">{emptyState.description}</p>
                      ) : null}
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-px p-0">
                  <div className="flex flex-col items-center justify-center gap-3 px-4 py-14 text-center">
                    <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <Search className="size-6" aria-hidden />
                    </div>
                    <div className="flex max-w-sm flex-col gap-1">
                      <p className="text-sm font-medium text-foreground">No matches</p>
                      <p className="text-sm text-muted-foreground">
                        {noFilterMatchMessage ?? defaultNoMatch}
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {data.length > 0 ? (
        <div className="flex flex-wrap items-center justify-end gap-2">
          <p className="mr-auto text-sm text-muted-foreground">{plural(filteredCount)}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      ) : null}
    </div>
  );
}
