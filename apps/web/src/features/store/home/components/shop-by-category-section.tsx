import { useSuspenseQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { CategoryCard } from "@/features/store/home/components/category-card";
import { useLocale } from "@/lib/locale-path";

import { categoriesQuery } from "../home.queries";

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
      <div className="mt-8 grid w-full grid-cols-[repeat(3,minmax(0,6.75rem))] justify-center gap-x-3 gap-y-4 sm:mt-10 sm:grid-cols-[repeat(6,minmax(0,9rem))] sm:gap-x-5 sm:gap-y-6">
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
