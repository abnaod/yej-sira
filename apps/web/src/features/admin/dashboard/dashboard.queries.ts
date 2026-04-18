import { queryOptions } from "@tanstack/react-query";

import { apiFetchJson } from "@/lib/api";

export type AdminStatsResponse = {
  userCount: number;
  shopCount: number;
  pendingShopCount: number;
  listingCount: number;
  publishedListingCount: number;
  orderCount: number;
  orders30dCount: number;
  revenue30d: number;
  ordersByDay: { date: string; orders: number }[];
  recentOrders: {
    id: string;
    createdAt: string;
    status: string;
    total: number;
    user: { id: string; email: string; name: string } | null;
  }[];
};

export const adminStatsQuery = () =>
  queryOptions({
    queryKey: ["admin", "stats"] as const,
    queryFn: () => apiFetchJson<AdminStatsResponse>("/api/admin/stats"),
  });
