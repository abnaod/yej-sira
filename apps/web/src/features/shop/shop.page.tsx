import type { Locale } from "@ys/intl";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";

import { ProductCard } from "@/components/ui/product-card";
import { addToCartMutationOptions } from "@/features/cart/cart.queries";
import { shopPublicQuery } from "./shop.queries";

const routeApi = getRouteApi("/$locale/shops/$shopSlug");

export function ShopPage() {
  const { shopSlug, locale: localeParam } = routeApi.useParams();
  const locale = localeParam as Locale;
  const queryClient = useQueryClient();
  const addToCart = useMutation(addToCartMutationOptions(queryClient, locale));

  const { data } = useSuspenseQuery(shopPublicQuery(locale, shopSlug));

  const { shop, products } = data;

  return (
    <main>
      <header className="border-b border-border pb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-serif text-3xl font-normal tracking-tight text-foreground md:text-4xl">
              {shop.name}
            </h1>
            {shop.description ? (
              <p className="mt-2 max-w-2xl text-muted-foreground leading-relaxed">{shop.description}</p>
            ) : null}
          </div>
        </div>
      </header>

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
            shop={product.shop}
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

      {products.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">No products listed yet.</p>
      ) : null}
    </main>
  );
}
