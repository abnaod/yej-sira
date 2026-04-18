import { createFileRoute } from "@tanstack/react-router";

import { AdminDashboardPage } from "@/features/admin";

export const Route = createFileRoute("/$locale/(admin)/admin/dashboard")({
  component: AdminDashboardPage,
});
