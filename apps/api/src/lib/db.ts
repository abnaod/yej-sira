import type { Prisma } from "@ys/db";

export { prisma } from "@ys/db";

/** Listings visible on the public storefront and catalog APIs. */
export const publicListingVisibilityWhere: Prisma.ListingWhereInput = {
  isPublished: true,
  shop: { status: "active" },
};
