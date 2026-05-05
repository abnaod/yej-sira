import { createFileRoute } from "@tanstack/react-router";

import { SellerMessagesLayout } from "@/features/seller/messages/seller-messages-layout";

export const Route = createFileRoute("/$locale/(seller)/sell/messages")({
  component: SellerMessagesLayout,
});
