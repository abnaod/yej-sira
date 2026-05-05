import { Prisma, type ContentLocale } from "@prisma/client";
import type { Locale } from "@ys/intl";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { createHash } from "crypto";

import { pickListingName, pickVariantLabel } from "../catalog/catalog.localize";
import { getOwnedShop } from "../shops/shops.authz";
import { auth } from "../auth/auth";
import { findOrCreateGuestUser } from "../auth/guest";
import { prisma } from "../../lib/db";
import { standardDeliveryFeeEtb } from "../../lib/delivery";
import { toNumber } from "../../lib/money";
import { signOrderAccess, verifyOrderAccess } from "../../lib/order-access";
import { getOrCreateCart } from "../cart/cart.service";
import { checkoutBodySchema } from "./orders.schema";

function orderLineInclude(locale: Locale) {
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
            images: { orderBy: { sortOrder: "asc" } },
          },
        },
      },
    },
  } as const;
}

export const ordersRouter = new Hono();

function cartItemsForStorefrontWhere(shopId: string | undefined): Prisma.CartItemWhereInput {
  return shopId ? { variant: { listing: { shopId } } } : {};
}

ordersRouter.get("/pickup-locations", async (c) => {
  const list = await prisma.pickupLocation.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      line1: true,
      line2: true,
      city: true,
      postalCode: true,
      country: true,
      latitude: true,
      longitude: true,
    },
  });

  return c.json({
    locations: list.map((loc) => ({
      id: loc.id,
      name: loc.name,
      line1: loc.line1,
      line2: loc.line2,
      city: loc.city,
      postalCode: loc.postalCode,
      country: loc.country,
      latitude: toNumber(loc.latitude),
      longitude: toNumber(loc.longitude),
    })),
  });
});

ordersRouter.post("/checkout", async (c) => {
  const locale = c.get("locale");
  const storefrontShop = c.get("storefrontShop");
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  const body = await c.req.json().catch(() => null);
  const parsed = checkoutBodySchema.safeParse(body);
  if (!parsed.success) {
    throw new HTTPException(400, { message: "Invalid checkout data" });
  }
  const data = parsed.data;
  const deliveryMethod = data.deliveryMethod;
  const paymentMethod = data.paymentMethod;
  const isGuest = !session?.user;

  let pickupLoc: Awaited<ReturnType<typeof prisma.pickupLocation.findUnique>> = null;
  if (data.deliveryMethod === "pickup") {
    pickupLoc = await prisma.pickupLocation.findUnique({
      where: { id: data.pickupLocationId },
    });
    if (!pickupLoc) {
      throw new HTTPException(400, { message: "Invalid pickup location" });
    }
  }

  const shippingSnapshot =
    data.deliveryMethod === "pickup"
      ? {
          shippingCity: pickupLoc!.city,
          shippingSubcity: pickupLoc!.line1 ?? "",
          shippingWoreda: pickupLoc!.line2 ?? "",
          shippingKebele: "",
          shippingSpecificLocation: pickupLoc!.name,
        }
      : {
          shippingCity: data.city,
          shippingSubcity: data.subcity,
          shippingWoreda: data.woreda,
          shippingKebele: data.kebele,
          shippingSpecificLocation: data.specificLocation,
        };

  const phoneTrimmed = data.phone?.trim();
  let buyerUserId: string;
  let buyerEmail: string;
  if (session?.user) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: data.fullName,
        email: data.email,
        phone: phoneTrimmed ? phoneTrimmed : null,
      },
    });
    buyerUserId = session.user.id;
    buyerEmail = data.email;
  } else {
    const { user } = await findOrCreateGuestUser({
      name: data.fullName,
      email: data.email,
      phone: phoneTrimmed ?? null,
    });
    buyerUserId = user.id;
    buyerEmail = user.email;
  }

  const { cart } = await getOrCreateCart(c);

  const itemsPreview = await prisma.cartItem.findMany({
    where: { cartId: cart.id, ...cartItemsForStorefrontWhere(storefrontShop?.id) },
    orderBy: { id: "asc" },
    include: orderLineInclude(locale),
  });

  if (itemsPreview.length === 0) {
    throw new HTTPException(400, { message: "Cart is empty" });
  }

  for (const line of itemsPreview) {
    if (line.quantity > line.variant.stock) {
      const pname = pickListingName(
        {
          name: line.variant.listing.name,
          translations: line.variant.listing.translations ?? [],
        },
        locale,
      );
      throw new HTTPException(400, {
        message: `Insufficient stock for ${pname}`,
      });
    }
  }

  const deliveryFee = standardDeliveryFeeEtb();
  const shippingCosts = {
    standard: deliveryFee,
    pickup: 0,
  } as const;

  // Idempotency: dedupe accidental double-clicks on the same cart snapshot.
  // Hash = userId + delivery + payment + each item (variantId, qty, unitPrice).
  const snapshot = itemsPreview
    .map((i) => `${i.variantId}:${i.quantity}:${toNumber(i.variant.price)}`)
    .join("|");
  const idempotencyKey = createHash("sha256")
    .update(
      [
        buyerUserId,
        deliveryMethod,
        paymentMethod,
        data.deliveryMethod === "pickup" ? data.pickupLocationId : "address",
        snapshot,
      ].join("#"),
    )
    .digest("hex");

  const recent = await prisma.order.findFirst({
    where: {
      userId: buyerUserId,
      idempotencyKey,
      createdAt: { gt: new Date(Date.now() - 30_000) },
    },
    include: { payment: true },
    orderBy: { createdAt: "desc" },
  });
  if (recent) {
    return c.json({
      order: {
        id: recent.id,
        status: recent.status,
        total: toNumber(recent.total),
        subtotal: toNumber(recent.subtotal),
        shipping: toNumber(recent.shipping),
        tax: toNumber(recent.tax),
        deliveryMethod: recent.deliveryMethod,
      },
      txRef: recent.payment?.txRef ?? null,
      orderAccessToken: isGuest ? signOrderAccess(recent.id, buyerEmail) : null,
      idempotent: true,
    });
  }

  const txRef = `yejsira-txn-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

  const result = await prisma.$transaction(async (tx) => {
    const items = await tx.cartItem.findMany({
      where: { cartId: cart.id, ...cartItemsForStorefrontWhere(storefrontShop?.id) },
      orderBy: { id: "asc" },
      include: orderLineInclude(locale),
    });

    let subtotal = 0;
    for (const line of items) {
      subtotal += toNumber(line.variant.price) * line.quantity;
    }
    const shipping = shippingCosts[deliveryMethod];
    const tax = Math.round(subtotal * 0.08 * 100) / 100;
    const total = subtotal + shipping + tax;

    const orderStatus =
      paymentMethod === "cod" ? "pending" : "awaiting_payment";

    const order = await tx.order.create({
      data: {
        userId: buyerUserId,
        status: orderStatus,
        subtotal,
        shipping,
        tax,
        total,
        originShopId: storefrontShop?.id ?? null,
        deliveryMethod,
        pickupLocationId: data.deliveryMethod === "pickup" ? pickupLoc!.id : null,
        idempotencyKey,
        ...shippingSnapshot,
        items: {
          create: items.map((line) => {
            const imageUrl = line.variant.listing.images[0]?.url ?? "";
            return {
              listingId: line.variant.listingId,
              listingName: pickListingName(
                {
                  name: line.variant.listing.name,
                  translations: line.variant.listing.translations ?? [],
                },
                locale,
              ),
              variantLabel: pickVariantLabel(
                {
                  label: line.variant.label,
                  translations: line.variant.translations ?? [],
                },
                locale,
              ),
              unitPrice: line.variant.price,
              quantity: line.quantity,
              imageUrl,
            };
          }),
        },
        payment: {
          create: {
            txRef,
            amount: total,
            currency: "ETB",
            status: "pending",
            paymentMethod,
          },
        },
      },
      include: { payment: true },
    });

    for (const line of items) {
      await tx.listingVariant.update({
        where: { id: line.variantId },
        data: { stock: { decrement: line.quantity } },
      });
    }

    await tx.cartItem.deleteMany({
      where: {
        cartId: cart.id,
        id: { in: items.map((line) => line.id) },
      },
    });

    return order;
  });

  return c.json({
    order: {
      id: result.id,
      status: result.status,
      total: toNumber(result.total),
      subtotal: toNumber(result.subtotal),
      shipping: toNumber(result.shipping),
      tax: toNumber(result.tax),
      deliveryMethod: result.deliveryMethod,
    },
    txRef,
    orderAccessToken: isGuest ? signOrderAccess(result.id, buyerEmail) : null,
  });
});

ordersRouter.get("/orders", async (c) => {
  const storefrontShop = c.get("storefrontShop");
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user) {
    throw new HTTPException(401, { message: "Unauthorized" });
  }

  const orders = await prisma.order.findMany({
    where: {
      userId: session.user.id,
      ...(storefrontShop
        ? {
            items: {
              some: {
                listing: { shopId: storefrontShop.id },
              },
            },
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      originShopId: true,
      total: true,
      createdAt: true,
      deliveryMethod: true,
      items: storefrontShop
        ? {
            where: { listing: { shopId: storefrontShop.id } },
            select: { unitPrice: true, quantity: true },
          }
        : false,
      _count: { select: { items: true } },
      payment: {
        select: {
          status: true,
          txRef: true,
          paymentMethod: true,
        },
      },
    },
  });

  return c.json({
    orders: orders.map((o) => {
      const scopedItems =
        "items" in o && Array.isArray(o.items)
          ? o.items
          : null;
      const scopedSubtotal =
        scopedItems?.reduce(
          (sum, item) => sum + toNumber(item.unitPrice) * item.quantity,
          0,
        ) ?? null;
      return {
        id: o.id,
        status: o.status,
        total:
          storefrontShop && o.originShopId !== storefrontShop.id && scopedSubtotal != null
            ? scopedSubtotal
            : toNumber(o.total),
        createdAt: o.createdAt.toISOString(),
        deliveryMethod: o.deliveryMethod,
        itemCount: scopedItems?.length ?? o._count.items,
        payment: o.payment
          ? {
              status: o.payment.status,
              txRef: o.payment.txRef,
              method: o.payment.paymentMethod,
            }
          : null,
      };
    }),
  });
});

const orderDetailInclude = {
  items: true,
  user: { select: { email: true } },
  payment: { select: { paymentMethod: true, status: true } },
  pickupLocation: {
    select: {
      id: true,
      name: true,
      line1: true,
      line2: true,
      city: true,
      postalCode: true,
      country: true,
    },
  },
} satisfies Prisma.OrderInclude;

type OrderWithDetail = Prisma.OrderGetPayload<{ include: typeof orderDetailInclude }>;

function mapOrderDetailResponse(order: OrderWithDetail) {
  return {
    id: order.id,
    status: order.status,
    subtotal: toNumber(order.subtotal),
    shipping: toNumber(order.shipping),
    tax: toNumber(order.tax),
    total: toNumber(order.total),
    deliveryMethod: order.deliveryMethod,
    pickupLocation: order.pickupLocation,
    shippingAddress: {
      city: order.shippingCity,
      subcity: order.shippingSubcity,
      woreda: order.shippingWoreda,
      kebele: order.shippingKebele,
      specificLocation: order.shippingSpecificLocation,
    },
    createdAt: order.createdAt.toISOString(),
    payment: order.payment
      ? {
          method: order.payment.paymentMethod,
          status: order.payment.status,
        }
      : null,
    items: order.items.map((i) => ({
      id: i.id,
      listingName: i.listingName,
      variantLabel: i.variantLabel,
      unitPrice: toNumber(i.unitPrice),
      quantity: i.quantity,
      imageUrl: i.imageUrl,
    })),
  };
}

ordersRouter.get("/orders/:id", async (c) => {
  const storefrontShop = c.get("storefrontShop");
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user) {
    throw new HTTPException(401, { message: "Unauthorized" });
  }

  const id = c.req.param("id");
  const order = await prisma.order.findFirst({
    where: { id },
    include: orderDetailInclude,
  });

  if (!order) {
    throw new HTTPException(404, { message: "Order not found" });
  }

  const isBuyer = order.userId === session.user.id;
  if (storefrontShop) {
    if (!isBuyer) {
      throw new HTTPException(403, { message: "Forbidden" });
    }

    const listingIds = order.items
      .map((item) => item.listingId)
      .filter((listingId): listingId is string => Boolean(listingId));
    const shopListings =
      listingIds.length > 0
        ? await prisma.listing.findMany({
            where: { id: { in: listingIds }, shopId: storefrontShop.id },
            select: { id: true },
          })
        : [];
    const allowedListingIds = new Set(shopListings.map((listing) => listing.id));
    const currentShopItems = order.items.filter(
      (item) => item.listingId && allowedListingIds.has(item.listingId),
    );
    if (currentShopItems.length === 0) {
      throw new HTTPException(403, { message: "Forbidden" });
    }

    const scopedSubtotal = currentShopItems.reduce(
      (sum, item) => sum + toNumber(item.unitPrice) * item.quantity,
      0,
    );
    const useOrderTotals = order.originShopId === storefrontShop.id;

    return c.json({
      order: {
        id: order.id,
        status: order.status,
        subtotal: useOrderTotals ? toNumber(order.subtotal) : scopedSubtotal,
        shipping: useOrderTotals ? toNumber(order.shipping) : 0,
        tax: useOrderTotals ? toNumber(order.tax) : 0,
        total: useOrderTotals ? toNumber(order.total) : scopedSubtotal,
        deliveryMethod: order.deliveryMethod,
        pickupLocation: order.pickupLocation,
        shippingAddress: {
          city: order.shippingCity,
          subcity: order.shippingSubcity,
          woreda: order.shippingWoreda,
          kebele: order.shippingKebele,
          specificLocation: order.shippingSpecificLocation,
        },
        createdAt: order.createdAt.toISOString(),
        payment: order.payment
          ? {
              method: order.payment.paymentMethod,
              status: order.payment.status,
            }
          : null,
        items: currentShopItems.map((i) => ({
          id: i.id,
          listingName: i.listingName,
          variantLabel: i.variantLabel,
          unitPrice: toNumber(i.unitPrice),
          quantity: i.quantity,
          imageUrl: i.imageUrl,
        })),
      },
    });
  }

  let isSeller = false;
  if (!isBuyer) {
    const shop = await getOwnedShop(session.user.id);
    if (shop) {
      const listingIds = await prisma.listing.findMany({
        where: { shopId: shop.id },
        select: { id: true },
      });
      const shopIds = listingIds.map((p) => p.id);
      if (shopIds.length > 0) {
        const hit = await prisma.orderItem.findFirst({
          where: { orderId: id, listingId: { in: shopIds } },
        });
        isSeller = Boolean(hit);
      }
    }
  }

  if (!isBuyer && !isSeller) {
    throw new HTTPException(404, { message: "Order not found" });
  }

  return c.json({ order: mapOrderDetailResponse(order) });
});

/**
 * Unauthenticated order lookup for guest checkouts. Token is an HMAC-signed
 * payload binding `orderId + email`. The buyer receives it in the checkout
 * response (so they can view their order immediately) and in the order
 * confirmation email.
 */
ordersRouter.get("/orders/by-token/:token", async (c) => {
  const token = c.req.param("token");
  const verified = verifyOrderAccess(token);
  if (!verified) {
    throw new HTTPException(404, { message: "Order not found" });
  }

  const order = await prisma.order.findFirst({
    where: { id: verified.orderId },
    include: orderDetailInclude,
  });
  if (!order || order.user?.email?.toLowerCase() !== verified.email) {
    throw new HTTPException(404, { message: "Order not found" });
  }

  return c.json({ order: mapOrderDetailResponse(order) });
});
