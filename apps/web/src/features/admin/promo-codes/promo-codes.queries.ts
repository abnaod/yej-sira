import { mutationOptions, queryOptions, type QueryClient } from "@tanstack/react-query";

import { apiFetchJson } from "@/lib/api";

export type AdminPromoCode = {
  id: string;
  code: string;
  description: string | null;
  discountPercent: number | null;
  discountAmount: number | null;
  minSubtotal: number | null;
  maxRedemptions: number | null;
  perUserLimit: number | null;
  redemptions: number;
  validFrom: string | null;
  validUntil: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AdminPromoCodeListResponse = {
  promoCodes: AdminPromoCode[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export const adminPromoCodesQuery = (params: { page: number; q?: string }) =>
  queryOptions({
    queryKey: ["admin", "promo-codes", params] as const,
    queryFn: (): Promise<AdminPromoCodeListResponse> => {
      const qs = new URLSearchParams();
      qs.set("page", String(params.page));
      qs.set("pageSize", "25");
      if (params.q) qs.set("q", params.q);
      return apiFetchJson<AdminPromoCodeListResponse>(`/api/admin/promo-codes?${qs.toString()}`);
    },
  });

export type CreatePromoCodeBody = {
  code: string;
  description?: string;
  discountPercent?: number;
  discountAmount?: number;
  minSubtotal?: number;
  maxRedemptions?: number;
  perUserLimit?: number;
  validFrom?: string;
  validUntil?: string;
  active?: boolean;
};

export function createPromoCodeMutation(queryClient: QueryClient) {
  return mutationOptions({
    mutationKey: ["admin", "promo-codes", "create"] as const,
    mutationFn: (body: CreatePromoCodeBody) =>
      apiFetchJson<{ promoCode: AdminPromoCode }>("/api/admin/promo-codes", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "promo-codes"] });
    },
  });
}

export function updatePromoCodeMutation(queryClient: QueryClient) {
  return mutationOptions({
    mutationKey: ["admin", "promo-codes", "update"] as const,
    mutationFn: ({ id, body }: { id: string; body: Partial<CreatePromoCodeBody> }) =>
      apiFetchJson<{ promoCode: AdminPromoCode }>(`/api/admin/promo-codes/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "promo-codes"] });
    },
  });
}

export function deletePromoCodeMutation(queryClient: QueryClient) {
  return mutationOptions({
    mutationKey: ["admin", "promo-codes", "delete"] as const,
    mutationFn: ({ id }: { id: string }) =>
      apiFetchJson<{ ok: true }>(`/api/admin/promo-codes/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "promo-codes"] });
    },
  });
}
