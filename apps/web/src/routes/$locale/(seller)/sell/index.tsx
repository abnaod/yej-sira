import { createFileRoute } from "@tanstack/react-router";

import { SellerLandingPage } from "@/features/seller";

export const Route = createFileRoute("/$locale/(seller)/sell/")({
  component: SellerLandingPage,
});
