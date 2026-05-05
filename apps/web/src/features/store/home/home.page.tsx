import { FeaturedSection } from "./components/featured-section";
import { ShopByCategorySection } from "./components/shop-by-category-section";

export function HomePage() {
  return (
    <main className="flex flex-col gap-12 lg:gap-16">
      <ShopByCategorySection />
      <FeaturedSection />
    </main>
  );
}
