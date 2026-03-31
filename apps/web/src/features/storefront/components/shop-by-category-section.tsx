import { CategoryCard } from "@/components/ui/category-card";

const categories = [
  {
    name: "Jewelry & Accessories",
    imageUrl:
      "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400&q=80",
  },
  {
    name: "Home & Living",
    imageUrl:
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&q=80",
  },
  {
    name: "Art & Collectibles",
    imageUrl:
      "https://images.unsplash.com/photo-1503602642458-232111445657?w=400&q=80",
  },
  {
    name: "Paper & Party",
    imageUrl:
      "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=400&q=80",
  },
  {
    name: "Vintage",
    imageUrl:
      "https://images.unsplash.com/photo-1461360228754-6e81c478b882?w=400&q=80",
  },
  {
    name: "Clothing",
    imageUrl:
      "https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&q=80",
  },
];

export function ShopByCategorySection() {
  return (
    <section>
      <h2 className="text-xl font-bold tracking-tight md:text-2xl">
        Shop Our Top Categories
      </h2>
      <div className="mt-4 grid grid-cols-3 gap-4 sm:grid-cols-6">
        {categories.map((category) => (
          <CategoryCard
            key={category.name}
            name={category.name}
            imageUrl={category.imageUrl}
          />
        ))}
      </div>
    </section>
  );
}
