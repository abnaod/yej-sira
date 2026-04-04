import { createFileRoute } from "@tanstack/react-router";

import { CartPage, cartQuery } from "@/features/cart";

export const Route = createFileRoute("/cart/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(cartQuery()),
  pendingComponent: () => (
    <main className="p-8 text-muted-foreground">Loading cart…</main>
  ),
  errorComponent: ({ error }) => (
    <main className="p-8 text-destructive">
      {error instanceof Error ? error.message : "Could not load cart"}
    </main>
  ),
  component: CartPage,
});
