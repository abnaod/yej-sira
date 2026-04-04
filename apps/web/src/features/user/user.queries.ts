import { queryOptions } from "@tanstack/react-query";

import { apiFetchJson } from "@/lib/api";

export type UserMeShop = {
  id: string;
  slug: string;
  name: string;
  status: "pending" | "active" | "rejected" | "suspended";
};

export type UserMe = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  role: "customer" | "admin";
  shop: UserMeShop | null;
  createdAt: string;
  updatedAt: string;
};

export type UserMeResponse = { user: UserMe };

export const userMeQueryOptions = queryOptions({
  queryKey: ["user", "me"] as const,
  queryFn: () => apiFetchJson<UserMeResponse>("/api/users/me"),
});
