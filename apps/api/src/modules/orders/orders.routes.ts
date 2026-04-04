import type { ContentLocale } from "@prisma/client";
import type { Locale } from "@ys/intl";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

import { pickProductName, pickVariantLabel } from "../../lib/localized-catalog";
import { auth } from "../auth/auth";
import { prisma } from "../../lib/db";
import { toNumber } from "../../lib/money";
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
        product: {
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

ordersRouter.post("/checkout", async (c) => {
  const locale = c.get("locale");
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user) {
    throw new HTTPException(401, { message: "Sign in required to checkout" });
  }

  const body = await c.req.json().catch(() => null);
  const parsed = checkoutBodySchema.safeParse(body);
  if (!parsed.success) {
    throw new HTTPException(400, { message: "Invalid shipping address" });
  }
  const addr = parsed.data;

  const { cart } = await getOrCreateCart(c);

  const itemsPreview = await prisma.cartItem.findMany({
    where: { cartId: cart.id },
    include: orderLineInclude(locale),
  });

  if (itemsPreview.length === 0) {
    throw new HTTPException(400, { message: "Cart is empty" });
  }

  for (const line of itemsPreview) {
    if (line.quantity > line.variant.stock) {
      const pname = pickProductName(
        {
          name: line.variant.product.name,
          translations: line.variant.product.translations ?? [],
        },
        locale,
      );
      throw new HTTPException(400, {
        message: `Insufficient stock for ${pname}`,
      });
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    const items = await tx.cartItem.findMany({
      where: { cartId: cart.id },
      include: orderLineInclude(locale),
    });

    let subtotal = 0;
    for (const line of items) {
      subtotal += toNumber(line.variant.price) * line.quantity;
    }
    const shipping = 0;
    const tax = Math.round(subtotal * 0.08 * 100) / 100;
    const total = subtotal + shipping + tax;

    const order = await tx.order.create({
      data: {
        userId: session.user.id,
        status: "pending",
        subtotal,
        shipping,
        tax,
        total,
        shippingLine1: addr.line1,
        shippingLine2: addr.line2,
        shippingCity: addr.city,
        shippingPostalCode: addr.postalCode,
        shippingCountry: addr.country,
        items: {
          create: items.map((line) => {
            const imageUrl = line.variant.product.images[0]?.url ?? "";
            return {
              productName: pickProductName(
                {
                  name: line.variant.product.name,
                  translations: line.variant.product.translations ?? [],
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
      },
    });

    for (const line of items) {
      await tx.productVariant.update({
        where: { id: line.variantId },
        data: { stock: { decrement: line.quantity } },
      });
    }

    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

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
    },
  });
});

ordersRouter.get("/orders", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user) {
    throw new HTTPException(401, { message: "Unauthorized" });
  }

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      total: true,
      createdAt: true,
    },
  });

  return c.json({
    orders: orders.map((o) => ({
      id: o.id,
      status: o.status,
      total: toNumber(o.total),
      createdAt: o.createdAt.toISOString(),
    })),
  });
});

ordersRouter.get("/orders/:id", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user) {
    throw new HTTPException(401, { message: "Unauthorized" });
  }

  const id = c.req.param("id");
  const order = await prisma.order.findFirst({
    where: { id, userId: session.user.id },
    include: { items: true },
  });

  if (!order) {
    throw new HTTPException(404, { message: "Order not found" });
  }

  return c.json({
    order: {
      id: order.id,
      status: order.status,
      subtotal: toNumber(order.subtotal),
      shipping: toNumber(order.shipping),
      tax: toNumber(order.tax),
      total: toNumber(order.total),
      shippingAddress: {
        line1: order.shippingLine1,
        line2: order.shippingLine2,
        city: order.shippingCity,
        postalCode: order.shippingPostalCode,
        country: order.shippingCountry,
      },
      createdAt: order.createdAt.toISOString(),
      items: order.items.map((i) => ({
        id: i.id,
        productName: i.productName,
        variantLabel: i.variantLabel,
        unitPrice: toNumber(i.unitPrice),
        quantity: i.quantity,
        imageUrl: i.imageUrl,
      })),
    },
  });
});
