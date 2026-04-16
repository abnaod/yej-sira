import type { Locale } from "@ys/intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";

import { Breadcrumb } from "@/components/ui/breadcrumb";
import { addToCartMutationOptions } from "@/features/cart/cart.queries";
import { BuyBox } from "@/features/listings/components/buy-box";
import { ListingGallery } from "@/features/listings/components/listings-gallery";

import { sellerListingDetailQuery } from "./listings.queries";

const routeApi = getRouteApi("/$locale/(store)/preview/listings/$listingId");

export function SellerListingStorefrontPreviewPage() {
  const { listingId, locale: localeParam } = routeApi.useParams();
  const locale = localeParam as Locale;
  const navigate = routeApi.useNavigate();
  const queryClient = useQueryClient();

  const detailQuery = useQuery({
    ...sellerListingDetailQuery(locale, listingId),
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
          Sign in as the shop owner to preview this listing, or check that the listing exists.
        </p>
      </main>
    );
  }

  if (detailQuery.data == null) {
    return (
      <main className="p-8 text-muted-foreground">Loading…</main>
    );
  }

  const listing = detailQuery.data.listing;

  const breadcrumbItems = [
    {
      label: listing.category.name,
      to: "/$locale/categories/$categoryId",
      params: { locale, categoryId: listing.category.slug },
      search: {
        sort: "relevancy",
        tagSlugs: "",
        promotionSlug: undefined,
        attributeDefinitionKey: undefined,
        allowedValueKey: undefined,
      },
    },
    { label: listing.name },
  ];

  const purchaseDisabled = !listing.isPublished;
  const purchaseDisabledReason = purchaseDisabled
    ? "Publish this listing to enable checkout. This is a draft preview only."
    : undefined;

  return (
    <main>
      {!listing.isPublished ? (
        <div
          className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100"
          role="status"
        >
          Draft preview — shoppers cannot see this page until you publish the listing.
        </div>
      ) : null}

      <Breadcrumb items={breadcrumbItems} className="mb-6" />

      <div className="grid gap-8 lg:grid-cols-2">
        <ListingGallery images={listing.images} listingName={listing.name} />

        <BuyBox
          name={listing.name}
          shop={listing.shop}
          monthlyPrice={99.99}
          financingNote="Suggested payments with 6 months special financing"
          rating={listing.rating}
          reviewCount={listing.reviewCount}
          promotion={listing.promotion}
          variants={listing.variants.map((v) => ({
            id: v.id,
            label: v.label,
            colorHex: v.colorHex ?? undefined,
            price: v.price,
            stock: v.stock,
          }))}
          onAddToCart={
            listing.isPublished
              ? (payload) => addToCart.mutate(payload)
              : undefined
          }
          onBuyNow={
            listing.isPublished
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
        {listing.storefrontAttributes.filter((a) => a.displayValue.trim()).length > 0 && (
          <dl className="mb-8 grid max-w-3xl gap-x-8 gap-y-3 sm:grid-cols-2">
            {listing.storefrontAttributes
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
        {listing.description.trim() ? (
          <p className="max-w-3xl whitespace-pre-wrap text-sm leading-relaxed text-foreground md:text-base">
            {listing.description}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            No description has been added for this listing yet.
          </p>
        )}
      </section>
    </main>
  );
}
