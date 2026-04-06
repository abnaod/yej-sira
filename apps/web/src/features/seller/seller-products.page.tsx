import type { Locale } from "@ys/intl";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { useLocale } from "@/lib/locale-path";
import { myShopQuery } from "./seller-shop.queries";
import { getSellerProductColumns } from "./seller-products-columns";
import { sellerProductsQuery } from "./seller.queries";
import { SellerShellDataTable } from "./seller-shell-data-table";

export function SellerProductsPage() {
  const locale = useLocale() as Locale;
  const { data: session } = authClient.useSession();
  const shopState = useQuery({
    ...myShopQuery(locale),
    enabled: !!session?.user,
  });
  const productsState = useQuery({
    ...sellerProductsQuery(locale),
    enabled: !!session?.user && shopState.data?.shop?.status === "active",
  });

  const columns = useMemo(() => getSellerProductColumns(locale), [locale]);

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
    <div className="@container/main flex flex-1 flex-col">
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
            <Button asChild>
              <Link to="/$locale/sell/products/new" params={{ locale }}>
                New product
              </Link>
            </Button>
          }
        />
      )}
    </div>
  );
}
