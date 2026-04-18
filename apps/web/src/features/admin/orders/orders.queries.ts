import { mutationOptions, queryOptions, type QueryClient } from "@tanstack/react-query";

import { apiFetchJson } from "@/lib/api";

export type AdminOrderListItem = {
  id: string;
  status: "pending" | "awaiting_payment" | "paid" | "fulfilled" | "cancelled";
  total: number;
  createdAt: string;
  user: { id: string; name: string; email: string };
  itemCount: number;
};

export type AdminOrdersResponse = {
  orders: AdminOrderListItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export const adminOrdersQuery = (
  params: { q?: string; status?: string; page?: number; pageSize?: number } = {},
) => {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.status) search.set("status", params.status);
  if (params.page) search.set("page", String(params.page));
  if (params.pageSize) search.set("pageSize", String(params.pageSize));
  const qs = search.toString();
  return queryOptions({
    queryKey: ["admin", "orders", params] as const,
    queryFn: () =>
      apiFetchJson<AdminOrdersResponse>(`/api/admin/orders${qs ? `?${qs}` : ""}`),
  });
};

export type AdminOrderDetail = {
  id: string;
  status: "pending" | "awaiting_payment" | "paid" | "fulfilled" | "cancelled";
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  deliveryMethod: "standard" | "pickup";
  pickupLocation: {
    id: string;
    name: string;
    line1: string;
    line2: string | null;
    city: string;
  } | null;
  shippingAddress: {
    city: string;
    subcity: string;
    woreda: string;
    kebele: string;
    specificLocation: string;
  };
  user: { id: string; name: string; email: string };
  payment: {
    status: string;
    method: string | null;
    amount: number;
    txRef: string;
  } | null;
  items: {
    id: string;
    listingId: string | null;
    listingName: string;
    variantLabel: string | null;
    unitPrice: number;
    quantity: number;
    imageUrl: string;
  }[];
  createdAt: string;
  updatedAt: string;
};

export const adminOrderDetailQuery = (orderId: string) =>
  queryOptions({
    queryKey: ["admin", "order", orderId] as const,
    queryFn: () =>
      apiFetchJson<{ order: AdminOrderDetail }>(
        `/api/admin/orders/${encodeURIComponent(orderId)}`,
      ),
  });

export function updateAdminOrderStatusMutation(queryClient: QueryClient) {
  return mutationOptions({
    mutationKey: ["admin", "orders", "update-status"] as const,
    mutationFn: (args: { id: string; status: AdminOrderListItem["status"] }) =>
      apiFetchJson<{ order: { id: string; status: string } }>(
        `/api/admin/orders/${encodeURIComponent(args.id)}`,
        {
          method: "PATCH",
          body: JSON.stringify({ status: args.status }),
        },
      ),
    onSuccess: (_r, vars) => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "order", vars.id] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
  });
}
