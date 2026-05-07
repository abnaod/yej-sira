import type { Shop } from "@prisma/client";
import type { MiddlewareHandler } from "hono";
import { HTTPException } from "hono/http-exception";

import { prisma } from "../db";
import {
  isDevStorefrontHost,
  isGeneratedShopHost,
  isReservedShopSlug,
  isStorefrontLauncherHost,
  isValidShopSubdomainSlug,
  normalizeHost,
  shopSlugFromHost,
} from "../env";

export type PublicStorefrontShop = Pick<
  Shop,
  | "id"
  | "slug"
  | "name"
  | "description"
  | "imageUrl"
  | "contactEmail"
  | "contactPhone"
  | "socialLinks"
  | "shippingPolicy"
  | "returnsPolicy"
>;

function publicShopSelect() {
  return {
    id: true,
    slug: true,
    name: true,
    description: true,
    imageUrl: true,
    contactEmail: true,
    contactPhone: true,
    socialLinks: true,
    shippingPolicy: true,
    returnsPolicy: true,
  } as const;
}

function storefrontHostAllowed(rawHost: string) {
  return (
    isGeneratedShopHost(rawHost) ||
    isDevStorefrontHost(rawHost) ||
    isStorefrontLauncherHost(rawHost)
  );
}

export async function resolveStorefrontShop(args: {
  shopSlug: string | null | undefined;
  storefrontHost: string | null | undefined;
}): Promise<PublicStorefrontShop | null> {
  const headerSlug = args.shopSlug?.trim().toLowerCase();
  const rawHost = args.storefrontHost?.trim();

  if (!headerSlug && !rawHost) return null;

  if (!headerSlug || !rawHost) {
    throw new HTTPException(400, { message: "Invalid storefront context" });
  }
  if (!isValidShopSubdomainSlug(headerSlug) || isReservedShopSlug(headerSlug)) {
    throw new HTTPException(404, { message: "Shop not found" });
  }
  if (!storefrontHostAllowed(rawHost)) {
    throw new HTTPException(403, { message: "Invalid storefront host" });
  }

  const hostSlug = shopSlugFromHost(normalizeHost(rawHost));
  if (hostSlug && hostSlug !== headerSlug) {
    throw new HTTPException(403, { message: "Storefront host mismatch" });
  }

  const shop = await prisma.shop.findFirst({
    where: { slug: headerSlug, status: "active" },
    select: publicShopSelect(),
  });
  if (!shop) {
    throw new HTTPException(404, { message: "Shop not found" });
  }
  return shop;
}

export const storefrontTenantMiddleware: MiddlewareHandler = async (c, next) => {
  const shop = await resolveStorefrontShop({
    shopSlug: c.req.header("x-shop-slug"),
    storefrontHost: c.req.header("x-storefront-host"),
  });
  c.set("storefrontShop", shop);
  await next();
};
