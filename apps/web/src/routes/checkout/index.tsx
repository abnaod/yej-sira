import { createFileRoute } from "@tanstack/react-router";

import { CheckoutPage } from "@/features/checkout";
import { cartQuery } from "@/features/cart";

export const Route = createFileRoute("/checkout/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(cartQuery()),
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
