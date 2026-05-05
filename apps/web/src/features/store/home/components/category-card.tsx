import { Link } from "@tanstack/react-router";

import { assetUrl } from "@/lib/api";
import { useLocale } from "@/lib/locale-path";
import { cn } from "@/lib/utils";

interface CategoryCardProps {
  name: string;
  imageUrl: string;
  slug: string;
  className?: string;
}

export function CategoryCard({
  name,
  imageUrl,
  slug,
  className,
}: CategoryCardProps) {
  const locale = useLocale();
  return (
    <Link
      to="/$locale/categories/$categoryId"
      params={{ locale, categoryId: slug }}
      search={{
        sort: "relevancy",
        tagSlugs: "",
        promotionSlug: undefined,
        attributeDefinitionKey: undefined,
        allowedValueKey: undefined,
      }}
      className={cn(
        "group relative aspect-2/3 overflow-hidden rounded-lg",
        className,
      )}
    >
      <img
        src={assetUrl(imageUrl)}
        alt={name}
        width={600}
        height={900}
        sizes="(min-width: 1024px) 16vw, (min-width: 640px) 33vw, 50vw"
        loading="lazy"
        decoding="async"
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-black/10" />
      <h3 className="absolute left-4 top-4 text-base font-bold text-white drop-shadow-md">
        {name}
      </h3>
    </Link>
  );
}
