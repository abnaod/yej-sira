import { mutationOptions, queryOptions, type QueryClient } from "@tanstack/react-query";

import { apiFetchJson } from "@/lib/api";

export type AdminCategoryListItem = {
  id: string;
  slug: string;
  name: string;
  nameAm: string | null;
  imageUrl: string;
  sortOrder: number;
  listingCount: number;
  attributeDefinitionCount: number;
  updatedAt: string;
};

export type AdminCategoriesResponse = {
  categories: AdminCategoryListItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export const adminCategoriesQuery = (
  params: { q?: string; page?: number; pageSize?: number } = {},
) => {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.page) search.set("page", String(params.page));
  if (params.pageSize) search.set("pageSize", String(params.pageSize));
  const qs = search.toString();
  return queryOptions({
    queryKey: ["admin", "categories", params] as const,
    queryFn: () =>
      apiFetchJson<AdminCategoriesResponse>(`/api/admin/categories${qs ? `?${qs}` : ""}`),
  });
};

export type CreateCategoryBody = {
  slug: string;
  name: string;
  nameAm?: string;
  imageUrl: string;
  sortOrder?: number;
};

export type PatchCategoryBody = Partial<Omit<CreateCategoryBody, "nameAm">> & {
  nameAm?: string | null;
};

export function createCategoryMutation(queryClient: QueryClient) {
  return mutationOptions({
    mutationKey: ["admin", "categories", "create"] as const,
    mutationFn: (body: CreateCategoryBody) =>
      apiFetchJson<{ category: { id: string; slug: string } }>("/api/admin/categories", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
    },
  });
}

export function updateCategoryMutation(queryClient: QueryClient) {
  return mutationOptions({
    mutationKey: ["admin", "categories", "update"] as const,
    mutationFn: (args: { id: string; body: PatchCategoryBody }) =>
      apiFetchJson<{ ok: boolean }>(
        `/api/admin/categories/${encodeURIComponent(args.id)}`,
        {
          method: "PATCH",
          body: JSON.stringify(args.body),
        },
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
    },
  });
}

export function deleteCategoryMutation(queryClient: QueryClient) {
  return mutationOptions({
    mutationKey: ["admin", "categories", "delete"] as const,
    mutationFn: (id: string) =>
      apiFetchJson<{ ok: boolean }>(`/api/admin/categories/${encodeURIComponent(id)}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
    },
  });
}
