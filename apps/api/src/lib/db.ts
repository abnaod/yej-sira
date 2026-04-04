import type { Prisma } from "@ys/db";

export { prisma } from "@ys/db";

/** Products visible on the public storefront and catalog APIs. */
export const publicProductVisibilityWhere: Prisma.ProductWhereInput = {
  isPublished: true,
  shop: { status: "active" },
};
