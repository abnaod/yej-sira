import { createFileRoute } from "@tanstack/react-router";

import { CategoryPage } from "@/features/category/category.page";

export const Route = createFileRoute("/categories/$categoryId")({
  component: CategoryPage,
});
