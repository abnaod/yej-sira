import type { Locale } from "@ys/intl";
import { createFileRoute, redirect } from "@tanstack/react-router";

import { CheckoutPage } from "@/features/store/checkout";
import { cartQuery } from "@/features/store/cart";
import { featureCartCheckout } from "@/lib/features";

export const Route = createFileRoute("/$locale/(store)/checkout/")({
  beforeLoad: ({ params }) => {
    if (!featureCartCheckout) {
      throw redirect({ to: "/$locale", params: { locale: params.locale } });
    }
  },
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
