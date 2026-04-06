import type { Locale } from "@ys/intl";
import { queryOptions } from "@tanstack/react-query";

import { apiFetchJson } from "@/lib/api";

export type SellerDashboardResponse = {
  productCount: number;
  publishedCount: number;
  revenue30d: number;
  orders30d: number;
  ordersByDay: { date: string; orders: number }[];
};

export const sellerDashboardQuery = (locale: Locale) =>
  queryOptions({
    queryKey: ["seller", "dashboard", locale] as const,
    queryFn: () => apiFetchJson<SellerDashboardResponse>("/api/seller/dashboard", { locale }),
  });
