import { createFileRoute } from "@tanstack/react-router";

import { OrderHistoryPage, ordersListQuery } from "@/features/orders";

export const Route = createFileRoute("/orders/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(ordersListQuery()),
  pendingComponent: () => (
    <main className="p-8 text-muted-foreground">Loading…</main>
  ),
  errorComponent: ({ error }) => (
    <main className="p-8">
      <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
      <p className="mt-2 text-destructive">
        {error instanceof Error ? error.message : "Could not load orders"}
      </p>
      <p className="mt-2 text-sm text-muted-foreground">Sign in to see your order history.</p>
    </main>
  ),
  component: OrderHistoryPage,
});
