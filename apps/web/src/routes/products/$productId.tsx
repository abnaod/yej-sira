import { createFileRoute } from "@tanstack/react-router";

import {
  ProductPage,
  productDetailQuery,
  relatedProductsQuery,
} from "@/features/product";

export const Route = createFileRoute("/products/$productId")({
  loader: async ({ context, params }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(productDetailQuery(params.productId)),
      context.queryClient.ensureQueryData(relatedProductsQuery(params.productId)),
    ]);
  },
  pendingComponent: () => (
    <main className="p-8 text-muted-foreground">Loading…</main>
  ),
  errorComponent: ({ error }) => (
    <main className="p-8 text-destructive">
      {error instanceof Error ? error.message : "Product not found"}
    </main>
  ),
  component: ProductPage,
});
