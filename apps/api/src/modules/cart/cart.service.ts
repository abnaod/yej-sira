import { getCookie, setCookie } from "hono/cookie";
import type { Context } from "hono";
import { randomUUID } from "node:crypto";

import { auth } from "../auth/auth";
import { prisma } from "../../lib/db";

const CART_COOKIE = "ys_cart_token";
const CART_TOKEN_HEADER = "x-cart-token";

export async function getOrCreateCart(c: Context) {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (session?.user) {
    let cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
    });
    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: session.user.id },
      });
    }
    return { cart, token: null as string | null };
  }

  let token = c.req.header(CART_TOKEN_HEADER) ?? getCookie(c, CART_COOKIE) ?? undefined;
  if (token) {
    const existing = await prisma.cart.findUnique({
      where: { anonymousToken: token },
    });
    if (existing) {
      return { cart: existing, token };
    }
  }

  token = randomUUID();
  const cart = await prisma.cart.create({
    data: { anonymousToken: token },
  });

  setCookie(c, CART_COOKIE, token, {
    path: "/",
    httpOnly: true,
    sameSite: "Lax",
    maxAge: 60 * 60 * 24 * 365,
  });

  return { cart, token };
}

export function getCartTokenFromRequest(c: Context): string | undefined {
  return c.req.header(CART_TOKEN_HEADER) ?? getCookie(c, CART_COOKIE) ?? undefined;
}
