import type { Locale } from "@ys/intl";
import { queryOptions } from "@tanstack/react-query";

import { apiFetchJson } from "@/lib/api";

export type OrdersListResponse = {
  orders: {
    id: string;
    status: string;
    total: number;
    createdAt: string;
    deliveryMethod: "standard" | "pickup";
    itemCount: number;
    payment: {
      status: string;
      txRef: string;
      method: "chapa" | "telebirr" | "cod" | null;
    } | null;
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
    deliveryMethod: "standard" | "pickup";
    pickupLocation: {
      id: string;
      name: string;
      line1: string;
      line2: string | null;
      city: string;
      postalCode: string;
      country: string;
    } | null;
    shippingAddress: {
      city: string;
      subcity: string;
      woreda: string;
      kebele: string;
      specificLocation: string;
    };
    createdAt: string;
    payment: {
      method: "chapa" | "telebirr" | "cod" | null;
      status: string;
    } | null;
    items: {
      id: string;
      listingName: string;
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
