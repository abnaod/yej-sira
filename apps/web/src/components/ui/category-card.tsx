import { cn } from "@/lib/utils";

interface CategoryCardProps {
  name: string;
  imageUrl: string;
  href?: string;
  className?: string;
}

export function CategoryCard({
  name,
  imageUrl,
  className,
}: CategoryCardProps) {
  return (
    <div
      className={cn(
        "group relative aspect-3/4 overflow-hidden rounded-xl",
        className,
      )}
    >
      <img
        src={imageUrl}
        alt={name}
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-black/10" />
      <h3 className="absolute left-4 top-4 text-base font-bold text-white drop-shadow-md">
        {name}
      </h3>
    </div>
  );
}
