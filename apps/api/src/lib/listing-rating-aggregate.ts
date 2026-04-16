import { Prisma } from "@prisma/client";

import { prisma } from "./db";

export async function recalculateListingRatingAggregate(listingId: string) {
  const agg = await prisma.listingRating.aggregate({
    where: { listingId },
    _avg: { stars: true },
    _count: true,
  });
  const avg = agg._avg.stars ?? 0;
  const count = agg._count;
  await prisma.listing.update({
    where: { id: listingId },
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
