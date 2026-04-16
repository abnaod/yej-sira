import { createFileRoute } from "@tanstack/react-router";

import { SellerListingsPage } from "@/features/seller";

export const Route = createFileRoute("/$locale/(seller)/sell/listings/")({
  validateSearch: (search: Record<string, unknown>) => ({
    new:
      search.new === true ||
      search.new === "true" ||
      search.new === 1 ||
      search.new === "1",
    edit:
      typeof search.edit === "string" && search.edit.length > 0 ? search.edit : undefined,
  }),
  component: SellerListingsPage,
});
