import type { Locale } from "@ys/intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getRouteApi, Link, useNavigate } from "@tanstack/react-router";
import { ImageIcon, Plus } from "lucide-react";
import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataPagination } from "@/features/shared/data-pagination";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { assetUrl } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { useLocale } from "@/lib/locale-path";
import { cn } from "@/lib/utils";
import { myShopQuery } from "../shared/shop.queries";
import { SellerListingEditDialogForm, SellerListingNewDialogForm } from "./listing-editor.page";
import { getSellerListingColumns } from "./listings-columns";
import {
  deleteSellerListingMutationOptions,
  publishSellerListingMutationOptions,
  sellerListingsQuery,
  type SellerListingListItem,
} from "./listings.queries";
import { SellerListingStockEditorDialog } from "./stock-editor.dialog";
import { SellerShellDataTable } from "../shared/shell-data-table";

const DEFAULT_LOW_STOCK_THRESHOLD = 5;

const routeApi = getRouteApi("/$locale/(seller)/sell/listings/");

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "ETB",
    currencyDisplay: "code",
    minimumFractionDigits: 2,
  }).format(n);
}

function ListingMobileCard(props: {
  listing: SellerListingListItem;
  actions: ReactNode;
  lowStockThreshold: number;
}) {
  const { listing, actions, lowStockThreshold } = props;
  const url = listing.imageUrl?.trim();
  const allOut = listing.variantCount > 0 && listing.stock === 0;
  const anyOut = listing.outOfStockVariants > 0;
  const low = listing.stock > 0 && listing.stock <= lowStockThreshold;
  const stockTone = allOut
    ? "text-destructive"
    : low || anyOut
      ? "text-amber-700 dark:text-amber-400"
      : "text-foreground";
  const stockLabel = allOut
    ? "Out"
    : low
      ? "Low"
      : anyOut
        ? `${listing.outOfStockVariants} out`
        : null;

  return (
    <article className="rounded-md border border-border bg-background p-2.5 shadow-xs">
      <div className="flex gap-2.5">
        <div className="size-13 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
          {url ? (
            <img src={assetUrl(url)} alt="" className="size-full object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center text-muted-foreground">
              <ImageIcon className="size-5" aria-hidden />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 items-center gap-1.5">
                <p className="truncate text-sm font-semibold leading-5 text-foreground">
                  {listing.name}
                </p>
                {listing.isPublished ? (
                  <span className="size-1.5 shrink-0 rounded-full bg-green-600" aria-label="Published" />
                ) : (
                  <span className="shrink-0 rounded-full border border-border px-1.5 py-0 text-[10px] font-medium leading-4 text-muted-foreground">
                    Draft
                  </span>
                )}
              </div>
              <p className="truncate text-[11px] leading-4 text-muted-foreground">
                {listing.category.name}
              </p>
              <p className="text-xs font-semibold leading-4 tabular-nums text-foreground">
                {formatMoney(listing.priceFrom)}
              </p>
            </div>
            <div className="-mr-1 -mt-1 flex shrink-0 items-start gap-1">
              {actions}
            </div>
          </div>
          <div className="mt-1.5 flex items-center justify-between gap-2 text-[11px] leading-4">
            <span className="font-medium tabular-nums text-foreground">
              {listing.stock} stock
            </span>
            {stockLabel ? (
              <span className={cn("font-medium", stockTone)}>
                {stockLabel}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}

export function SellerListingsPage() {
  const locale = useLocale() as Locale;
  const navigate = useNavigate();
  const { new: openFromUrl, edit: editFromUrl } = routeApi.useSearch();
  const [newListingOpen, setNewListingOpen] = useState(false);
  const [newListingFormKey, setNewListingFormKey] = useState(0);
  const [editListingOpen, setEditListingOpen] = useState(false);
  const [editListingId, setEditListingId] = useState<string | null>(null);
  const [editListingFormKey, setEditListingFormKey] = useState(0);
  const [listSearch, setListSearch] = useState("");
  const [listPage, setListPage] = useState(1);
  const [stockDialogOpen, setStockDialogOpen] = useState(false);
  const [stockListingId, setStockListingId] = useState<string | null>(null);
  const listPageSize = 25;
  const { data: session } = authClient.useSession();
  const shopState = useQuery({
    ...myShopQuery(locale),
    enabled: !!session?.user,
  });
  const listingsState = useQuery({
    ...sellerListingsQuery(locale, {
      page: listPage,
      pageSize: listPageSize,
      q: listSearch.trim() || undefined,
      stockStatus: "all",
    }),
    enabled: !!session?.user && shopState.data?.shop?.status === "active",
  });

  const queryClient = useQueryClient();
  const closeEditListingDialog = useCallback(() => {
    setEditListingOpen(false);
    setEditListingId(null);
  }, []);

  const openNewListingDialog = useCallback(() => {
    setEditListingOpen(false);
    setEditListingId(null);
    setNewListingFormKey((k) => k + 1);
    setNewListingOpen(true);
  }, []);

  const deleteListingMut = useMutation(deleteSellerListingMutationOptions(queryClient, locale));
  const publishListingMut = useMutation(publishSellerListingMutationOptions(queryClient, locale));

  const onPublishListing = useCallback(
    (listingId: string) => {
      publishListingMut.mutate(listingId, {
        onSuccess: () => {
          toast.success("Listing published");
        },
        onError: (e) => {
          toast.error((e as Error).message);
        },
      });
    },
    [publishListingMut],
  );

  const onDeleteListing = useCallback(
    (listingId: string) => {
      if (!window.confirm("Delete this listing?")) return;
      deleteListingMut.mutate(listingId, {
        onSuccess: () => {
          setEditListingId((current) => {
            if (current === listingId) {
              setEditListingOpen(false);
              return null;
            }
            return current;
          });
        },
      });
    },
    [deleteListingMut],
  );

  const deletingListingId =
    deleteListingMut.isPending && deleteListingMut.variables != null
      ? deleteListingMut.variables
      : null;

  const publishingListingId =
    publishListingMut.isPending && publishListingMut.variables != null
      ? publishListingMut.variables
      : null;

  const lowStockThreshold =
    listingsState.data?.lowStockThreshold ?? DEFAULT_LOW_STOCK_THRESHOLD;

  const onManageStock = useCallback((listingId: string) => {
    setStockListingId(listingId);
    setStockDialogOpen(true);
  }, []);

  const columns = useMemo(
    () =>
      getSellerListingColumns(locale, {
        onDeleteListing,
        deletingListingId,
        onPublishListing,
        publishingListingId,
        onManageStock,
        lowStockThreshold,
      }),
    [
      locale,
      onDeleteListing,
      deletingListingId,
      onPublishListing,
      publishingListingId,
      onManageStock,
      lowStockThreshold,
    ],
  );

  useEffect(() => {
    if (!openFromUrl) return;
    void navigate({
      to: "/$locale/sell/listings",
      params: { locale },
      search: { new: false, edit: undefined },
      replace: true,
    });
    if (!session?.user) return;
    setEditListingOpen(false);
    setEditListingId(null);
    setNewListingFormKey((k) => k + 1);
    setNewListingOpen(true);
  }, [openFromUrl, locale, navigate, session?.user]);

  useEffect(() => {
    if (!editFromUrl) return;
    const id = editFromUrl;
    void navigate({
      to: "/$locale/sell/listings",
      params: { locale },
      search: { new: false, edit: undefined },
      replace: true,
    });
    if (!session?.user) return;
    setNewListingOpen(false);
    setEditListingFormKey((k) => k + 1);
    setEditListingId(id);
    setEditListingOpen(true);
  }, [editFromUrl, locale, navigate, session?.user]);

  if (!session?.user) {
    return (
      <div className="mx-auto max-w-3xl px-4">
        <p className="text-muted-foreground">Sign in to manage your listings.</p>
      </div>
    );
  }

  const shop = shopState.data?.shop;
  if (shopState.isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!shop || shop === null) {
    return (
      <div className="mx-auto max-w-3xl px-4">
        <p className="text-muted-foreground">You don&apos;t have a shop yet.</p>
        <Button className="mt-4" asChild>
          <Link to="/$locale/sell/onboarding" params={{ locale }}>
            Register your shop
          </Link>
        </Button>
      </div>
    );
  }

  if (shop.status !== "active") {
    return (
      <div className="mx-auto max-w-3xl px-4">
        <p className="text-muted-foreground">
          Your shop is {shop.status}. You can list listings once it&apos;s active.
        </p>
      </div>
    );
  }

  const listings = listingsState.data?.listings ?? [];
  const listingsLoading = listingsState.isLoading;
  const listingsMeta = listingsState.data;
  const listingCountForLimit = listingsMeta?.stockCounts.all ?? 0;
  const atListingLimit = listingCountForLimit >= shop.listingsLimit;
  const stockListingName =
    listings.find((l) => l.id === stockListingId)?.name ?? undefined;

  return (
    <div className="@container/main flex min-h-0 flex-1 flex-col">
      <Dialog open={newListingOpen} onOpenChange={setNewListingOpen}>
        <DialogContent
          showCloseButton
          className="flex max-h-[min(90vh,56rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl"
        >
          <DialogHeader className="shrink-0 gap-1 border-b px-6 py-4 text-left">
            <DialogTitle>New listing</DialogTitle>
            <DialogDescription>
              Add category, price, stock, images, and description for your listing.
            </DialogDescription>
          </DialogHeader>
          <SellerListingNewDialogForm
            key={newListingFormKey}
            onCreated={() => setNewListingOpen(false)}
            onCancel={() => setNewListingOpen(false)}
          />
        </DialogContent>
      </Dialog>
      <Dialog
        open={editListingOpen}
        onOpenChange={(open) => {
          if (!open) closeEditListingDialog();
        }}
      >
        <DialogContent
          showCloseButton
          className="flex max-h-[min(90vh,56rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl"
        >
          <DialogHeader className="shrink-0 gap-1 border-b px-6 py-4 text-left">
            <DialogTitle>Edit listing</DialogTitle>
            <DialogDescription>
              Update this listing&apos;s details, stock, and publish state.
            </DialogDescription>
          </DialogHeader>
          {editListingId ? (
            <SellerListingEditDialogForm
              key={`${editListingId}-${editListingFormKey}`}
              listingId={editListingId}
              onSaved={closeEditListingDialog}
              onCancel={closeEditListingDialog}
            />
          ) : null}
        </DialogContent>
      </Dialog>
      <SellerListingStockEditorDialog
        open={stockDialogOpen}
        onOpenChange={(open) => {
          setStockDialogOpen(open);
          if (!open) setStockListingId(null);
        }}
        listingId={stockListingId}
        listingName={stockListingName}
        locale={locale}
        lowStockThreshold={lowStockThreshold}
      />
      <div className="flex min-h-0 flex-1 flex-col gap-3">
        <div className="flex items-center gap-2">
          <input
            className="h-8 min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:max-w-sm"
            placeholder="Search name or slug…"
            value={listSearch}
            onChange={(e) => {
              setListSearch(e.target.value);
              setListPage(1);
            }}
          />
          <Button
            type="button"
            className="size-8 shrink-0 px-0 sm:size-auto sm:px-3"
            onClick={openNewListingDialog}
            disabled={atListingLimit}
            title={
              atListingLimit
                ? `You can have at most ${shop.listingsLimit} listings. Delete one to add another.`
                : "New listing"
            }
            aria-label="New listing"
          >
            <Plus className="size-3.5 shrink-0" aria-hidden />
            <span className="hidden sm:inline">New listing</span>
          </Button>
        </div>
        <SellerShellDataTable
          columns={columns}
          data={listings}
          filterColumnId="name"
          filterPlaceholder="Filter by name…"
          countNoun="listing"
          isLoading={listingsLoading}
          showFilter={false}
          showPagination={false}
          mobileCard={({ row, renderCell }) => (
            <ListingMobileCard
              key={row.id}
              listing={row.original}
              actions={renderCell("actions")}
              lowStockThreshold={lowStockThreshold}
            />
          )}
        />
        {listingsMeta ? (
          <DataPagination
            page={listingsMeta.page}
            totalPages={listingsMeta.totalPages}
            onPageChange={setListPage}
          />
        ) : null}
      </div>
    </div>
  );
}
