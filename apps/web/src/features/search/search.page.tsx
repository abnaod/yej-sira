import type { Locale } from "@ys/intl";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";

import { ProductCard } from "@/components/ui/product-card";
import { parseTagSlugsParam } from "@/features/category";
import { addToCartMutationOptions } from "@/features/cart/cart.queries";
import { tagsQuery } from "@/features/storefront";
import { cn } from "@/lib/utils";

import { SearchSortToolbar } from "./components/search-sort-toolbar";
import { productsSearchQuery } from "./search.queries";

const routeApi = getRouteApi("/$locale/search/");

function toggleSlug(slugs: string[], slug: string): string[] {
  if (slugs.includes(slug)) return slugs.filter((s) => s !== slug);
  return [...slugs, slug];
}

export function SearchPage() {
  const { locale: localeParam } = routeApi.useParams();
  const locale = localeParam as Locale;
  const { q, sort, tagSlugs: tagSlugsRaw, promotionSlug } = routeApi.useSearch();
  const navigate = routeApi.useNavigate();
  const queryClient = useQueryClient();
  const addToCart = useMutation(addToCartMutationOptions(queryClient, locale));

  const tagSlugs = parseTagSlugsParam(tagSlugsRaw);
  const { data: tagsData } = useSuspenseQuery(tagsQuery(locale));
  const { data } = useSuspenseQuery(
    productsSearchQuery(locale, q, sort, tagSlugs, promotionSlug),
  );

  const { products, total } = data;

  const hasSearchQuery = q.trim().length >= 2;
  const title =
    hasSearchQuery ? (
      <>
        Results for &ldquo;{q}&rdquo;
      </>
    ) : tagSlugs.length > 0 ? (
      <>Filtered results</>
    ) : (
      <>Browse products</>
    );

  return (
    <main>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{total} results</p>
      </div>

      <SearchSortToolbar
        sort={sort}
        onSortChange={(next) => {
          void navigate({
            search: {
              q,
              sort: next,
              tagSlugs: tagSlugsRaw,
              promotionSlug,
            },
          });
        }}
      />

      {tagsData.tags.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Refine results
          </p>
          <div className="flex flex-wrap gap-2">
          {tagsData.tags.map((t) => {
            const active = tagSlugs.includes(t.slug);
            return (
              <button
                key={t.slug}
                type="button"
                onClick={() => {
                  const next = toggleSlug(tagSlugs, t.slug);
                  void navigate({
                    search: {
                      q,
                      sort,
                      tagSlugs: next.length > 0 ? next.join(",") : "",
                      promotionSlug,
                    },
                  });
                }}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-foreground hover:bg-neutral-50",
                )}
              >
                {t.name}
              </button>
            );
          })}
          </div>
        </div>
      )}

      <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-6 sm:mt-10 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            slug={product.slug}
            defaultVariantId={product.defaultVariantId}
            name={product.name}
            price={product.price}
            originalPrice={product.originalPrice}
            description={product.description}
            imageUrl={product.imageUrl}
            rating={product.rating}
            reviewCount={product.reviewCount}
            shop={product.shop}
            promotion={product.promotion}
            onAddToCart={
              product.defaultVariantId
                ? () =>
                    addToCart.mutate({
                      variantId: product.defaultVariantId!,
                      quantity: 1,
                    })
                : undefined
            }
          />
        ))}
      </div>
    </main>
  );
}
