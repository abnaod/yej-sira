import { queryOptions } from "@tanstack/react-query";

import { apiFetchJson } from "@/lib/api";

export type CurrentUserShop = {
  id: string;
  slug: string;
  name: string;
  status: "pending" | "active" | "rejected" | "suspended";
};

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  role: "customer" | "admin";
  createdAt: string;
  updatedAt: string;
  shop: CurrentUserShop | null;
};

export type CurrentUserResponse = { user: CurrentUser };

/**
 * Cached profile fetch used by seller/admin guards and the header menu.
 * Uses a user-scoped query key so switching accounts invalidates naturally.
 */
export const currentUserQuery = () =>
  queryOptions({
    queryKey: ["user", "me"] as const,
    queryFn: () => apiFetchJson<CurrentUserResponse>("/api/users/me"),
  });
