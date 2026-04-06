import { createFileRoute } from "@tanstack/react-router";

import { SellerLandingPage } from "@/features/seller/seller-landing.page";

export const Route = createFileRoute("/$locale/(seller)/sell/")({
  component: SellerLandingPage,
});
