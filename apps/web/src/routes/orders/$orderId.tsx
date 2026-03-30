import { createFileRoute } from "@tanstack/react-router";

import { OrderDetailPage } from "@/features/orders/order-detail/order-detail.page";

export const Route = createFileRoute("/orders/$orderId")({
  component: OrderDetailPage,
});
