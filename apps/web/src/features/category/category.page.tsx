import { getRouteApi } from "@tanstack/react-router";

import { ProductCard } from "@/components/ui/product-card";
import { CategoryToolbar } from "./components/category-toolbar";

const routeApi = getRouteApi("/categories/$categoryId");

const categoryProducts = [
  {
    id: "1",
    name: "Hand-glazed stoneware mug",
    price: 36.0,
    description: "Wheel-thrown, food-safe glaze · Made in Vermont",
    imageUrl:
      "https://images.unsplash.com/photo-1493106641515-6b5631de4bb9?w=300&q=80",
    rating: 5,
    reviewCount: 214,
  },
  {
    id: "2",
    name: "Block-print linen pillow cover",
    price: 48.0,
    description: "Natural linen · Hand block printed in small batches",
    imageUrl:
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=300&q=80",
    rating: 4.5,
    reviewCount: 89,
  },
  {
    id: "3",
    name: "Hammered sterling silver earrings",
    price: 62.0,
    description: "Solid sterling · Each pair slightly unique",
    imageUrl:
      "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=300&q=80",
    rating: 5,
    reviewCount: 156,
  },
  {
    id: "4",
    name: "Olive wood serving board",
    price: 54.0,
    description: "Single piece of olive wood, hand oiled",
    imageUrl:
      "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=300&q=80",
    rating: 4.5,
    reviewCount: 72,
  },
  {
    id: "5",
    name: "Macramé wall hanging",
    price: 78.0,
    description: "100% cotton cord · Handwoven to order",
    imageUrl:
      "https://images.unsplash.com/photo-1622372738946-62e02505feb3?w=300&q=80",
    rating: 4.5,
    reviewCount: 134,
  },
  {
    id: "6",
    name: "Ceramic speckled vase",
    price: 44.0,
    description: "Hand-thrown stoneware · Matte finish",
    imageUrl:
      "https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?w=300&q=80",
    rating: 5,
    reviewCount: 98,
  },
  {
    id: "7",
    name: "Woven rattan basket set",
    price: 56.0,
    description: "Set of 3 · Natural rattan · Fair trade",
    imageUrl:
      "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=300&q=80",
    rating: 4,
    reviewCount: 63,
  },
  {
    id: "8",
    name: "Hand-poured soy candle",
    price: 28.0,
    description: "Lavender & sage · 50-hour burn time",
    imageUrl:
      "https://images.unsplash.com/photo-1602607451009-3d341120aa72?w=300&q=80",
    rating: 5,
    reviewCount: 312,
  },
];

export function CategoryPage() {
  const { categoryId } = routeApi.useParams();

  return (
    <main>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight capitalize">
          {categoryId.replace(/-/g, " ")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {categoryProducts.length} results
        </p>
      </div>

      <CategoryToolbar categoryId={categoryId} />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {categoryProducts.map((product) => (
          <ProductCard key={product.id} {...product} />
        ))}
      </div>
    </main>
  );
}
