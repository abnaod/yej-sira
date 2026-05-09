import type { Locale } from "@ys/intl";
import { createFileRoute } from "@tanstack/react-router";

import {
  HomePage,
  categoriesQuery,
  FEATURED_LISTINGS_LIMIT,
  featuredListingsQuery,
} from "@/features/store/home";
import { ShopCatalogPage } from "@/features/store/shop/shop.page";
import { promotionsListQuery } from "@/features/store/promotions/promotions.queries";
import { useActiveStorefrontShop } from "@/lib/storefront-context";
import { useState } from "react";

import type { CategorySort } from "@/features/store/category";

export const Route = createFileRoute("/$locale/(store)/")({
  loader: ({ context, params }) => {
    const locale = params.locale as Locale;
    return Promise.all([
      context.queryClient.ensureQueryData(categoriesQuery(locale)),
      context.queryClient.ensureQueryData(featuredListingsQuery(locale, FEATURED_LISTINGS_LIMIT)),
      context.queryClient.ensureQueryData(promotionsListQuery(locale)),
    ]);
  },
  pendingComponent: () => (
    <main className="p-8 text-muted-foreground">Loading…</main>
  ),
  errorComponent: ({ error }) => (
    <main className="p-8 text-destructive">
      {error instanceof Error ? error.message : "Something went wrong"}
    </main>
  ),
  component: StoreIndexPage,
});

function StoreIndexPage() {
  const { locale } = Route.useParams();
  const shop = useActiveStorefrontShop();
  const [sort, setSort] = useState<CategorySort>("relevancy");
  if (shop) {
    return (
      <ShopCatalogPage
        locale={locale as Locale}
        shopSlug={shop.slug}
        page={1}
        sort={sort}
        showShopHero={false}
        onSortChange={setSort}
      />
    );
  }
  return <HomePage />;
}
