import { createFileRoute } from "@tanstack/react-router";

import { SellerOrderDetailPage } from "@/features/seller";

/** No loader prefetch: session cookies are on the API origin; the document request to this app
 *  does not include them, so SSR prefetch would 401. Data loads on the client with credentials. */
export const Route = createFileRoute("/$locale/(seller)/sell/orders/$orderId")({
  component: SellerOrderDetailPage,
});
