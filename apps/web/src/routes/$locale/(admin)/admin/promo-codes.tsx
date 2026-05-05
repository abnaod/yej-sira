import { createFileRoute } from "@tanstack/react-router";

import { AdminPromoCodesPage } from "@/features/admin";

export const Route = createFileRoute("/$locale/(admin)/admin/promo-codes")({
  component: AdminPromoCodesPage,
});
