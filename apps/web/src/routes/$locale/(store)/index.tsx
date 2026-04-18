import type { Locale } from "@ys/intl";
import { createFileRoute } from "@tanstack/react-router";

import {
  HomePage,
  categoriesQuery,
  featuredListingsQuery,
} from "@/features/store/home";
import { promotionsListQuery } from "@/features/store/promotions/promotions.queries";

export const Route = createFileRoute("/$locale/(store)/")({
  loader: ({ context, params }) => {
    const locale = params.locale as Locale;
    return Promise.all([
      context.queryClient.ensureQueryData(categoriesQuery(locale)),
      context.queryClient.ensureQueryData(featuredListingsQuery(locale, 12)),
      context.queryClient.ensureQueryData(promotionsListQuery(locale)),
    ]);
  },
  pendingComponent: () => (
    <main className="p-8 text-muted-foreground">Loading…</main>
  ),
  errorComponent: ({ error }) => (
    <main className="p-8 text-destructive">
      {error instanceof Error ? error.message : "Something went wrong"}
    </main>
  ),
  component: HomePage,
});
