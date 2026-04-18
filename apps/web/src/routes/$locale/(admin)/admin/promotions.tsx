import { createFileRoute } from "@tanstack/react-router";

import { AdminPromotionsPage } from "@/features/admin";

export const Route = createFileRoute("/$locale/(admin)/admin/promotions")({
  component: AdminPromotionsPage,
});
