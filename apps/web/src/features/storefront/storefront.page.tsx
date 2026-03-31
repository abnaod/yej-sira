import { FeaturedSection } from "./components/featured-section";
import { HeroSection } from "./components/hero-section";
import { ShopByCategorySection } from "./components/shop-by-category-section";

export function StorefrontPage() {
  return (
    <main className="flex flex-col gap-12 lg:gap-16">
      <HeroSection />
      <ShopByCategorySection />
      <FeaturedSection />
    </main>
  );
}
