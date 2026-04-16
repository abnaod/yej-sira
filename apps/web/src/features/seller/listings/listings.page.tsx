import type { Locale } from "@ys/intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getRouteApi, Link, useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { authClient } from "@/lib/auth-client";
import { useLocale } from "@/lib/locale-path";
import { myShopQuery } from "../shared/shop.queries";
import { SellerListingEditDialogForm, SellerListingNewDialogForm } from "./listing-editor.page";
import { getSellerListingColumns } from "./listings-columns";
import {
  deleteSellerListingMutationOptions,
  publishSellerListingMutationOptions,
  sellerListingsQuery,
} from "./listings.queries";
import { SellerShellDataTable } from "../shared/shell-data-table";

const routeApi = getRouteApi("/$locale/(seller)/sell/listings/");

export function SellerListingsPage() {
  const locale = useLocale() as Locale;
  const navigate = useNavigate();
  const { new: openFromUrl, edit: editFromUrl } = routeApi.useSearch();
  const [newListingOpen, setNewListingOpen] = useState(false);
  const [newListingFormKey, setNewListingFormKey] = useState(0);
  const [editListingOpen, setEditListingOpen] = useState(false);
  const [editListingId, setEditListingId] = useState<string | null>(null);
  const [editListingFormKey, setEditListingFormKey] = useState(0);
  const { data: session } = authClient.useSession();
  const shopState = useQuery({
    ...myShopQuery(locale),
    enabled: !!session?.user,
  });
  const listingsState = useQuery({
    ...sellerListingsQuery(locale),
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

  const columns = useMemo(
    () =>
      getSellerListingColumns(locale, {
        onDeleteListing,
        deletingListingId,
        onPublishListing,
        publishingListingId,
      }),
    [locale, onDeleteListing, deletingListingId, onPublishListing, publishingListingId],
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
          <Link to="/$locale/sell/register" params={{ locale }}>
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
              Add category, variants, images, and description for your listing.
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
      {listingsLoading ? (
        <p className="text-sm text-muted-foreground">Loading listings…</p>
      ) : (
        <SellerShellDataTable
          columns={columns}
          data={listings}
          filterColumnId="name"
          filterPlaceholder="Filter by name…"
          countNoun="listing"
          toolbarEnd={
            <Button type="button" onClick={openNewListingDialog}>
              <Plus className="size-3.5 shrink-0" aria-hidden />
              New listing
            </Button>
          }
        />
      )}
    </div>
  );
}
