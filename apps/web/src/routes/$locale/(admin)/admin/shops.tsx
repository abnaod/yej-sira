import { createFileRoute } from "@tanstack/react-router";

import { AdminShopsPage } from "@/features/admin";

export const Route = createFileRoute("/$locale/(admin)/admin/shops")({
  component: AdminShopsPage,
});
