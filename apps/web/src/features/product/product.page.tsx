import type { Locale } from "@ys/intl";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";

import { Breadcrumb } from "@/components/ui/breadcrumb";
import { ProductCard } from "@/components/ui/product-card";
import { addToCartMutationOptions } from "@/features/cart/cart.queries";
import { useProductFavoriteRow } from "@/features/favorites/use-product-favorite-row";
import { productDetailQuery, relatedProductsQuery } from "./product.queries";

import { BuyBox } from "./components/buy-box";
import { ProductDetailTabs } from "./components/product-detail-tabs";
import { ProductGallery } from "./components/product-gallery";

const routeApi = getRouteApi("/$locale/products/$productId");

export function ProductPage() {
  const { productId, locale: localeParam } = routeApi.useParams();
  const locale = localeParam as Locale;
  const navigate = routeApi.useNavigate();
  const queryClient = useQueryClient();

  const { data: productData } = useSuspenseQuery(productDetailQuery(locale, productId));
  const { data: relatedData } = useSuspenseQuery(relatedProductsQuery(locale, productId));

  const addToCart = useMutation(addToCartMutationOptions(queryClient, locale));
  const favorite = useProductFavoriteRow(productData.product.slug);

  const { product } = productData;

  const breadcrumbItems = [
    {
      label: product.category.name,
      to: "/$locale/categories/$categoryId",
      params: { locale, categoryId: product.category.slug },
      search: {
        sort: "relevancy",
        tagSlugs: "",
        promotionSlug: undefined,
        attributeDefinitionKey: undefined,
        allowedValueKey: undefined,
      },
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
          shop={product.shop}
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
            void navigate({ to: "/$locale/checkout", params: { locale } });
          }}
          isFavorite={favorite.isFavorite}
          onToggleFavorite={favorite.onToggleWishlist}
          favoritePending={favorite.pending}
        />
      </div>

      <ProductDetailTabs
        locale={locale}
        productSlug={productId}
        description={product.description}
        shopName={product.shop.name}
        attributes={product.attributes}
      />

      <section className="mt-10">
        <h2 className="mb-4 text-lg font-semibold tracking-tight text-foreground md:text-xl">
          Related Products
        </h2>
        <div
          className="-mx-1 flex gap-4 overflow-x-auto overflow-y-hidden overscroll-x-contain px-1 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden"
        >
          {relatedData.products.map((p) => (
            <ProductCard
              key={p.id}
              variant="compact"
              slug={p.slug}
              defaultVariantId={p.defaultVariantId}
              name={p.name}
              price={p.price}
              originalPrice={p.originalPrice}
              description={p.description}
              imageUrl={p.imageUrl}
              rating={p.rating}
              reviewCount={p.reviewCount}
              shop={p.shop}
              promotion={p.promotion}
              onAddToCart={
                p.defaultVariantId
                  ? () =>
                      addToCart.mutate({
                        variantId: p.defaultVariantId!,
                        quantity: 1,
                      })
                  : undefined
              }
            />
          ))}
        </div>
      </section>
    </main>
  );
}
