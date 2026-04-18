import type { Locale } from "@ys/intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogMain,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

import {
  sellerListingDetailQuery,
  updateSellerListingStockMutationOptions,
} from "./listings.queries";

type StockEditorDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listingId: string | null;
  listingName?: string;
  locale: Locale;
  lowStockThreshold: number;
};

type StockRow = {
  id: string;
  label: string;
  initial: number;
  value: string;
};

export function SellerListingStockEditorDialog({
  open,
  onOpenChange,
  listingId,
  listingName,
  locale,
  lowStockThreshold,
}: StockEditorDialogProps) {
  const queryClient = useQueryClient();
  const detailQuery = useQuery({
    ...sellerListingDetailQuery(locale, listingId ?? ""),
    enabled: open && !!listingId,
  });
  const stockMut = useMutation(
    updateSellerListingStockMutationOptions(queryClient, locale, listingId ?? ""),
  );

  const [rows, setRows] = useState<StockRow[]>([]);

  useEffect(() => {
    if (!open) return;
    const variants = detailQuery.data?.listing.variants;
    if (!variants) return;
    setRows(
      variants.map((v) => ({
        id: v.id,
        label: v.label,
        initial: v.stock,
        value: String(v.stock),
      })),
    );
  }, [open, detailQuery.data]);

  const title = listingName ?? detailQuery.data?.listing.name ?? "Listing";
  const isLoading = detailQuery.isLoading && !detailQuery.data;
  const isError = detailQuery.isError;

  const outOfStockCount = useMemo(
    () => rows.filter((r) => Number.parseInt(r.value, 10) === 0).length,
    [rows],
  );

  const dirty = useMemo(
    () =>
      rows.some((r) => {
        const n = Number.parseInt(r.value, 10);
        return Number.isFinite(n) && n !== r.initial;
      }),
    [rows],
  );

  const close = () => {
    onOpenChange(false);
  };

  const setAllTo = (n: number) => {
    setRows((prev) => prev.map((r) => ({ ...r, value: String(Math.max(0, n)) })));
  };

  const onSave = () => {
    if (!listingId) return;
    const payload = rows
      .map((r) => ({ id: r.id, stock: Number.parseInt(r.value, 10) }))
      .filter((r) => Number.isFinite(r.stock) && r.stock >= 0);
    if (payload.length === 0) {
      toast.error("Enter a valid stock count");
      return;
    }
    const changed = payload.filter((r) => {
      const row = rows.find((x) => x.id === r.id);
      return row && r.stock !== row.initial;
    });
    if (changed.length === 0) {
      close();
      return;
    }
    stockMut.mutate(
      { variants: changed },
      {
        onSuccess: () => {
          toast.success(
            changed.length === 1
              ? "Stock updated"
              : `Stock updated for ${changed.length} variants`,
          );
          close();
        },
        onError: (err) => {
          toast.error((err as Error).message);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? onOpenChange(true) : close())}>
      <DialogContent
        showCloseButton
        className="flex max-h-[min(90vh,40rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg"
      >
        <DialogHeader className="shrink-0 gap-1 border-b px-6 py-4 text-left">
          <DialogTitle>Update stock</DialogTitle>
          <DialogDescription className="truncate">{title}</DialogDescription>
        </DialogHeader>
        <DialogMain>
          <DialogBody className="mx-0 space-y-4 px-6 py-5">
            {isLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Loading variants…
              </div>
            ) : isError ? (
              <p className="text-sm text-destructive">Could not load listing.</p>
            ) : rows.length === 0 ? (
              <p className="text-sm text-muted-foreground">This listing has no variants.</p>
            ) : (
              <>
                {outOfStockCount > 0 ? (
                  <div className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-300">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
                    <p>
                      {outOfStockCount === rows.length
                        ? "Every variant is currently out of stock. Set new quantities below to restock."
                        : `${outOfStockCount} variant${outOfStockCount === 1 ? " is" : "s are"} out of stock.`}
                    </p>
                  </div>
                ) : null}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-muted-foreground">Quick fill:</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setAllTo(10)}
                  >
                    All to 10
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setAllTo(50)}
                  >
                    All to 50
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setAllTo(0)}
                  >
                    All to 0
                  </Button>
                </div>
                <div className="flex flex-col divide-y rounded-md border">
                  {rows.map((r) => {
                    const n = Number.parseInt(r.value, 10);
                    const isOut = Number.isFinite(n) && n === 0;
                    const isLow =
                      Number.isFinite(n) && n > 0 && n <= lowStockThreshold;
                    return (
                      <div
                        key={r.id}
                        className="flex items-center gap-3 px-3 py-2.5"
                      >
                        <div className="min-w-0 flex-1">
                          <Label
                            htmlFor={`stock-${r.id}`}
                            className="block truncate text-sm font-medium"
                          >
                            {r.label}
                          </Label>
                          <p
                            className={cn(
                              "text-xs",
                              isOut
                                ? "text-destructive"
                                : isLow
                                  ? "text-amber-600 dark:text-amber-400"
                                  : "text-muted-foreground",
                            )}
                          >
                            {isOut
                              ? "Out of stock"
                              : isLow
                                ? "Low stock"
                                : `In stock (was ${r.initial})`}
                          </p>
                        </div>
                        <Input
                          id={`stock-${r.id}`}
                          type="number"
                          inputMode="numeric"
                          min={0}
                          className="w-24 tabular-nums"
                          value={r.value}
                          onChange={(e) =>
                            setRows((prev) =>
                              prev.map((x) =>
                                x.id === r.id ? { ...x, value: e.target.value } : x,
                              ),
                            )
                          }
                        />
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </DialogBody>
        </DialogMain>
        <DialogFooter className="shrink-0 border-t px-6 py-4">
          <Button type="button" variant="outline" onClick={close}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onSave}
            disabled={
              !dirty || stockMut.isPending || rows.length === 0 || isLoading || isError
            }
          >
            {stockMut.isPending ? (
              <>
                <Loader2 className="animate-spin" aria-hidden />
                Saving…
              </>
            ) : (
              "Save stock"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
