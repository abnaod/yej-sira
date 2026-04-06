import type { Locale } from "@ys/intl";
import { createFileRoute } from "@tanstack/react-router";

import { OrderHistoryPage, ordersListQuery } from "@/features/orders";

export const Route = createFileRoute("/$locale/(store)/orders/")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(ordersListQuery(params.locale as Locale)),
  pendingComponent: () => (
    <main className="p-8 text-muted-foreground">Loading…</main>
  ),
  errorComponent: ({ error }) => (
    <main className="p-8 text-destructive">
      {error instanceof Error ? error.message : "Could not load orders"}
    </main>
  ),
  component: OrderHistoryPage,
});
