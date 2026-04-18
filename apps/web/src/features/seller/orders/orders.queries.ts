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
  /** First line item’s listing label (name + optional variant) for this shop. */
  listingName: string;
};

export type SellerOrdersResponse = {
  orders: SellerOrderListItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type SellerOrdersQueryParams = {
  page?: number;
  pageSize?: number;
  q?: string;
};

export const sellerOrdersQuery = (locale: Locale, params: SellerOrdersQueryParams = {}) => {
  const search = new URLSearchParams();
  if (params.page) search.set("page", String(params.page));
  if (params.pageSize) search.set("pageSize", String(params.pageSize));
  if (params.q) search.set("q", params.q);
  const qs = search.toString();
  return queryOptions({
    queryKey: ["seller", "orders", locale, params] as const,
    queryFn: () =>
      apiFetchJson<SellerOrdersResponse>(`/api/seller/orders${qs ? `?${qs}` : ""}`, { locale }),
  });
};

export type SellerOrderDetailResponse = {
  order: {
    id: string;
    status: string;
    shopSubtotal: number;
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

export const sellerOrderDetailQuery = (locale: Locale, orderId: string) =>
  queryOptions({
    queryKey: ["seller", "orders", locale, orderId] as const,
    queryFn: () =>
      apiFetchJson<SellerOrderDetailResponse>(
        `/api/seller/orders/${encodeURIComponent(orderId)}`,
        { locale },
      ),
  });
