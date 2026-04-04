import type { Locale } from "@ys/intl";
import { createFileRoute } from "@tanstack/react-router";

import { CartPage } from "@/features/cart";
import { cartQuery } from "@/features/cart/cart.queries";

export const Route = createFileRoute("/$locale/cart/")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(cartQuery(params.locale as Locale)),
  pendingComponent: () => (
    <main className="p-8 text-muted-foreground">Loading…</main>
  ),
  errorComponent: ({ error }) => (
    <main className="p-8 text-destructive">
      {error instanceof Error ? error.message : "Could not load cart"}
    </main>
  ),
  component: CartPage,
});
