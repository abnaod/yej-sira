import type { Shop } from "@prisma/client";

import { prisma } from "../../lib/db";

export type OnboardingStep = {
  id:
    | "profile"
    | "policies"
    | "payout"
    | "firstListing"
    | "acceptedSellerPolicy";
  done: boolean;
  label: string;
};

/**
 * "Profile" is satisfied once the shop row exists with a name (set at registration).
 * Description and logo are encouraged in the UI but not required to clear this step.
 */
export function computeOnboardingSteps(shop: Shop, listingCount: number): OnboardingStep[] {
  return [
    {
      id: "profile",
      done: !!shop.name?.trim(),
      label: "Shop name, description, and logo",
    },
    {
      id: "policies",
      done: !!(shop.shippingPolicy && shop.returnsPolicy),
      label: "Shipping and returns policies",
    },
    {
      id: "payout",
      done: !!(
        shop.payoutMethod &&
        shop.payoutAccountName &&
        shop.payoutAccountNumber
      ),
      label: "Payout account",
    },
    {
      id: "firstListing",
      done: listingCount > 0,
      label: "At least one listing",
    },
    {
      id: "acceptedSellerPolicy",
      done: !!shop.acceptedSellerPolicyAt,
      label: "Accept seller policy",
    },
  ];
}

/**
 * When every onboarding step is done, the shop goes live. Matches the
 * "Shop auto-activates when all required fields are set" intent in the schema.
 */
export async function tryActivateShopIfOnboardingComplete(shopId: string): Promise<Shop> {
  const shop = await prisma.shop.findUnique({ where: { id: shopId } });
  if (!shop) {
    throw new Error("Shop not found");
  }
  if (shop.status !== "pending") {
    return shop;
  }
  const listingCount = await prisma.listing.count({ where: { shopId: shop.id } });
  const steps = computeOnboardingSteps(shop, listingCount);
  if (!steps.every((s) => s.done)) {
    return shop;
  }
  return prisma.shop.update({
    where: { id: shopId },
    data: { status: "active", onboardingCompletedAt: new Date() },
  });
}
