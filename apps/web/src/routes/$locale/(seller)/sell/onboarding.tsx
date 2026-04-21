import { createFileRoute } from "@tanstack/react-router";

import { SellerOnboardingPage } from "@/features/seller";

export const Route = createFileRoute("/$locale/(seller)/sell/onboarding")({
  component: SellerOnboardingPage,
});
