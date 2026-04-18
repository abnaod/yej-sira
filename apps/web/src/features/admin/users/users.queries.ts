import { mutationOptions, queryOptions, type QueryClient } from "@tanstack/react-query";

import { apiFetchJson } from "@/lib/api";

export type AdminUserListItem = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  role: "customer" | "admin";
  orderCount: number;
  shop: { id: string; slug: string; name: string; status: string } | null;
  createdAt: string;
};

export type AdminUsersResponse = {
  users: AdminUserListItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export const adminUsersQuery = (params: { q?: string; page?: number; pageSize?: number } = {}) => {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.page) search.set("page", String(params.page));
  if (params.pageSize) search.set("pageSize", String(params.pageSize));
  const qs = search.toString();
  return queryOptions({
    queryKey: ["admin", "users", params] as const,
    queryFn: () =>
      apiFetchJson<AdminUsersResponse>(`/api/admin/users${qs ? `?${qs}` : ""}`),
  });
};

export function updateAdminUserRoleMutation(queryClient: QueryClient) {
  return mutationOptions({
    mutationKey: ["admin", "users", "update-role"] as const,
    mutationFn: (args: { id: string; role: "customer" | "admin" }) =>
      apiFetchJson<{ user: { id: string; role: string; email: string } }>(
        `/api/admin/users/${encodeURIComponent(args.id)}`,
        {
          method: "PATCH",
          body: JSON.stringify({ role: args.role }),
        },
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
  });
}
