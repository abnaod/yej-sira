import { createFileRoute } from "@tanstack/react-router";

import { OrderHistoryPage } from "@/features/store/orders";

export const Route = createFileRoute("/$locale/(store)/orders/")({
  component: OrderHistoryPage,
});
