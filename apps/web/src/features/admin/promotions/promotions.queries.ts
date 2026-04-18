import { mutationOptions, queryOptions, type QueryClient } from "@tanstack/react-query";

import { apiFetchJson } from "@/lib/api";

export type AdminPromotionListItem = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  badgeLabel: string;
  startsAt: string;
  endsAt: string;
  heroImageUrl: string | null;
  sortOrder: number;
  priority: number;
  listingCount: number;
  titleAm: string | null;
  subtitleAm: string | null;
  badgeLabelAm: string | null;
};

export type AdminPromotionsResponse = {
  promotions: AdminPromotionListItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export const adminPromotionsQuery = (
  params: { q?: string; page?: number; pageSize?: number } = {},
) => {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.page) search.set("page", String(params.page));
  if (params.pageSize) search.set("pageSize", String(params.pageSize));
  const qs = search.toString();
  return queryOptions({
    queryKey: ["admin", "promotions", params] as const,
    queryFn: () =>
      apiFetchJson<AdminPromotionsResponse>(`/api/admin/promotions${qs ? `?${qs}` : ""}`),
  });
};

export type CreatePromotionBody = {
  slug: string;
  title: string;
  subtitle?: string;
  badgeLabel: string;
  startsAt: string;
  endsAt: string;
  heroImageUrl?: string;
  sortOrder?: number;
  priority?: number;
  titleAm?: string;
  subtitleAm?: string;
  badgeLabelAm?: string;
};

export type PatchPromotionBody = Partial<CreatePromotionBody>;

export function createPromotionMutation(queryClient: QueryClient) {
  return mutationOptions({
    mutationKey: ["admin", "promotions", "create"] as const,
    mutationFn: (body: CreatePromotionBody) =>
      apiFetchJson<{ promotion: { id: string; slug: string } }>("/api/admin/promotions", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "promotions"] });
    },
  });
}

export function updatePromotionMutation(queryClient: QueryClient) {
  return mutationOptions({
    mutationKey: ["admin", "promotions", "update"] as const,
    mutationFn: (args: { id: string; body: PatchPromotionBody }) =>
      apiFetchJson<{ ok: boolean }>(
        `/api/admin/promotions/${encodeURIComponent(args.id)}`,
        {
          method: "PATCH",
          body: JSON.stringify(args.body),
        },
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "promotions"] });
    },
  });
}

export function deletePromotionMutation(queryClient: QueryClient) {
  return mutationOptions({
    mutationKey: ["admin", "promotions", "delete"] as const,
    mutationFn: (id: string) =>
      apiFetchJson<{ ok: boolean }>(`/api/admin/promotions/${encodeURIComponent(id)}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "promotions"] });
    },
  });
}
