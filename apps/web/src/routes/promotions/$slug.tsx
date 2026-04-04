import { createFileRoute } from "@tanstack/react-router";

import { PromotionPage, promotionDetailQuery } from "@/features/promotions";

export const Route = createFileRoute("/promotions/$slug")({
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(promotionDetailQuery(params.slug));
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
