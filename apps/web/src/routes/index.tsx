import { createFileRoute } from "@tanstack/react-router";

import {
  StorefrontPage,
  categoriesQuery,
  featuredProductsQuery,
} from "@/features/storefront";
import { promotionsListQuery } from "@/features/promotions/promotions.queries";

export const Route = createFileRoute("/")({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(categoriesQuery()),
      context.queryClient.ensureQueryData(featuredProductsQuery(12)),
      context.queryClient.ensureQueryData(promotionsListQuery()),
    ]),
  pendingComponent: () => (
    <main className="p-8 text-muted-foreground">Loading…</main>
  ),
  errorComponent: ({ error }) => (
    <main className="p-8 text-destructive">
      {error instanceof Error ? error.message : "Something went wrong"}
    </main>
  ),
  component: StorefrontPage,
});
