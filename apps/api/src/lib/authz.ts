import type { Shop, ShopStatus } from "@prisma/client";
import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";

import { prisma } from "./db";
import { auth } from "../modules/auth/auth";

export async function getSessionUserId(c: Context): Promise<string | null> {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  return session?.user?.id ?? null;
}

export async function requireUserId(c: Context): Promise<string> {
  const id = await getSessionUserId(c);
  if (!id) {
    throw new HTTPException(401, { message: "Unauthorized" });
  }
  return id;
}

export async function requireAdminUserId(c: Context): Promise<string> {
  const userId = await requireUserId(c);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user || user.role !== "admin") {
    throw new HTTPException(403, { message: "Forbidden" });
  }
  return userId;
}

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
    throw new HTTPException(403, { message: "Shop cannot list products" });
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
