import type { Locale } from "@ys/intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";

import { Breadcrumb } from "@/components/ui/breadcrumb";
import { addToCartMutationOptions } from "@/features/cart/cart.queries";
import { BuyBox } from "@/features/product/components/buy-box";
import { ProductGallery } from "@/features/product/components/product-gallery";

import { sellerProductDetailQuery } from "./products.queries";

const routeApi = getRouteApi("/$locale/(store)/preview/products/$productId");

export function SellerProductStorefrontPreviewPage() {
  const { productId, locale: localeParam } = routeApi.useParams();
  const locale = localeParam as Locale;
  const navigate = routeApi.useNavigate();
  const queryClient = useQueryClient();

  const detailQuery = useQuery({
    ...sellerProductDetailQuery(locale, productId),
    enabled: !import.meta.env.SSR,
  });

  const addToCart = useMutation(addToCartMutationOptions(queryClient, locale));

  if (import.meta.env.SSR) {
    return (
      <main className="p-8 text-muted-foreground">Loading…</main>
    );
  }

  if (detailQuery.isError) {
    const message =
      detailQuery.error instanceof Error
        ? detailQuery.error.message
        : "Something went wrong";
    return (
      <main className="p-8">
        <p className="text-destructive">{message}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in as the shop owner to preview this product, or check that the product exists.
        </p>
      </main>
    );
  }

  if (detailQuery.data == null) {
    return (
      <main className="p-8 text-muted-foreground">Loading…</main>
    );
  }

  const product = detailQuery.data.product;

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

  const purchaseDisabled = !product.isPublished;
  const purchaseDisabledReason = purchaseDisabled
    ? "Publish this product to enable checkout. This is a draft preview only."
    : undefined;

  return (
    <main>
      {!product.isPublished ? (
        <div
          className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100"
          role="status"
        >
          Draft preview — shoppers cannot see this page until you publish the product.
        </div>
      ) : null}

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
          onAddToCart={
            product.isPublished
              ? (payload) => addToCart.mutate(payload)
              : undefined
          }
          onBuyNow={
            product.isPublished
              ? async (payload) => {
                  await addToCart.mutateAsync(payload);
                  void navigate({ to: "/$locale/checkout", params: { locale } });
                }
              : undefined
          }
          purchaseDisabled={purchaseDisabled}
          purchaseDisabledReason={purchaseDisabledReason}
        />
      </div>

      <section className="mt-10">
        <h2 className="mb-4 text-lg font-semibold tracking-tight text-foreground md:text-xl">
          Description
        </h2>
        {product.storefrontAttributes.filter((a) => a.displayValue.trim()).length > 0 && (
          <dl className="mb-8 grid max-w-3xl gap-x-8 gap-y-3 sm:grid-cols-2">
            {product.storefrontAttributes
              .filter((a) => a.displayValue.trim())
              .map((a) => (
                <div key={a.key} className="border-b border-border/70 pb-3">
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {a.label}
                  </dt>
                  <dd className="mt-1 text-sm text-foreground">{a.displayValue}</dd>
                </div>
              ))}
          </dl>
        )}
        {product.description.trim() ? (
          <p className="max-w-3xl whitespace-pre-wrap text-sm leading-relaxed text-foreground md:text-base">
            {product.description}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            No description has been added for this product yet.
          </p>
        )}
      </section>
    </main>
  );
}
