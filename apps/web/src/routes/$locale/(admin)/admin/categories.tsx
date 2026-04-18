import { createFileRoute } from "@tanstack/react-router";

import { AdminCategoriesPage } from "@/features/admin";

export const Route = createFileRoute("/$locale/(admin)/admin/categories")({
  component: AdminCategoriesPage,
});
