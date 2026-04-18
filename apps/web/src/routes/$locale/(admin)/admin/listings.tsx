import { createFileRoute } from "@tanstack/react-router";

import { AdminListingsPage } from "@/features/admin";

export const Route = createFileRoute("/$locale/(admin)/admin/listings")({
  component: AdminListingsPage,
});
