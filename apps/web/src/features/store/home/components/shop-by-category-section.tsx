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
      <div className="text-left md:text-center">
        <h2 className="text-base font-semibold tracking-tight md:text-2xl">
          {t("shopByCategory")}
        </h2>
        <p className="mx-auto mt-2 hidden max-w-lg text-sm leading-relaxed text-muted-foreground md:block">
          {t("shopByCategorySubtitle")}
        </p>
      </div>
      <div className="mt-3 flex gap-1 overflow-x-auto pb-1 pt-1 no-scrollbar md:mt-8 md:grid md:w-full md:grid-cols-[repeat(3,minmax(0,8.5rem))] md:justify-center md:gap-x-5 md:gap-y-6 md:overflow-visible md:pb-0 md:pt-0 lg:grid-cols-[repeat(6,minmax(0,8.5rem))]">
        {data.categories.map((category) => (
          <CategoryCard
            key={category.slug}
            name={category.name}
            slug={category.slug}
            imageUrl={category.imageUrl}
            className="w-20 flex-none md:w-full"
          />
        ))}
      </div>
    </section>
  );
}
