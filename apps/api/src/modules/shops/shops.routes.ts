import type { Shop } from "@prisma/client";
import type { Locale } from "@ys/intl";
import type { Context } from "hono";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

import { prisma, publicListingVisibilityWhere } from "../../lib/db";
import { requireUserId } from "../../lib/auth";
import { toNumber } from "../../lib/money";
import { getOwnedShop } from "./shops.authz";
import { getListingCardInclude, mapListingCard } from "../catalog/catalog.mappers";
import {
  createShopBodySchema,
  publicShopListingsQuerySchema,
  updateShopBodySchema,
} from "./shops.schema";
import {
  computeOnboardingSteps,
  tryActivateShopIfOnboardingComplete,
} from "./shops.onboarding";

export const shopsRouter = new Hono();

function jsonShopForOwner(shop: Shop) {
  return {
    id: shop.id,
    slug: shop.slug,
    name: shop.name,
    description: shop.description,
    imageUrl: shop.imageUrl,
    bannerImageUrl: shop.bannerImageUrl,
    accentColor: shop.accentColor,
    status: shop.status,
    contactEmail: shop.contactEmail,
    contactPhone: shop.contactPhone,
    socialLinks: shop.socialLinks,
    shippingPolicy: shop.shippingPolicy,
    returnsPolicy: shop.returnsPolicy,
    businessType: shop.businessType,
    businessLegalName: shop.businessLegalName,
    businessTaxId: shop.businessTaxId,
    businessCity: shop.businessCity,
    businessSubcity: shop.businessSubcity,
    businessWoreda: shop.businessWoreda,
    businessKebele: shop.businessKebele,
    businessHouseNumber: shop.businessHouseNumber,
    businessSpecificLocation: shop.businessSpecificLocation,
    listingsLimit: shop.listingsLimit,
    payoutMethod: shop.payoutMethod,
    payoutAccountName: shop.payoutAccountName,
    payoutAccountNumber: shop.payoutAccountNumber,
    payoutBankCode: shop.payoutBankCode,
    acceptedSellerPolicyAt: shop.acceptedSellerPolicyAt?.toISOString() ?? null,
    onboardingCompletedAt: shop.onboardingCompletedAt?.toISOString() ?? null,
    createdAt: shop.createdAt.toISOString(),
    updatedAt: shop.updatedAt.toISOString(),
  };
}

/** Must be registered before `/shops/:slug` or `me` is captured as a slug. */
async function shopsMeHandler(c: Context) {
  const userId = await requireUserId(c);
  const shop = await getOwnedShop(userId);
  if (!shop) {
    return c.json({ shop: null });
  }
  return c.json({ shop: jsonShopForOwner(shop) });
}

shopsRouter.get("/shops/me", shopsMeHandler);
/** Some clients/proxies normalize with a trailing slash; without this, `/shops/me/` 404s. */
shopsRouter.get("/shops/me/", shopsMeHandler);

shopsRouter.get("/shops/me/onboarding", async (c) => {
  const userId = await requireUserId(c);
  const shop = await getOwnedShop(userId);
  if (!shop) {
    return c.json({ shop: null, steps: [], canPublish: false });
  }
  const listingCount = await prisma.listing.count({ where: { shopId: shop.id } });
  const steps = computeOnboardingSteps(shop, listingCount);
  const canPublish = steps.every((s) => s.done);
  return c.json({
    shop: jsonShopForOwner(shop),
    steps,
    canPublish,
    status: shop.status,
  });
});

shopsRouter.patch("/shops/me", async (c) => {
  const userId = await requireUserId(c);
  const shop = await getOwnedShop(userId);
  if (!shop) {
    throw new HTTPException(404, { message: "Shop not found" });
  }
  if (shop.status === "rejected" || shop.status === "suspended") {
    throw new HTTPException(403, { message: "Shop cannot be edited" });
  }

  const body = await c.req.json().catch(() => null);
  const parsed = updateShopBodySchema.safeParse(body);
  if (!parsed.success) {
    throw new HTTPException(400, { message: "Invalid body" });
  }
  const d = parsed.data;

  const updated = await prisma.shop.update({
    where: { id: shop.id },
    data: {
      ...(d.name != null ? { name: d.name } : {}),
      ...(d.description !== undefined ? { description: d.description } : {}),
      ...(d.imageUrl !== undefined ? { imageUrl: d.imageUrl } : {}),
      ...(d.bannerImageUrl !== undefined ? { bannerImageUrl: d.bannerImageUrl } : {}),
      ...(d.accentColor !== undefined ? { accentColor: d.accentColor } : {}),
      ...(d.contactEmail !== undefined ? { contactEmail: d.contactEmail } : {}),
      ...(d.contactPhone !== undefined ? { contactPhone: d.contactPhone } : {}),
      ...(d.socialLinks !== undefined ? { socialLinks: d.socialLinks ?? {} } : {}),
      ...(d.shippingPolicy !== undefined ? { shippingPolicy: d.shippingPolicy } : {}),
      ...(d.returnsPolicy !== undefined ? { returnsPolicy: d.returnsPolicy } : {}),
      ...(d.businessType !== undefined ? { businessType: d.businessType } : {}),
      ...(d.businessLegalName !== undefined ? { businessLegalName: d.businessLegalName } : {}),
      ...(d.businessTaxId !== undefined ? { businessTaxId: d.businessTaxId } : {}),
      ...(d.businessCity !== undefined ? { businessCity: d.businessCity } : {}),
      ...(d.businessSubcity !== undefined ? { businessSubcity: d.businessSubcity } : {}),
      ...(d.businessWoreda !== undefined ? { businessWoreda: d.businessWoreda } : {}),
      ...(d.businessKebele !== undefined ? { businessKebele: d.businessKebele } : {}),
      ...(d.businessHouseNumber !== undefined ? { businessHouseNumber: d.businessHouseNumber } : {}),
      ...(d.businessSpecificLocation !== undefined
        ? { businessSpecificLocation: d.businessSpecificLocation }
        : {}),
      ...(d.payoutMethod !== undefined ? { payoutMethod: d.payoutMethod } : {}),
      ...(d.payoutAccountName !== undefined ? { payoutAccountName: d.payoutAccountName } : {}),
      ...(d.payoutAccountNumber !== undefined ? { payoutAccountNumber: d.payoutAccountNumber } : {}),
      ...(d.payoutBankCode !== undefined ? { payoutBankCode: d.payoutBankCode } : {}),
      ...(d.acceptedSellerPolicy === true
        ? { acceptedSellerPolicyAt: new Date() }
        : d.acceptedSellerPolicy === false
          ? { acceptedSellerPolicyAt: null }
          : {}),
    },
  });

  const final = await tryActivateShopIfOnboardingComplete(updated.id);
  return c.json({ shop: jsonShopForOwner(final) });
});

shopsRouter.post("/shops/me/publish", async (c) => {
  const userId = await requireUserId(c);
  const shop = await getOwnedShop(userId);
  if (!shop) {
    throw new HTTPException(404, { message: "Shop not found" });
  }
  if (shop.status === "suspended" || shop.status === "rejected") {
    throw new HTTPException(403, { message: "Shop cannot be published" });
  }
  if (shop.status === "active") {
    return c.json({ shop: jsonShopForOwner(shop), alreadyActive: true });
  }

  const final = await tryActivateShopIfOnboardingComplete(shop.id);
  if (final.status === "active") {
    return c.json({ shop: jsonShopForOwner(final) });
  }

  const listingCount = await prisma.listing.count({ where: { shopId: shop.id } });
  const steps = computeOnboardingSteps(final, listingCount);
  const missing = steps.filter((s) => !s.done).map((s) => s.id);
  throw new HTTPException(400, {
    message: `Onboarding incomplete: ${missing.join(", ")}`,
  });
});

shopsRouter.get("/shops/:slug", async (c) => {
  const locale = c.get("locale") as Locale;
  const slug = c.req.param("slug");
  const q = publicShopListingsQuerySchema.safeParse({
    page: c.req.query("page"),
    pageSize: c.req.query("pageSize"),
  });
  if (!q.success) {
    throw new HTTPException(400, { message: "Invalid query" });
  }
  const { page, pageSize } = q.data;

  const shop = await prisma.shop.findFirst({
    where: { slug, status: "active" },
  });
  if (!shop) {
    throw new HTTPException(404, { message: "Shop not found" });
  }

  const now = new Date();
  const where = {
    shopId: shop.id,
    ...publicListingVisibilityWhere,
  };

  const [total, listings] = await prisma.$transaction([
    prisma.listing.count({ where }),
    prisma.listing.findMany({
      where,
      include: getListingCardInclude(now, locale),
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  /**
   * Estimated reply window for the public storefront (mirrors conversation
   * detail logic in `conversations.service`). Defaults to 15 minutes when no
   * data has been recorded yet, so new shops still show a plausible signal.
   */
  const estimatedReplyMinutes = shop.responseTimeAvgSeconds
    ? Math.max(1, Math.round(shop.responseTimeAvgSeconds / 60))
    : 15;

  return c.json({
    shop: {
      id: shop.id,
      slug: shop.slug,
      name: shop.name,
      description: shop.description,
      imageUrl: shop.imageUrl,
      bannerImageUrl: shop.bannerImageUrl,
      accentColor: shop.accentColor,
      contactEmail: shop.contactEmail,
      contactPhone: shop.contactPhone,
      socialLinks: shop.socialLinks,
      city: shop.businessCity,
      subcity: shop.businessSubcity,
      createdAt: shop.createdAt.toISOString(),
      responseRate: shop.responseRate != null ? toNumber(shop.responseRate) : null,
      estimatedReplyMinutes,
      listingCount: total,
    },
    listings: listings.map((p) => mapListingCard(p, locale)),
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  });
});

shopsRouter.post("/shops", async (c) => {
  const userId = await requireUserId(c);
  const existing = await getOwnedShop(userId);
  if (existing) {
    throw new HTTPException(400, { message: "You already have a shop" });
  }

  const body = await c.req.json().catch(() => null);
  const parsed = createShopBodySchema.safeParse(body);
  if (!parsed.success) {
    throw new HTTPException(400, { message: "Invalid body" });
  }

  const d = parsed.data;

  const shop = await prisma.shop.create({
    data: {
      name: d.name,
      slug: d.slug,
      description: d.description,
      imageUrl: d.imageUrl,
      bannerImageUrl: d.bannerImageUrl,
      accentColor: d.accentColor,
      contactEmail: d.contactEmail,
      contactPhone: d.contactPhone,
      socialLinks: d.socialLinks,
      shippingPolicy: d.shippingPolicy,
      returnsPolicy: d.returnsPolicy,
      businessType: d.businessType,
      businessLegalName: d.businessLegalName,
      businessTaxId: d.businessTaxId,
      businessCity: d.businessCity,
      businessSubcity: d.businessSubcity,
      businessWoreda: d.businessWoreda,
      businessKebele: d.businessKebele,
      businessHouseNumber: d.businessHouseNumber,
      businessSpecificLocation: d.businessSpecificLocation,
      ownerUserId: userId,
      onboardingCompletedAt: new Date(),
      ...(d.acceptedSellerPolicy ? { acceptedSellerPolicyAt: new Date() } : {}),
    },
  });

  return c.json({ shop: jsonShopForOwner(shop) });
});
