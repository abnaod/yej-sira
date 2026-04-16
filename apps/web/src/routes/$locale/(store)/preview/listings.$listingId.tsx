import { createFileRoute } from "@tanstack/react-router";

import { SellerListingStorefrontPreviewPage } from "@/features/seller/listings/listing-storefront-preview.page";

/** No loader prefetch: session cookies are set on the API origin; SSR forwards the document
 *  request Cookie header (web app), which does not include those cookies — prefetch would 401.
 *  Data loads in the page with `useQuery` on the client only. */
export const Route = createFileRoute("/$locale/(store)/preview/listings/$listingId")({
  component: SellerListingStorefrontPreviewPage,
});
