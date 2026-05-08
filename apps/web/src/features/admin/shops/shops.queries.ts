import { mutationOptions, queryOptions, type QueryClient } from "@tanstack/react-query";

import { apiFetchJson } from "@/lib/api";

export type AdminShopListItem = {
  id: string;
  slug: string;
  name: string;
  imageUrl: string | null;
  status: "pending" | "active" | "rejected" | "suspended";
  contactEmail: string | null;
  contactPhone: string | null;
  businessType: "individual" | "business" | null;
  listingCount: number;
  owner: { id: string; name: string; email: string } | null;
  telegramMiniAppUrl: string | null;
  createdAt: string;
};

export type AdminShopsResponse = {
  shops: AdminShopListItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type CreateAdminShopBody = {
  name: string;
  slug: string;
  ownerEmail: string;
  initialPassword: string;
  status?: AdminShopListItem["status"];
  description?: string;
  imageUrl?: string;
  contactEmail?: string;
  contactPhone?: string;
  businessType?: "individual" | "business";
  listingsLimit?: number;
};

export const adminShopsQuery = (
  params: { q?: string; status?: string; page?: number; pageSize?: number } = {},
) => {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.status) search.set("status", params.status);
  if (params.page) search.set("page", String(params.page));
  if (params.pageSize) search.set("pageSize", String(params.pageSize));
  const qs = search.toString();
  return queryOptions({
    queryKey: ["admin", "shops", params] as const,
    queryFn: () =>
      apiFetchJson<AdminShopsResponse>(`/api/admin/shops${qs ? `?${qs}` : ""}`),
  });
};

export function createAdminShopMutation(queryClient: QueryClient) {
  return mutationOptions({
    mutationKey: ["admin", "shops", "create"] as const,
    mutationFn: (body: CreateAdminShopBody) =>
      apiFetchJson<{ shop: { id: string; slug: string; name: string; status: string } }>(
        "/api/admin/shops",
        {
          method: "POST",
          body: JSON.stringify(body),
        },
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "shops"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
  });
}

export function updateAdminShopStatusMutation(queryClient: QueryClient) {
  return mutationOptions({
    mutationKey: ["admin", "shops", "update-status"] as const,
    mutationFn: (args: {
      id: string;
      status: "pending" | "active" | "rejected" | "suspended";
    }) =>
      apiFetchJson<{ shop: { id: string; status: string } }>(
        `/api/admin/shops/${encodeURIComponent(args.id)}`,
        {
          method: "PATCH",
          body: JSON.stringify({ status: args.status }),
        },
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "shops"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
  });
}

export function sendAdminShopPasswordResetMutation(queryClient: QueryClient) {
  return mutationOptions({
    mutationKey: ["admin", "shops", "password-reset"] as const,
    mutationFn: (id: string) =>
      apiFetchJson<{ ok: true; email: string }>(
        `/api/admin/shops/${encodeURIComponent(id)}/password-reset`,
        {
          method: "POST",
        },
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "shops"] });
    },
  });
}
