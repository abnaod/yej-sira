import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";

import { ProductCard } from "@/components/ui/product-card";
import { addToCartMutationOptions } from "@/features/cart/cart.queries";
import { parseTagSlugsParam, productsForCategoryQuery } from "./category.queries";

import { CategoryToolbar } from "./components/category-toolbar";

const routeApi = getRouteApi("/categories/$categoryId");

export function CategoryPage() {
  const { categoryId } = routeApi.useParams();
  const { sort, tagSlugs: tagSlugsRaw, promotionSlug } = routeApi.useSearch();
  const navigate = routeApi.useNavigate();
  const queryClient = useQueryClient();
  const addToCart = useMutation(addToCartMutationOptions(queryClient));

  const tagSlugs = parseTagSlugsParam(tagSlugsRaw);
  const { data } = useSuspenseQuery(
    productsForCategoryQuery(categoryId, sort, tagSlugs, promotionSlug),
  );

  const { products, total } = data;

  return (
    <main>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight capitalize">
          {categoryId.replace(/-/g, " ")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{total} results</p>
      </div>

      <CategoryToolbar
        categoryId={categoryId}
        sort={sort}
        selectedTagSlugs={tagSlugs}
        selectedPromotionSlug={promotionSlug}
        onSortChange={(next) => {
          void navigate({
            search: { sort: next, tagSlugs: tagSlugsRaw, promotionSlug },
          });
        }}
        onApplyFilters={(opts) => {
          void navigate({
            to: "/categories/$categoryId",
            params: { categoryId: opts.categorySlug || categoryId },
            search: {
              sort: opts.sort,
              tagSlugs:
                opts.tagSlugs.length > 0 ? opts.tagSlugs.join(",") : "",
              promotionSlug: opts.promotionSlug,
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
