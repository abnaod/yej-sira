import type { Locale } from "@ys/intl";
import { createFileRoute } from "@tanstack/react-router";

import { ShopPage } from "@/features/store/shop/shop.page";
import { shopPublicQuery } from "@/features/store/shop/shop.queries";

export const Route = createFileRoute("/$locale/(store)/shops/$shopSlug")({
  validateSearch: (search: Record<string, unknown>) => {
    const raw = search.page;
    const n = typeof raw === "string" || typeof raw === "number" ? Number(raw) : NaN;
    const page = Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
    return { page };
  },
  loaderDeps: ({ search }) => ({ page: search.page }),
  loader: async ({ context, params, deps }) => {
    const locale = params.locale as Locale;
    await context.queryClient.ensureQueryData(
      shopPublicQuery(locale, params.shopSlug, deps.page),
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
  component: ShopPage,
});
