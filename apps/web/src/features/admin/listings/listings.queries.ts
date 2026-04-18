import { mutationOptions, queryOptions, type QueryClient } from "@tanstack/react-query";

import { apiFetchJson } from "@/lib/api";

export type AdminListingListItem = {
  id: string;
  slug: string;
  name: string;
  isPublished: boolean;
  featured: boolean;
  priceFrom: number;
  imageUrl: string;
  shop: { id: string; slug: string; name: string; status: string };
  category: { id: string; slug: string; name: string };
  updatedAt: string;
};

export type AdminListingsResponse = {
  listings: AdminListingListItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export const adminListingsQuery = (
  params: { q?: string; page?: number; pageSize?: number } = {},
) => {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.page) search.set("page", String(params.page));
  if (params.pageSize) search.set("pageSize", String(params.pageSize));
  const qs = search.toString();
  return queryOptions({
    queryKey: ["admin", "listings", params] as const,
    queryFn: () =>
      apiFetchJson<AdminListingsResponse>(`/api/admin/listings${qs ? `?${qs}` : ""}`),
  });
};

export function updateAdminListingMutation(queryClient: QueryClient) {
  return mutationOptions({
    mutationKey: ["admin", "listings", "update"] as const,
    mutationFn: (args: { id: string; isPublished?: boolean; featured?: boolean }) =>
      apiFetchJson<{ listing: { id: string; isPublished: boolean; featured: boolean } }>(
        `/api/admin/listings/${encodeURIComponent(args.id)}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            ...(args.isPublished != null ? { isPublished: args.isPublished } : {}),
            ...(args.featured != null ? { featured: args.featured } : {}),
          }),
        },
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "listings"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
  });
}

export function deleteAdminListingMutation(queryClient: QueryClient) {
  return mutationOptions({
    mutationKey: ["admin", "listings", "delete"] as const,
    mutationFn: (id: string) =>
      apiFetchJson<{ ok: boolean }>(`/api/admin/listings/${encodeURIComponent(id)}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "listings"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
  });
}
