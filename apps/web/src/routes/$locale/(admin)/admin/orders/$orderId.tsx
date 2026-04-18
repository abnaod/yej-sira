import { createFileRoute } from "@tanstack/react-router";

import { AdminOrderDetailPage } from "@/features/admin";

export const Route = createFileRoute("/$locale/(admin)/admin/orders/$orderId")({
  component: AdminOrderDetailPage,
});
