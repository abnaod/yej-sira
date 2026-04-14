import { createFileRoute } from "@tanstack/react-router";

import { SellerOrdersPage } from "@/features/seller";

export const Route = createFileRoute("/$locale/(seller)/sell/orders/")({
  component: SellerOrdersPage,
});
