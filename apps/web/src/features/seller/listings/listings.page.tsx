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
import { SellerProductEditDialogForm, SellerProductNewDialogForm } from "./product-editor.page";
import { getSellerProductColumns } from "./products-columns";
import {
  deleteSellerProductMutationOptions,
  publishSellerProductMutationOptions,
  sellerProductsQuery,
} from "./products.queries";
import { SellerShellDataTable } from "../shared/shell-data-table";

const routeApi = getRouteApi("/$locale/(seller)/sell/products/");

export function SellerProductsPage() {
  const locale = useLocale() as Locale;
  const navigate = useNavigate();
  const { new: openFromUrl, edit: editFromUrl } = routeApi.useSearch();
  const [newProductOpen, setNewProductOpen] = useState(false);
  const [newProductFormKey, setNewProductFormKey] = useState(0);
  const [editProductOpen, setEditProductOpen] = useState(false);
  const [editProductId, setEditProductId] = useState<string | null>(null);
  const [editProductFormKey, setEditProductFormKey] = useState(0);
  const { data: session } = authClient.useSession();
  const shopState = useQuery({
    ...myShopQuery(locale),
    enabled: !!session?.user,
  });
  const productsState = useQuery({
    ...sellerProductsQuery(locale),
    enabled: !!session?.user && shopState.data?.shop?.status === "active",
  });

  const queryClient = useQueryClient();
  const closeEditProductDialog = useCallback(() => {
    setEditProductOpen(false);
    setEditProductId(null);
  }, []);

  const openNewProductDialog = useCallback(() => {
    setEditProductOpen(false);
    setEditProductId(null);
    setNewProductFormKey((k) => k + 1);
    setNewProductOpen(true);
  }, []);

  const deleteProductMut = useMutation(deleteSellerProductMutationOptions(queryClient, locale));
  const publishProductMut = useMutation(publishSellerProductMutationOptions(queryClient, locale));

  const onPublishProduct = useCallback(
    (productId: string) => {
      publishProductMut.mutate(productId, {
        onSuccess: () => {
          toast.success("Product published");
        },
        onError: (e) => {
          toast.error((e as Error).message);
        },
      });
    },
    [publishProductMut],
  );

  const onDeleteProduct = useCallback(
    (productId: string) => {
      if (!window.confirm("Delete this product?")) return;
      deleteProductMut.mutate(productId, {
        onSuccess: () => {
          setEditProductId((current) => {
            if (current === productId) {
              setEditProductOpen(false);
              return null;
            }
            return current;
          });
        },
      });
    },
    [deleteProductMut],
  );

  const deletingProductId =
    deleteProductMut.isPending && deleteProductMut.variables != null
      ? deleteProductMut.variables
      : null;

  const publishingProductId =
    publishProductMut.isPending && publishProductMut.variables != null
      ? publishProductMut.variables
      : null;

  const columns = useMemo(
    () =>
      getSellerProductColumns(locale, {
        onDeleteProduct,
        deletingProductId,
        onPublishProduct,
        publishingProductId,
      }),
    [locale, onDeleteProduct, deletingProductId, onPublishProduct, publishingProductId],
  );

  useEffect(() => {
    if (!openFromUrl) return;
    void navigate({
      to: "/$locale/sell/products",
      params: { locale },
      search: { new: false, edit: undefined },
      replace: true,
    });
    if (!session?.user) return;
    setEditProductOpen(false);
    setEditProductId(null);
    setNewProductFormKey((k) => k + 1);
    setNewProductOpen(true);
  }, [openFromUrl, locale, navigate, session?.user]);

  useEffect(() => {
    if (!editFromUrl) return;
    const id = editFromUrl;
    void navigate({
      to: "/$locale/sell/products",
      params: { locale },
      search: { new: false, edit: undefined },
      replace: true,
    });
    if (!session?.user) return;
    setNewProductOpen(false);
    setEditProductFormKey((k) => k + 1);
    setEditProductId(id);
    setEditProductOpen(true);
  }, [editFromUrl, locale, navigate, session?.user]);

  if (!session?.user) {
    return (
      <div className="mx-auto max-w-3xl px-4">
        <p className="text-muted-foreground">Sign in to manage your products.</p>
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
          Your shop is {shop.status}. You can list products once it&apos;s active.
        </p>
      </div>
    );
  }

  const products = productsState.data?.products ?? [];
  const productsLoading = productsState.isLoading;

  return (
    <div className="@container/main flex min-h-0 flex-1 flex-col">
      <Dialog open={newProductOpen} onOpenChange={setNewProductOpen}>
        <DialogContent
          showCloseButton
          className="flex max-h-[min(90vh,56rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl"
        >
          <DialogHeader className="shrink-0 gap-1 border-b px-6 py-4 text-left">
            <DialogTitle>New product</DialogTitle>
            <DialogDescription>
              Add category, variants, images, and description for your listing.
            </DialogDescription>
          </DialogHeader>
          <SellerProductNewDialogForm
            key={newProductFormKey}
            onCreated={() => setNewProductOpen(false)}
            onCancel={() => setNewProductOpen(false)}
          />
        </DialogContent>
      </Dialog>
      <Dialog
        open={editProductOpen}
        onOpenChange={(open) => {
          if (!open) closeEditProductDialog();
        }}
      >
        <DialogContent
          showCloseButton
          className="flex max-h-[min(90vh,56rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl"
        >
          <DialogHeader className="shrink-0 gap-1 border-b px-6 py-4 text-left">
            <DialogTitle>Edit product</DialogTitle>
            <DialogDescription>
              Update this product&apos;s details, stock, and publish state.
            </DialogDescription>
          </DialogHeader>
          {editProductId ? (
            <SellerProductEditDialogForm
              key={`${editProductId}-${editProductFormKey}`}
              productId={editProductId}
              onSaved={closeEditProductDialog}
              onCancel={closeEditProductDialog}
            />
          ) : null}
        </DialogContent>
      </Dialog>
      {productsLoading ? (
        <p className="text-sm text-muted-foreground">Loading products…</p>
      ) : (
        <SellerShellDataTable
          columns={columns}
          data={products}
          filterColumnId="name"
          filterPlaceholder="Filter by name…"
          countNoun="product"
          toolbarEnd={
            <Button type="button" onClick={openNewProductDialog}>
              <Plus className="size-3.5 shrink-0" aria-hidden />
              New product
            </Button>
          }
        />
      )}
    </div>
  );
}
