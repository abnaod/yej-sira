import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";

import { prisma } from "../../lib/db.js";
import { toNumber } from "../../lib/money.js";
import { getOrCreateCart } from "./cart.service.js";
import { cartItemBodySchema, cartItemPatchSchema } from "./cart.schema.js";

export const cartRouter = new Hono();

function mapCartResponse(
  items: {
    id: string;
    quantity: number;
    variant: {
      id: string;
      label: string;
      price: unknown;
      stock: number;
      product: {
        name: string;
        images: { url: string; sortOrder: number }[];
      };
    };
  }[],
) {
  return items.map((line) => {
    const imageUrl =
      [...line.variant.product.images].sort((a, b) => a.sortOrder - b.sortOrder)[0]?.url ?? "";
    return {
      id: line.id,
      variantId: line.variant.id,
      name: line.variant.product.name,
      variant: line.variant.label,
      price: toNumber(line.variant.price),
      quantity: line.quantity,
      imageUrl,
      stock: line.variant.stock,
    };
  });
}

cartRouter.get("/cart", async (c) => {
  const { cart } = await getOrCreateCart(c);

  const items = await prisma.cartItem.findMany({
    where: { cartId: cart.id },
    include: {
      variant: {
        include: {
          product: {
            include: {
              images: true,
            },
          },
        },
      },
    },
  });

  const lines = mapCartResponse(items);
  const subtotal = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
  const shipping = 0;
  const tax = Math.round(subtotal * 0.08 * 100) / 100;
  const total = subtotal + shipping + tax;

  return c.json({
    cartId: cart.id,
    anonymousToken: cart.anonymousToken,
    items: lines,
    subtotal,
    shipping,
    tax,
    total,
  });
});

cartRouter.post("/cart/items", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = cartItemBodySchema.safeParse(body);
  if (!parsed.success) {
    throw new HTTPException(400, { message: "Invalid body" });
  }
  const { variantId, quantity } = parsed.data;

  const { cart } = await getOrCreateCart(c);

  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
  });
  if (!variant) {
    throw new HTTPException(404, { message: "Variant not found" });
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
    include: { variant: true },
  });
  if (!item) {
    throw new HTTPException(404, { message: "Cart item not found" });
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
  const itemId = c.req.param("itemId");
  const { cart } = await getOrCreateCart(c);

  const deleted = await prisma.cartItem.deleteMany({
    where: { id: itemId, cartId: cart.id },
  });
  if (deleted.count === 0) {
    throw new HTTPException(404, { message: "Cart item not found" });
  }

  return c.json({ ok: true });
});
