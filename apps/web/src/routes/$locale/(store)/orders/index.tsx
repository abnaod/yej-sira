import { createFileRoute, redirect } from "@tanstack/react-router";

import { OrderHistoryPage } from "@/features/store/orders";
import { featureCartCheckout } from "@/lib/features";

export const Route = createFileRoute("/$locale/(store)/orders/")({
  beforeLoad: ({ params }) => {
    if (!featureCartCheckout) {
      throw redirect({ to: "/$locale", params: { locale: params.locale } });
    }
  },
  component: OrderHistoryPage,
});
