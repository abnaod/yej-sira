import { useSuspenseQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { CategoryCard } from "@/components/ui/category-card";
import { useLocale } from "@/lib/locale-path";

import { categoriesQuery } from "../storefront.queries";

export function ShopByCategorySection() {
  const { t } = useTranslation("common");
  const locale = useLocale();
  const { data } = useSuspenseQuery(categoriesQuery(locale));

  return (
    <section>
      <div className="text-center">
        <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
          {t("shopByCategory")}
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
          {t("shopByCategorySubtitle")}
        </p>
      </div>
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
