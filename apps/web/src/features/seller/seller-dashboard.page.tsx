import type { Locale } from "@ys/intl";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { useLocale } from "@/lib/locale-path";
import { myShopQuery } from "@/features/sell/sell.queries";
import { sellerProductsQuery } from "./seller.queries";

export function SellerDashboardPage() {
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

  if (!session?.user) {
    return (
      <main className="mx-auto max-w-3xl py-12">
        <p className="text-muted-foreground">Sign in to manage your products.</p>
      </main>
    );
  }

  const shop = shopState.data?.shop;
  if (shopState.isLoading) {
    return (
      <main className="mx-auto max-w-3xl py-12">
        <p className="text-muted-foreground">Loading…</p>
      </main>
    );
  }

  if (!shop || shop === null) {
    return (
      <main className="mx-auto max-w-3xl py-12">
        <p className="text-muted-foreground">You don&apos;t have a shop yet.</p>
        <Button className="mt-4" asChild>
          <Link to="/$locale/sell" params={{ locale }}>
            Apply to sell
          </Link>
        </Button>
      </main>
    );
  }

  if (shop.status !== "active") {
    return (
      <main className="mx-auto max-w-3xl py-12">
        <p className="text-muted-foreground">
          Your shop is {shop.status}. You can list products once it&apos;s active.
        </p>
      </main>
    );
  }

  const products = productsState.data?.products ?? [];

  return (
    <main className="mx-auto max-w-3xl py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
          <p className="mt-1 text-sm text-muted-foreground">{shop.name}</p>
        </div>
        <Button asChild>
          <Link to="/$locale/sell/products/new" params={{ locale }}>
            New product
          </Link>
        </Button>
      </div>

      {productsState.isLoading ? (
        <p className="mt-8 text-muted-foreground">Loading products…</p>
      ) : products.length === 0 ? (
        <p className="mt-8 text-muted-foreground">No products yet. Create your first listing.</p>
      ) : (
        <ul className="mt-8 divide-y divide-border rounded-lg border border-border">
          {products.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="font-medium">{p.name}</p>
                <p className="text-xs text-muted-foreground">
                  {p.isPublished ? "Published" : "Draft"} · ${p.priceFrom.toFixed(2)} from
                </p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link
                  to="/$locale/sell/products/$productId"
                  params={{ locale, productId: p.id }}
                >
                  Edit
                </Link>
              </Button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
