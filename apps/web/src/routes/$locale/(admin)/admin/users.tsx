import { createFileRoute } from "@tanstack/react-router";

import { AdminUsersPage } from "@/features/admin";

export const Route = createFileRoute("/$locale/(admin)/admin/users")({
  component: AdminUsersPage,
});
