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
import {
  ListFilter,
  Loader2,
  Package,
  Search,
  ShoppingBag,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
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

function defaultFilterLabel(countNoun: string): string {
  switch (countNoun) {
    case "product":
      return "Product name";
    case "order":
      return "Order ID";
    default:
      return "Filter";
  }
}

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

function defaultLoadingTitle(countNoun: string): string {
  switch (countNoun) {
    case "order":
      return "Loading orders…";
    case "product":
      return "Loading products…";
    default:
      return "Loading…";
  }
}

export type SellerShellDataTableProps<TData, TValue> = {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  /** Column id used for the string filter (e.g. `name`, `id`). */
  filterColumnId: string;
  /** Visible label for the filter field (defaults from `countNoun`). */
  filterLabel?: string;
  filterPlaceholder: string;
  /** Singular noun for row counts (e.g. `product`, `order`). */
  countNoun: string;
  toolbarEnd?: React.ReactNode;
  /** Overrides the default empty copy for this `countNoun`. */
  emptyState?: SellerTableEmptyState;
  noFilterMatchMessage?: string;
  /** Shows the same centered layout as the empty state, with a spinner. */
  isLoading?: boolean;
  loadingTitle?: string;
  /** When false, hides the filter control and panel (default true). */
  showFilter?: boolean;
  /** When false, lists all rows and hides the pagination footer (default true). */
  showPagination?: boolean;
  /** When false, the table is not wrapped in a rounded border (default true). */
  tableBorder?: boolean;
  /** When false, row rules and borders on every `th` / `td` are hidden (default true). */
  showRowBorders?: boolean;
  /** Merged into the table surface wrapper (e.g. `rounded-md bg-gray-50`). */
  tableSurfaceClassName?: string;
  /** Merged into `TableHeader` (default `bg-gray-100`). */
  tableHeaderClassName?: string;
  /** Merged into `TableBody` (e.g. `bg-white` for body rows on a tinted surface). */
  tableBodyClassName?: string;
};

export function SellerShellDataTable<TData, TValue>({
  columns,
  data,
  filterColumnId,
  filterLabel: filterLabelProp,
  filterPlaceholder,
  countNoun,
  toolbarEnd,
  emptyState: emptyStateProp,
  noFilterMatchMessage,
  isLoading = false,
  loadingTitle: loadingTitleProp,
  showFilter = true,
  showPagination = true,
  tableBorder = true,
  showRowBorders = true,
  tableSurfaceClassName,
  tableHeaderClassName,
  tableBodyClassName,
}: SellerShellDataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [filterOpen, setFilterOpen] = React.useState(false);
  const [filterDraft, setFilterDraft] = React.useState("");

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    ...(showPagination ? { getPaginationRowModel: getPaginationRowModel() } : {}),
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
  const rowModelRows = table.getRowModel().rows;
  const fillHeight = rowModelRows.length === 0;
  const plural = (n: number) => `${n} ${countNoun}${n === 1 ? "" : "s"}`;

  const appliedRaw = filterCol?.getFilterValue();
  const applied =
    typeof appliedRaw === "string" ? appliedRaw : appliedRaw != null ? String(appliedRaw) : "";
  const hasActiveFilter = Boolean(applied.trim());

  const toggleFilterRow = React.useCallback(() => {
    setFilterOpen((open) => {
      if (!open) {
        const raw = table.getColumn(filterColumnId)?.getFilterValue();
        const s = typeof raw === "string" ? raw : raw != null ? String(raw) : "";
        setFilterDraft(s);
        return true;
      }
      return false;
    });
  }, [table, filterColumnId]);

  const applyFilter = React.useCallback(() => {
    const next = filterDraft.trim();
    filterCol?.setFilterValue(next.length ? next : undefined);
  }, [filterCol, filterDraft]);

  const clearFilter = React.useCallback(() => {
    setFilterDraft("");
    filterCol?.setFilterValue(undefined);
  }, [filterCol]);

  const defaultNoMatch = `No ${countNoun}s match your filter.`;
  const emptyState = emptyStateProp ?? defaultEmptyState(countNoun);
  const EmptyIcon = emptyState.icon;
  const filterFieldLabel = filterLabelProp ?? defaultFilterLabel(countNoun);
  const loadingTitle = loadingTitleProp ?? defaultLoadingTitle(countNoun);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      {showFilter ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              className="gap-1.5 py-0.5"
              aria-expanded={filterOpen}
              aria-controls="seller-table-filter-panel"
              id="seller-table-filter-trigger"
              onClick={toggleFilterRow}
            >
              <ListFilter className="size-3 shrink-0" aria-hidden />
              Filter
              {hasActiveFilter ? (
                <span className="max-w-40 truncate text-muted-foreground" title={applied}>
                  · {applied}
                </span>
              ) : null}
            </Button>
            {toolbarEnd ? <div className="flex shrink-0 items-center gap-2">{toolbarEnd}</div> : null}
          </div>
          {filterOpen ? (
            <div
              id="seller-table-filter-panel"
              role="region"
              aria-labelledby="seller-table-filter-field-label"
              className="flex flex-col gap-3 rounded-md border bg-background p-3 shadow-xs sm:flex-row sm:items-end"
            >
              <div className="flex w-full min-w-0 flex-col gap-1.5 sm:w-1/4">
                <Label
                  id="seller-table-filter-field-label"
                  htmlFor="seller-table-filter-input"
                  className="text-xss font-medium text-label-foreground"
                >
                  {filterFieldLabel}
                </Label>
                <div className="relative min-w-0">
                  <Search
                    className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
                    aria-hidden
                  />
                  <Input
                    id="seller-table-filter-input"
                    placeholder={filterPlaceholder}
                    value={filterDraft}
                    onChange={(event) => setFilterDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        applyFilter();
                      }
                    }}
                    className={cn(
                      "h-8 border-border bg-background py-0 pr-3 pl-8 text-xs shadow-xs md:text-xs",
                      "placeholder:text-muted-foreground",
                      "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
                      "dark:border-input dark:bg-input/30",
                    )}
                  />
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <Button type="button" onClick={applyFilter}>
                  Apply
                </Button>
                <Button type="button" variant="outline" onClick={clearFilter}>
                  Clear
                </Button>
              </div>
            </div>
          ) : null}
        </>
      ) : toolbarEnd ? (
        <div className="flex flex-wrap items-center justify-end gap-2">{toolbarEnd}</div>
      ) : null}
      <div
        className={cn(
          "overflow-hidden",
          tableBorder && "rounded-md border",
          fillHeight && "flex min-h-0 flex-1 flex-col",
          tableSurfaceClassName,
        )}
      >
        <Table
          containerClassName={fillHeight ? "flex min-h-0 flex-1 flex-col" : undefined}
          className={cn(
            fillHeight && "h-full",
            !showRowBorders && "[&_th]:border-0 [&_td]:border-0",
          )}
        >
          <TableHeader
            className={cn(
              "bg-gray-100 [&_th:first-child]:rounded-l-md [&_th:last-child]:rounded-r-md",
              !showRowBorders && "[&_tr]:border-b-0",
              tableHeaderClassName,
            )}
          >
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className={cn(!showRowBorders && "border-0")}>
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
          <TableBody
            className={cn(
              fillHeight && "h-full [&_tr]:h-full",
              tableBodyClassName,
            )}
          >
            {isLoading ? (
              <TableRow
                className={cn(
                  fillHeight && "h-full border-0 hover:bg-transparent",
                  !showRowBorders && "border-0",
                )}
              >
                <TableCell
                  colSpan={columns.length}
                  className={cn(
                    fillHeight
                      ? "h-full p-0 align-middle text-center whitespace-normal"
                      : "h-px p-0 text-center whitespace-normal",
                  )}
                >
                  <div
                    className={cn(
                      "flex w-full flex-col items-center justify-center gap-3 px-4 text-center",
                      fillHeight ? "min-h-0 h-full py-8" : "py-14",
                    )}
                  >
                    <div
                      className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground"
                      aria-busy
                      aria-live="polite"
                    >
                      <Loader2 className="size-6 animate-spin" aria-hidden />
                    </div>
                    <div className="flex max-w-sm flex-col gap-1">
                      <p className="text-sm font-medium text-foreground">{loadingTitle}</p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow
                className={cn(
                  fillHeight && "h-full border-0 hover:bg-transparent",
                  !showRowBorders && "border-0",
                )}
              >
                <TableCell
                  colSpan={columns.length}
                  className={cn(
                    fillHeight
                      ? "h-full p-0 align-middle text-center whitespace-normal"
                      : "h-px p-0 text-center whitespace-normal",
                  )}
                >
                  <div
                    className={cn(
                      "flex w-full flex-col items-center justify-center gap-3 px-4 text-center",
                      fillHeight ? "min-h-0 h-full py-8" : "py-14",
                    )}
                  >
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
            ) : rowModelRows.length ? (
              rowModelRows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={cn(!showRowBorders && "border-0")}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow
                className={cn(
                  fillHeight && "h-full border-0 hover:bg-transparent",
                  !showRowBorders && "border-0",
                )}
              >
                <TableCell
                  colSpan={columns.length}
                  className={cn(
                    fillHeight
                      ? "h-full p-0 align-middle text-center whitespace-normal"
                      : "h-px p-0 text-center whitespace-normal",
                  )}
                >
                  <div
                    className={cn(
                      "flex w-full flex-col items-center justify-center gap-3 px-4 text-center",
                      fillHeight ? "min-h-0 h-full py-8" : "py-14",
                    )}
                  >
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
      {showPagination && data.length > 0 ? (
        <div className="flex flex-wrap items-center justify-end gap-2">
          <p className="mr-auto text-sm text-muted-foreground">{plural(filteredCount)}</p>
          <Button
            variant="outline"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
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
