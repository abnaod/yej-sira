import { createFileRoute } from "@tanstack/react-router";

import { SellerRegisterPage } from "@/features/seller";

export const Route = createFileRoute("/$locale/(seller)/sell/register")({
  component: SellerRegisterPage,
});
