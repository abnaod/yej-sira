import type { Locale } from "@ys/intl";
import { queryOptions } from "@tanstack/react-query";

import { apiFetchJson } from "@/lib/api";

export type OrdersListResponse = {
  orders: {
    id: string;
    status: string;
    total: number;
    createdAt: string;
  }[];
};

export const ordersListQuery = (locale: Locale) =>
  queryOptions({
    queryKey: ["orders", locale] as const,
    queryFn: () => apiFetchJson<OrdersListResponse>("/api/orders", { locale }),
  });

export type OrderDetailResponse = {
  order: {
    id: string;
    status: string;
    subtotal: number;
    shipping: number;
    tax: number;
    total: number;
    shippingAddress: {
      line1: string;
      line2?: string | null;
      city: string;
      postalCode: string;
      country: string;
    };
    createdAt: string;
    items: {
      id: string;
      productName: string;
      variantLabel: string | null;
      unitPrice: number;
      quantity: number;
      imageUrl: string;
    }[];
  };
};

export const orderDetailQuery = (locale: Locale, orderId: string) =>
  queryOptions({
    queryKey: ["orders", locale, orderId] as const,
    queryFn: () =>
      apiFetchJson<OrderDetailResponse>(
        `/api/orders/${encodeURIComponent(orderId)}`,
        { locale },
      ),
  });
