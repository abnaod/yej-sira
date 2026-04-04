import { createFileRoute } from "@tanstack/react-router";

import { AdminShopsPage } from "@/features/admin/admin-shops.page";

export const Route = createFileRoute("/$locale/admin/shops")({
  component: AdminShopsPage,
});
