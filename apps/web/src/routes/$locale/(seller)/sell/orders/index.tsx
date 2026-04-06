import { createFileRoute } from "@tanstack/react-router";

import { SellerOrdersPage } from "@/features/seller/seller-orders.page";

export const Route = createFileRoute("/$locale/(seller)/sell/orders/")({
  component: SellerOrdersPage,
});
