import type { Locale } from "@ys/intl";
import { createFileRoute } from "@tanstack/react-router";

import { ListingPage } from "@/features/listings";
import {
  moreFromShopListingsQuery,
  listingDetailQuery,
  relatedListingsQuery,
} from "@/features/listings/listings.queries";

export const Route = createFileRoute("/$locale/(store)/listings/$listingId")({
  loader: async ({ context, params }) => {
    const locale = params.locale as Locale;
    await Promise.all([
      context.queryClient.ensureQueryData(listingDetailQuery(locale, params.listingId)),
      context.queryClient.ensureQueryData(relatedListingsQuery(locale, params.listingId)),
      context.queryClient.ensureQueryData(
        moreFromShopListingsQuery(locale, params.listingId),
      ),
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
  component: ListingPage,
});
