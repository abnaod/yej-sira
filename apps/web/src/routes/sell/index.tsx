import { createFileRoute } from "@tanstack/react-router";

import { SellPage } from "@/features/sell";

export const Route = createFileRoute("/sell/")({
  component: SellPage,
});
