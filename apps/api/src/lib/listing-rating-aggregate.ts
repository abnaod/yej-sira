import { Prisma } from "@prisma/client";

import { prisma } from "./db";

export async function recalculateProductRatingAggregate(productId: string) {
  const agg = await prisma.productRating.aggregate({
    where: { productId },
    _avg: { stars: true },
    _count: true,
  });
  const avg = agg._avg.stars ?? 0;
  const count = agg._count;
  await prisma.product.update({
    where: { id: productId },
    data: {
      rating: new Prisma.Decimal(count === 0 ? "0.00" : avg.toFixed(2)),
      reviewCount: count,
    },
  });
  return {
    rating: count === 0 ? 0 : Number(avg.toFixed(2)),
    reviewCount: count,
  };
}
