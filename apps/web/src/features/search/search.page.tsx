import type { Locale } from "@ys/intl";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";

import { ListingCard } from "@/components/ui/listing-card";
import { parseTagSlugsParam } from "@/features/category";
import { addToCartMutationOptions } from "@/features/cart/cart.queries";
import { tagsQuery } from "@/features/storefront";
import { cn } from "@/lib/utils";

import { SearchSortToolbar } from "./components/search-sort-toolbar";
import { listingsSearchQuery } from "./search.queries";

const routeApi = getRouteApi("/$locale/(store)/search/");

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
    listingsSearchQuery(locale, q, sort, tagSlugs, promotionSlug),
  );

  const { listings, total } = data;

  const hasSearchQuery = q.trim().length >= 2;
  const title =
    hasSearchQuery ? (
      <>
        Results for &ldquo;{q}&rdquo;
      </>
    ) : tagSlugs.length > 0 ? (
      <>Filtered results</>
    ) : (
      <>Browse listings</>
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
                    : "border-border bg-background text-foreground hover:bg-gray-100 dark:hover:bg-gray-800",
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
        {listings.map((listing) => (
          <ListingCard
            key={listing.id}
            slug={listing.slug}
            defaultVariantId={listing.defaultVariantId}
            name={listing.name}
            price={listing.price}
            originalPrice={listing.originalPrice}
            description={listing.description}
            imageUrl={listing.imageUrl}
            rating={listing.rating}
            reviewCount={listing.reviewCount}
            shop={listing.shop}
            promotion={listing.promotion}
            onAddToCart={
              listing.defaultVariantId
                ? () =>
                    addToCart.mutate({
                      variantId: listing.defaultVariantId!,
                      quantity: 1,
                      listingName: listing.name,
                    })
                : undefined
            }
          />
        ))}
      </div>
    </main>
  );
}
