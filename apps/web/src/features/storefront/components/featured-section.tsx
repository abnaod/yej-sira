import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";

import { ProductCard } from "@/components/ui/product-card";
import { addToCartMutationOptions } from "@/features/cart/cart.queries";
import { featuredProductsQuery } from "../storefront.queries";

export function FeaturedSection() {
  const queryClient = useQueryClient();
  const { data } = useSuspenseQuery(featuredProductsQuery(12));

  const addToCart = useMutation(addToCartMutationOptions(queryClient));

  return (
    <section>
      <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
        Popular picks
      </h2>
      <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-6 sm:mt-10 sm:grid-cols-3 lg:grid-cols-4">
        {data.products.map((product) => (
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
    </section>
  );
}
