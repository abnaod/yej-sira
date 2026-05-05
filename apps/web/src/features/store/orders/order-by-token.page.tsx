import type { Locale } from "@ys/intl";
import { useSuspenseQuery } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";

import { orderByTokenQuery } from "./orders.queries";
import { OrderDetailView } from "./order-detail-view";

const routeApi = getRouteApi("/$locale/(store)/orders/by-token/$token");

export function OrderByTokenPage() {
  const { token, locale: localeParam } = routeApi.useParams();
  const locale = localeParam as Locale;

  const { data } = useSuspenseQuery(orderByTokenQuery(locale, token));

  return (
    <OrderDetailView
      locale={locale}
      order={data.order}
      orderAccessToken={token}
      queryKey={["orders", "by-token", locale, token]}
      showBackToOrders={false}
    />
  );
}
