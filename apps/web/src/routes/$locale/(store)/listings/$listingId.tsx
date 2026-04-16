import type { Locale } from "@ys/intl";
import { createFileRoute } from "@tanstack/react-router";

import { ProductPage } from "@/features/product";
import {
  moreFromShopProductsQuery,
  productDetailQuery,
  relatedProductsQuery,
} from "@/features/product/product.queries";

export const Route = createFileRoute("/$locale/(store)/products/$productId")({
  loader: async ({ context, params }) => {
    const locale = params.locale as Locale;
    await Promise.all([
      context.queryClient.ensureQueryData(productDetailQuery(locale, params.productId)),
      context.queryClient.ensureQueryData(relatedProductsQuery(locale, params.productId)),
      context.queryClient.ensureQueryData(
        moreFromShopProductsQuery(locale, params.productId),
      ),
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
  component: ProductPage,
});
