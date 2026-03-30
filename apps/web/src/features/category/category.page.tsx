import { getRouteApi } from "@tanstack/react-router";

const routeApi = getRouteApi("/categories/$categoryId");

export function CategoryPage() {
  const { categoryId } = routeApi.useParams();

  return (
    <main>
      <h1 className="text-2xl font-semibold tracking-tight">Category</h1>
      <p className="mt-2 text-neutral-600">Category ID: {categoryId}</p>
    </main>
  );
}
