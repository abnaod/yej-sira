import type { Locale } from "@ys/intl";
import { createFileRoute } from "@tanstack/react-router";

import { PromotionPage } from "@/features/promotions";
import { promotionDetailQuery } from "@/features/promotions/promotions.queries";

export const Route = createFileRoute("/$locale/(store)/promotions/$slug")({
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(
      promotionDetailQuery(params.locale as Locale, params.slug),
    );
  },
  pendingComponent: () => (
    <main className="p-8 text-muted-foreground">Loading…</main>
  ),
  errorComponent: ({ error }) => (
    <main className="p-8 text-destructive">
      {error instanceof Error ? error.message : "Something went wrong"}
    </main>
  ),
  component: PromotionPage,
});
