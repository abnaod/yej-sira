import type { Shop, ShopStatus } from "@prisma/client";
import { HTTPException } from "hono/http-exception";

import { prisma } from "../../lib/db";

export async function getOwnedShop(userId: string): Promise<Shop | null> {
  return prisma.shop.findUnique({
    where: { ownerUserId: userId },
  });
}

/** Owner can manage catalog while shop is pending (drafts) or active; not rejected/suspended. */
export function assertSellerCanManageShop(shop: Shop, userId: string): void {
  if (shop.ownerUserId !== userId) {
    throw new HTTPException(403, { message: "Forbidden" });
  }
  if (shop.status === "rejected" || shop.status === "suspended") {
    throw new HTTPException(403, { message: "Shop cannot list listings" });
  }
}

export function assertShopActiveForPublish(shop: Shop): void {
  if (shop.status !== "active") {
    throw new HTTPException(400, { message: "Shop must be active to publish" });
  }
}

export function isSellerManageableStatus(status: ShopStatus): boolean {
  return status === "pending" || status === "active";
}
