import { createFileRoute } from "@tanstack/react-router";

import { AdminOrdersPage } from "@/features/admin";

export const Route = createFileRoute("/$locale/(admin)/admin/orders/")({
  component: AdminOrdersPage,
});
