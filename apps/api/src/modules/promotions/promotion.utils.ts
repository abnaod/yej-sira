/**
 * Active window: startsAt <= now < endsAt (endsAt is exclusive).
 */
export function isPromotionActive(
  p: { startsAt: Date; endsAt: Date },
  now: Date,
): boolean {
  return p.startsAt <= now && now < p.endsAt;
}

/** Prisma where fragment for promotions active at `now`. */
export function activePromotionWhere(now: Date) {
  return {
    startsAt: { lte: now },
    endsAt: { gt: now },
  } as const;
}

/**
 * When a listing is in multiple overlapping active promotions, pick one ribbon:
 * highest priority, then soonest endsAt (tie-break).
 */
export function pickPromotionForListing<
  T extends { priority: number; endsAt: Date },
>(candidates: T[]): T | undefined {
  if (candidates.length === 0) return undefined;
  return [...candidates].sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    return a.endsAt.getTime() - b.endsAt.getTime();
  })[0];
}
