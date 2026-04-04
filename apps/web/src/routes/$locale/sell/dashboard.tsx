import { createFileRoute } from "@tanstack/react-router";

import { SellerDashboardPage } from "@/features/seller/seller-dashboard.page";

export const Route = createFileRoute("/$locale/sell/dashboard")({
  component: SellerDashboardPage,
});
