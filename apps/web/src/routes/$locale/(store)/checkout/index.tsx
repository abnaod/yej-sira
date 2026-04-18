import type { Locale } from "@ys/intl";
import { createFileRoute } from "@tanstack/react-router";

import { CheckoutPage } from "@/features/store/checkout";
import { cartQuery } from "@/features/store/cart";

export const Route = createFileRoute("/$locale/(store)/checkout/")({
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
  component: CheckoutPage,
});
