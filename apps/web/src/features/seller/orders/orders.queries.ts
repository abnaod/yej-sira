import type { Locale } from "@ys/intl";
import { queryOptions } from "@tanstack/react-query";

import { apiFetchJson } from "@/lib/api";

export type SellerOrderListItem = {
  id: string;
  status: string;
  createdAt: string;
  lineCount: number;
  shopTotal: number;
  imageUrl: string;
};

export type SellerOrdersResponse = { orders: SellerOrderListItem[] };

export const sellerOrdersQuery = (locale: Locale) =>
  queryOptions({
    queryKey: ["seller", "orders", locale] as const,
    queryFn: () => apiFetchJson<SellerOrdersResponse>("/api/seller/orders", { locale }),
  });
