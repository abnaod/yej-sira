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
        "group flex min-w-0 flex-col items-center gap-1 text-center md:relative md:block md:aspect-2/3 md:overflow-hidden md:rounded-lg",
        className,
      )}
    >
      <span className="relative block h-16 w-16 overflow-hidden rounded-full bg-neutral-100 ring-1 ring-border transition-transform duration-300 group-hover:scale-105 sm:h-18 sm:w-18 md:absolute md:inset-0 md:h-full md:w-full md:rounded-lg md:ring-0">
        <img
          src={assetUrl(imageUrl)}
          alt={name}
          width={600}
          height={900}
          sizes="(min-width: 1024px) 16vw, (min-width: 768px) 8.5rem, 4.5rem"
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-300 md:group-hover:scale-105"
        />
      </span>
      <div className="absolute inset-0 hidden bg-black/10 md:block" />
      <h3 className="line-clamp-2 w-full text-xs font-semibold leading-tight text-foreground md:absolute md:left-4 md:top-4 md:w-[calc(100%-2rem)] md:truncate md:text-left md:text-sm md:font-bold md:text-white md:drop-shadow-md">
        {name}
      </h3>
    </Link>
  );
}
