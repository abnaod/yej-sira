import type { Locale } from "@ys/intl";
import { useSuspenseQuery } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";

import { orderDetailQuery } from "./orders.queries";
import { OrderDetailView } from "./order-detail-view";

const routeApi = getRouteApi("/$locale/(store)/orders/$orderId");

export function OrderDetailPage() {
  const { orderId, locale: localeParam } = routeApi.useParams();
  const locale = localeParam as Locale;

  const { data } = useSuspenseQuery(orderDetailQuery(locale, orderId));

  return (
    <OrderDetailView
      locale={locale}
      order={data.order}
      queryKey={["orders", locale, orderId]}
      showBackToOrders
    />
  );
}
