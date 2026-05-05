import type { ContentLocale, Prisma } from "@prisma/client";
import type { Locale } from "@ys/intl";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

import { pickListingName, pickVariantLabel } from "../catalog/catalog.localize";
import { prisma } from "../../lib/db";
import { standardDeliveryFeeEtb } from "../../lib/delivery";
import { toNumber } from "../../lib/money";
import { getOrCreateCart } from "./cart.service";
import { cartItemBodySchema, cartItemPatchSchema, promoCodeSchema } from "./cart.schema";

export const cartRouter = new Hono();

function cartItemInclude(locale: Locale) {
  const tr =
    locale === "en"
      ? null
      : ({
          where: { locale: locale as ContentLocale },
        } as const);

  return {
    variant: {
      include: {
        ...(tr ? { translations: tr } : {}),
        listing: {
          include: {
            ...(tr ? { translations: tr } : {}),
            images: true,
            shop: { select: { id: true } },
          },
        },
      },
    },
  } as const;
}

function cartItemTenantWhere(shopId: string | undefined): Prisma.CartItemWhereInput {
  return shopId ? { variant: { listing: { shopId } } } : {};
}

function mapCartResponse(
  items: {
    id: string;
    quantity: number;
    variant: {
      id: string;
      label: string;
      price: unknown;
      stock: number;
      translations?: { label: string }[];
      listing: {
        name: string;
        translations?: { name: string; description: string }[];
        images: { url: string; sortOrder: number }[];
      };
    };
  }[],
  locale: Locale,
) {
  return items.map((line) => {
    const imageUrl =
      [...line.variant.listing.images].sort((a, b) => a.sortOrder - b.sortOrder)[0]?.url ?? "";
    return {
      id: line.id,
      variantId: line.variant.id,
      name: pickListingName(
        {
          name: line.variant.listing.name,
          translations: line.variant.listing.translations ?? [],
        },
        locale,
      ),
      variant: pickVariantLabel(
        {
          label: line.variant.label,
          translations: line.variant.translations ?? [],
        },
        locale,
      ),
      price: toNumber(line.variant.price),
      quantity: line.quantity,
      imageUrl,
      stock: line.variant.stock,
    };
  });
}

cartRouter.get("/cart", async (c) => {
  const locale = c.get("locale");
  const storefrontShop = c.get("storefrontShop");
  const { cart } = await getOrCreateCart(c);

  const items = await prisma.cartItem.findMany({
    where: { cartId: cart.id, ...cartItemTenantWhere(storefrontShop?.id) },
    orderBy: { id: "asc" },
    include: cartItemInclude(locale),
  });

  const lines = mapCartResponse(items, locale);
  const subtotal = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
  const configuredDeliveryFeeEtb = standardDeliveryFeeEtb();
  const shipping = lines.length === 0 ? 0 : configuredDeliveryFeeEtb;
  const tax = Math.round(subtotal * 0.08 * 100) / 100;
  const total = subtotal + shipping + tax;

  return c.json({
    cartId: cart.id,
    anonymousToken: cart.anonymousToken,
    items: lines,
    subtotal,
    /** Charged for standard delivery when the cart has items (pickup is 0 at checkout). */
    shipping,
    /** Configured flat fee from env; use for delivery-method UI. */
    standardDeliveryFeeEtb: configuredDeliveryFeeEtb,
    tax,
    total,
  });
});

cartRouter.post("/cart/items", async (c) => {
  const storefrontShop = c.get("storefrontShop");
  const body = await c.req.json().catch(() => null);
  const parsed = cartItemBodySchema.safeParse(body);
  if (!parsed.success) {
    throw new HTTPException(400, { message: "Invalid body" });
  }
  const { variantId, quantity } = parsed.data;

  const { cart } = await getOrCreateCart(c);

  const variant = await prisma.listingVariant.findUnique({
    where: { id: variantId },
    include: { listing: { select: { shopId: true } } },
  });
  if (!variant) {
    throw new HTTPException(404, { message: "Variant not found" });
  }
  if (storefrontShop && variant.listing.shopId !== storefrontShop.id) {
    throw new HTTPException(403, { message: "Variant is outside this storefront" });
  }
  if (variant.stock < quantity) {
    throw new HTTPException(400, { message: "Not enough stock" });
  }

  const existing = await prisma.cartItem.findUnique({
    where: {
      cartId_variantId: { cartId: cart.id, variantId },
    },
  });

  if (existing) {
    const nextQty = existing.quantity + quantity;
    if (nextQty > variant.stock) {
      throw new HTTPException(400, { message: "Not enough stock" });
    }
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: nextQty },
    });
  } else {
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        variantId,
        quantity,
      },
    });
  }

  return c.json({ ok: true });
});

cartRouter.patch("/cart/items/:itemId", async (c) => {
  const storefrontShop = c.get("storefrontShop");
  const itemId = c.req.param("itemId");
  const body = await c.req.json().catch(() => null);
  const parsed = cartItemPatchSchema.safeParse(body);
  if (!parsed.success) {
    throw new HTTPException(400, { message: "Invalid body" });
  }
  const { quantity } = parsed.data;

  const { cart } = await getOrCreateCart(c);

  const item = await prisma.cartItem.findFirst({
    where: { id: itemId, cartId: cart.id },
    include: { variant: { include: { listing: { select: { shopId: true } } } } },
  });
  if (!item) {
    throw new HTTPException(404, { message: "Cart item not found" });
  }
  if (storefrontShop && item.variant.listing.shopId !== storefrontShop.id) {
    throw new HTTPException(403, { message: "Cart item is outside this storefront" });
  }

  if (quantity === 0) {
    await prisma.cartItem.delete({ where: { id: item.id } });
    return c.json({ ok: true });
  }

  if (quantity > item.variant.stock) {
    throw new HTTPException(400, { message: "Not enough stock" });
  }

  await prisma.cartItem.update({
    where: { id: item.id },
    data: { quantity },
  });

  return c.json({ ok: true });
});

cartRouter.delete("/cart/items/:itemId", async (c) => {
  const storefrontShop = c.get("storefrontShop");
  const itemId = c.req.param("itemId");
  const { cart } = await getOrCreateCart(c);

  const item = await prisma.cartItem.findFirst({
    where: { id: itemId, cartId: cart.id },
    include: { variant: { include: { listing: { select: { shopId: true } } } } },
  });
  if (!item) {
    throw new HTTPException(404, { message: "Cart item not found" });
  }
  if (storefrontShop && item.variant.listing.shopId !== storefrontShop.id) {
    throw new HTTPException(403, { message: "Cart item is outside this storefront" });
  }

  await prisma.cartItem.delete({ where: { id: item.id } });

  return c.json({ ok: true });
});

cartRouter.post("/cart/promo", async (c) => {
  const locale = c.get("locale");
  const storefrontShop = c.get("storefrontShop");
  const body = await c.req.json().catch(() => null);
  const parsed = promoCodeSchema.safeParse(body);
  if (!parsed.success) {
    throw new HTTPException(400, { message: "Promo code is required" });
  }
  const { code } = parsed.data;

  const { cart } = await getOrCreateCart(c);
  const items = await prisma.cartItem.findMany({
    where: { cartId: cart.id, ...cartItemTenantWhere(storefrontShop?.id) },
    orderBy: { id: "asc" },
    include: cartItemInclude(locale),
  });
  const lines = mapCartResponse(items, locale);
  const subtotal = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);

  const promo = await prisma.promoCode.findUnique({
    where: { code: code.toUpperCase() },
  });
  if (!promo || !promo.active) {
    throw new HTTPException(400, { message: "Invalid promo code" });
  }
  const now = new Date();
  if (promo.validFrom && now < promo.validFrom) {
    throw new HTTPException(400, { message: "Promo code is not yet active" });
  }
  if (promo.validUntil && now > promo.validUntil) {
    throw new HTTPException(400, { message: "Promo code has expired" });
  }
  if (promo.maxRedemptions != null && promo.redemptions >= promo.maxRedemptions) {
    throw new HTTPException(400, { message: "Promo code is no longer available" });
  }
  const minSubtotal = promo.minSubtotal ? Number(promo.minSubtotal) : 0;
  if (minSubtotal > 0 && subtotal < minSubtotal) {
    throw new HTTPException(400, {
      message: `Minimum order of ${minSubtotal} ETB required`,
    });
  }

  let discount = 0;
  let discountLabel = "";
  if (promo.discountPercent != null) {
    discount = Math.round(subtotal * (promo.discountPercent / 100) * 100) / 100;
    discountLabel = `-${promo.discountPercent}%`;
  } else if (promo.discountAmount != null) {
    discount = Math.min(subtotal, Number(promo.discountAmount));
    discountLabel = `-${discount} ETB`;
  } else {
    throw new HTTPException(500, { message: "Promo code misconfigured" });
  }

  await prisma.cart.update({
    where: { id: cart.id },
    data: { appliedPromoCode: promo.code },
  });

  return c.json({
    valid: true,
    code: promo.code,
    discount,
    discountLabel,
  });
});
