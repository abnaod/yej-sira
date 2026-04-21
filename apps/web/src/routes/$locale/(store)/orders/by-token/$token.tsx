import type { Locale } from "@ys/intl";
import { createFileRoute } from "@tanstack/react-router";

import { OrderByTokenPage, orderByTokenQuery } from "@/features/store/orders";

export const Route = createFileRoute("/$locale/(store)/orders/by-token/$token")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(
      orderByTokenQuery(params.locale as Locale, params.token),
    ),
  pendingComponent: () => (
    <main className="p-8 text-muted-foreground">Loading…</main>
  ),
  errorComponent: ({ error }) => (
    <main className="p-8">
      <h1 className="text-2xl font-semibold tracking-tight">Order</h1>
      <p className="mt-2 text-destructive">
        {error instanceof Error ? error.message : "Order link is invalid or has expired"}
      </p>
    </main>
  ),
  component: OrderByTokenPage,
});
