import type { Locale } from "@ys/intl";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";

import { ListingCard } from "@/features/store/listings/components/listing-card";
import { addToCartMutationOptions } from "@/features/store/cart/cart.queries";
import { parseTagSlugsParam, listingsForCategoryQuery } from "./category.queries";

import { CategoryToolbar } from "./components/category-toolbar";

const routeApi = getRouteApi("/$locale/(store)/categories/$categoryId");

export function CategoryPage() {
  const { categoryId, locale: localeParam } = routeApi.useParams();
  const locale = localeParam as Locale;
  const {
    sort,
    tagSlugs: tagSlugsRaw,
    promotionSlug,
    attributeDefinitionKey,
    allowedValueKey,
  } = routeApi.useSearch();
  const navigate = routeApi.useNavigate();
  const queryClient = useQueryClient();
  const addToCart = useMutation(addToCartMutationOptions(queryClient, locale));

  const tagSlugs = parseTagSlugsParam(tagSlugsRaw);
  const attributeFacet =
    attributeDefinitionKey && allowedValueKey
      ? { definitionKey: attributeDefinitionKey, allowedValueKey }
      : undefined;
  const { data } = useSuspenseQuery(
    listingsForCategoryQuery(
      locale,
      categoryId,
      sort,
      tagSlugs,
      promotionSlug,
      attributeFacet,
    ),
  );

  const { listings, total } = data;

  return (
    <main>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight capitalize">
          {categoryId.replace(/-/g, " ")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{total} results</p>
        {attributeFacet && (
          <p className="mt-2 text-sm text-muted-foreground">
            Filtered by listing attribute ({attributeFacet.definitionKey} ={" "}
            {attributeFacet.allowedValueKey}).{" "}
            <button
              type="button"
              className="font-medium text-foreground underline underline-offset-2"
              onClick={() => {
                void navigate({
                  search: {
                    sort,
                    tagSlugs: tagSlugsRaw,
                    promotionSlug,
                    attributeDefinitionKey: undefined,
                    allowedValueKey: undefined,
                  },
                });
              }}
            >
              Clear
            </button>
          </p>
        )}
      </div>

      <CategoryToolbar
        categoryId={categoryId}
        sort={sort}
        selectedTagSlugs={tagSlugs}
        selectedPromotionSlug={promotionSlug}
        onSortChange={(next) => {
          void navigate({
            search: {
              sort: next,
              tagSlugs: tagSlugsRaw,
              promotionSlug,
              attributeDefinitionKey,
              allowedValueKey,
            },
          });
        }}
        onApplyFilters={(opts) => {
          void navigate({
            to: "/$locale/categories/$categoryId",
            params: { locale, categoryId: opts.categorySlug || categoryId },
            search: {
              sort: opts.sort,
              tagSlugs:
                opts.tagSlugs.length > 0 ? opts.tagSlugs.join(",") : "",
              promotionSlug: opts.promotionSlug,
              attributeDefinitionKey,
              allowedValueKey,
            },
          });
        }}
      />

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
