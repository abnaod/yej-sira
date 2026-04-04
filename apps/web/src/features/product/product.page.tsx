import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";

import { Breadcrumb } from "@/components/ui/breadcrumb";
import { ProductListItem } from "@/components/ui/product-list-item";
import { addToCartMutationOptions } from "@/features/cart/cart.queries";
import { useProductFavoriteRow } from "@/features/favorites/use-product-favorite-row";
import { productDetailQuery, relatedProductsQuery } from "./product.queries";

import { BuyBox } from "./components/buy-box";
import { ProductGallery } from "./components/product-gallery";

const routeApi = getRouteApi("/products/$productId");

export function ProductPage() {
  const { productId } = routeApi.useParams();
  const navigate = routeApi.useNavigate();
  const queryClient = useQueryClient();

  const { data: productData } = useSuspenseQuery(productDetailQuery(productId));
  const { data: relatedData } = useSuspenseQuery(relatedProductsQuery(productId));

  const addToCart = useMutation(addToCartMutationOptions(queryClient));
  const favorite = useProductFavoriteRow(productData.product.slug);

  const { product } = productData;

  const breadcrumbItems = [
    {
      label: product.category.name,
      to: "/categories/$categoryId",
      params: { categoryId: product.category.slug },
      search: { sort: "relevancy", tagSlugs: "", promotionSlug: undefined },
    },
    { label: product.name },
  ];

  return (
    <main>
      <Breadcrumb items={breadcrumbItems} className="mb-6" />

      <div className="grid gap-8 lg:grid-cols-2">
        <ProductGallery images={product.images} productName={product.name} />

        <BuyBox
          name={product.name}
          description={product.description}
          monthlyPrice={99.99}
          financingNote="Suggested payments with 6 months special financing"
          rating={product.rating}
          reviewCount={product.reviewCount}
          promotion={product.promotion}
          variants={product.variants.map((v) => ({
            id: v.id,
            label: v.label,
            colorHex: v.colorHex ?? undefined,
            price: v.price,
            stock: v.stock,
          }))}
          onAddToCart={(payload) => addToCart.mutate(payload)}
          onBuyNow={async (payload) => {
            await addToCart.mutateAsync(payload);
            void navigate({ to: "/checkout" });
          }}
          isFavorite={favorite.isFavorite}
          onToggleFavorite={favorite.onToggleWishlist}
          favoritePending={favorite.pending}
        />
      </div>

      <section className="mt-10">
        <h2 className="mb-4 text-xl font-bold tracking-tight md:text-2xl">
          Related Products
        </h2>
        <div className="space-y-2">
          {relatedData.products.map((p) => (
            <ProductListItem
              key={p.id}
              id={p.slug}
              name={p.name}
              price={p.price}
              originalPrice={p.originalPrice}
              imageUrl={p.imageUrl}
              rating={p.rating}
              reviewCount={p.reviewCount}
            />
          ))}
        </div>
      </section>
    </main>
  );
}
