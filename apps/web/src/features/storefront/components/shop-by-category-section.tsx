import { useSuspenseQuery } from "@tanstack/react-query";

import { CategoryCard } from "@/components/ui/category-card";
import { categoriesQuery } from "../storefront.queries";

export function ShopByCategorySection() {
  const { data } = useSuspenseQuery(categoriesQuery());

  return (
    <section>
      <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
        Shop by category
      </h2>
      <div className="mt-8 grid w-full grid-cols-[repeat(3,minmax(0,9rem))] justify-center gap-x-5 gap-y-6 sm:mt-10 sm:grid-cols-[repeat(6,minmax(0,9rem))]">
        {data.categories.map((category) => (
          <CategoryCard
            key={category.slug}
            name={category.name}
            slug={category.slug}
            imageUrl={category.imageUrl}
            className="w-full"
          />
        ))}
      </div>
    </section>
  );
}
