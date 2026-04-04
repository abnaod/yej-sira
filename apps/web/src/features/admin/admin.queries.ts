import type { Locale } from "@ys/intl";
import { mutationOptions, queryOptions, type QueryClient } from "@tanstack/react-query";

import { apiFetchJson } from "@/lib/api";

export type AdminShopRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  status: "pending" | "active" | "rejected" | "suspended";
  owner: { id: string; name: string; email: string } | null;
  productCount: number;
  createdAt: string;
  updatedAt: string;
};

export type AdminShopsResponse = { shops: AdminShopRow[] };

export const adminShopsQuery = (locale: Locale, status?: string) =>
  queryOptions({
    queryKey: ["admin", "shops", locale, status ?? "all"] as const,
    queryFn: () =>
      apiFetchJson<AdminShopsResponse>(
        `/api/admin/shops${status ? `?status=${encodeURIComponent(status)}` : ""}`,
        { locale },
      ),
  });

export function patchAdminShopMutationOptions(queryClient: QueryClient, locale: Locale) {
  return mutationOptions({
    mutationKey: ["admin", "shops", "patch", locale] as const,
    mutationFn: (input: {
      id: string;
      status?: "pending" | "active" | "rejected" | "suspended";
      name?: string;
    }) =>
      apiFetchJson<{ shop: { id: string; slug: string; name: string; status: string } }>(
        `/api/admin/shops/${encodeURIComponent(input.id)}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            ...(input.status != null ? { status: input.status } : {}),
            ...(input.name != null ? { name: input.name } : {}),
          }),
          locale,
        },
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "shops", locale] });
    },
  });
}
