import type { Locale } from "@ys/intl";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";

import { ProductCard } from "@/components/ui/product-card";
import { addToCartMutationOptions } from "@/features/cart/cart.queries";
import { parseTagSlugsParam, productsForCategoryQuery } from "./category.queries";

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
    productsForCategoryQuery(
      locale,
      categoryId,
      sort,
      tagSlugs,
      promotionSlug,
      attributeFacet,
    ),
  );

  const { products, total } = data;

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
                      productName: product.name,
                    })
                : undefined
            }
          />
        ))}
      </div>
    </main>
  );
}
