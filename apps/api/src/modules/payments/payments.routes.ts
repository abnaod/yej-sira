import type { Payment as PaymentRow, Prisma } from "@prisma/client";

type PaymentWithOrder = Prisma.PaymentGetPayload<{ include: { order: true } }>;
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import { createHmac, timingSafeEqual } from "crypto";

import { prisma } from "../../lib/db";
import { getEnv, getMarketplaceHost, getShopSubdomainBaseDomain } from "../../lib/env";
import { auth } from "../auth/auth";
import {
  formatPhoneForChapa,
  initializeTransaction,
  verifyTransaction,
} from "./chapa";
import { toNumber } from "../../lib/money";

export const paymentsRouter = new Hono();

const initializeBodySchema = z.object({
  orderId: z.string(),
  /** Used for return_url path; defaults to `en`. */
  locale: z.string().min(1).max(16).optional(),
});

const chapaPaymentMethodMap: Record<string, "card" | "telebirr"> = {
  card: "card",
  chapa: "card",
  telebirr: "telebirr",
};

function normalizePaymentMethod(method: string): "card" | "telebirr" | undefined {
  return chapaPaymentMethodMap[method];
}

function dbPaymentMethodFromChapaResponse(
  raw: string | undefined,
): NonNullable<PaymentRow["paymentMethod"]> {
  const n = normalizePaymentMethod(raw ?? "");
  if (n === "telebirr") return "telebirr" as NonNullable<PaymentRow["paymentMethod"]>;
  return "chapa" as NonNullable<PaymentRow["paymentMethod"]>;
}

function storefrontReturnOrigin(order: {
  originShop?: { slug: string } | null;
}) {
  const env = getEnv();
  if (order.originShop) {
    const protocol = env.NODE_ENV === "production" ? "https" : "http";
    const port = env.NODE_ENV === "production" ? "" : ":3000";
    return `${protocol}://${order.originShop.slug}.${getShopSubdomainBaseDomain()}${port}`;
  }
  return env.CORS_ORIGIN || `https://${getMarketplaceHost()}`;
}

async function chapaCustomerFromUser(userId: string) {
  const u = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!u) {
    throw new HTTPException(404, { message: "User not found" });
  }
  const first_name = (u.name.split(" ")[0] ?? u.name).trim() || "Customer";
  const last_name = u.name.split(" ").slice(1).join(" ").trim() || "-";
  return {
    email: u.email,
    first_name,
    last_name,
    phone_number: formatPhoneForChapa((u as { phone?: string | null }).phone),
  };
}

paymentsRouter.post("/payments/chapa/initialize", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user) {
    throw new HTTPException(401, { message: "Sign in required" });
  }

  const body = await c.req.json().catch(() => null);
  const parsed = initializeBodySchema.safeParse(body);
  if (!parsed.success) {
    throw new HTTPException(400, { message: "orderId is required" });
  }
  const { orderId, locale: localeFromBody } = parsed.data;

  const order = await prisma.order.findFirst({
    where: { id: orderId, userId: session.user.id },
    include: { payment: true, originShop: { select: { slug: true } } },
  });
  if (!order) {
    throw new HTTPException(404, { message: "Order not found" });
  }

  if (order.status === "paid" || order.status === "fulfilled") {
    throw new HTTPException(400, { message: "Order is already paid" });
  }

  if (order.payment && order.payment.status === "completed") {
    throw new HTTPException(400, { message: "Payment already completed" });
  }

  if (String(order.payment?.paymentMethod ?? "") === "cod") {
    throw new HTTPException(400, {
      message: "This order is cash on delivery; online payment is not available",
    });
  }

  const env = getEnv();
  let effectiveTxRef = order.payment?.txRef ?? `yejsira-${orderId}-${Date.now()}`;
  const callbackUrl = `${env.BETTER_AUTH_URL}/api/payments/chapa/webhook`;
  const returnOrigin = storefrontReturnOrigin(order);
  const localeSeg =
    localeFromBody && /^[a-z0-9-]{2,16}$/i.test(localeFromBody) ? localeFromBody : "en";
  const returnUrl = `${returnOrigin}/${localeSeg}/payments/success?orderId=${encodeURIComponent(order.id)}`;

  const customer = await chapaCustomerFromUser(session.user.id);

  const initPayload = {
    amount: toNumber(order.total),
    currency: "ETB",
    ...customer,
    callback_url: callbackUrl,
    return_url: returnUrl,
    customization: {
      // Chapa: customization.title max 16 characters
      title: "Yej-sira",
      description: `Order ${orderId}`,
    },
    meta: {
      orderId: order.id,
    },
  } as const;

  let checkoutUrl: string;

  try {
    if (order.payment && order.payment.txRef) {
      try {
        const init = await initializeTransaction({
          ...initPayload,
          tx_ref: order.payment.txRef,
        });
        checkoutUrl = init.checkout_url;
      } catch {
        const newTxRef = `yejsira-${orderId}-${Date.now()}`;
        const init = await initializeTransaction({
          ...initPayload,
          tx_ref: newTxRef,
        });
        checkoutUrl = init.checkout_url;
        effectiveTxRef = newTxRef;
        await prisma.payment.update({
          where: { orderId: order.id },
          data: { txRef: newTxRef, status: "pending" },
        });
      }
    } else {
      const init = await initializeTransaction({
        ...initPayload,
        tx_ref: effectiveTxRef,
      });
      checkoutUrl = init.checkout_url;

      await prisma.payment.upsert({
        where: { orderId: order.id },
        create: {
          orderId: order.id,
          txRef: effectiveTxRef,
          amount: order.total,
          currency: "ETB",
          status: "pending",
        },
        update: {
          txRef: effectiveTxRef,
          status: "pending",
          amount: order.total,
        },
      });

      if (order.status !== "awaiting_payment") {
        await prisma.order.update({
          where: { id: order.id },
          data: { status: "awaiting_payment" },
        });
      }
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Chapa initialization failed";
    throw new HTTPException(502, { message: msg });
  }

  return c.json({
    checkoutUrl,
    txRef: effectiveTxRef,
    orderId: order.id,
  });
});

paymentsRouter.post("/payments/chapa/verify", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user) {
    throw new HTTPException(401, { message: "Sign in required" });
  }

  const body = await c.req.json().catch(() => null);
  const orderIdParam =
    typeof body?.orderId === "string"
      ? body.orderId
      : typeof body?.order_id === "string"
        ? body.order_id
        : undefined;
  const txRefParam =
    typeof body?.tx_ref === "string"
      ? body.tx_ref
      : typeof c.req.query("tx_ref") === "string"
        ? c.req.query("tx_ref")
        : undefined;

  let payment: PaymentWithOrder;
  if (orderIdParam) {
    const p = await prisma.payment.findUnique({
      where: { orderId: orderIdParam },
      include: { order: true },
    });
    if (!p || p.order.userId !== session.user.id) {
      throw new HTTPException(404, { message: "Payment not found" });
    }
    payment = p;
  } else if (txRefParam) {
    const p = await prisma.payment.findUnique({
      where: { txRef: txRefParam },
      include: { order: true },
    });
    if (!p) {
      throw new HTTPException(404, { message: "Payment not found" });
    }
    if (p.order.userId !== session.user.id) {
      throw new HTTPException(403, { message: "Forbidden" });
    }
    payment = p;
  } else {
    throw new HTTPException(400, { message: "tx_ref or orderId is required" });
  }

  if (payment.status === "completed") {
    return c.json({
      status: payment.status,
      orderId: payment.order.id,
      txRef: payment.txRef,
    });
  }

  const chapaData = await verifyTransaction(payment.txRef);

  if (chapaData.status === "success") {
    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: "completed",
          chapaRef: chapaData.ref_id,
          paymentMethod: dbPaymentMethodFromChapaResponse(chapaData.payment_method),
          chapaResponse: chapaData as unknown as Prisma.InputJsonValue,
        },
      });
      await tx.order.update({
        where: { id: payment.order.id },
        data: { status: "paid" },
      });
    });

    return c.json({
      status: "completed" as const,
      orderId: payment.order.id,
      txRef: payment.txRef,
      chapaRef: chapaData.ref_id,
    });
  }

  const dbStatus =
    chapaData.status === "cancelled"
      ? ("cancelled" as const)
      : chapaData.status === "pending"
        ? ("pending" as const)
        : ("failed" as const);

  const responseStatus =
    chapaData.status === "cancelled"
      ? ("cancelled" as const)
      : chapaData.status === "pending"
        ? ("pending" as const)
        : ("failed" as const);

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: dbStatus,
      chapaResponse: chapaData as unknown as Prisma.InputJsonValue,
    },
  });

  return c.json({
    status: responseStatus,
    orderId: payment.order.id,
    txRef: payment.txRef,
  });
});

paymentsRouter.post("/payments/chapa/webhook", async (c) => {
  const env = getEnv();
  const webhookSecret = env.CHAPA_WEBHOOK_SECRET;

  const body = await c.req.text();
  const chapaSignature = c.req.header("x-chapa-signature") ?? c.req.header("chapa-signature");

  if (webhookSecret && chapaSignature) {
    const expected = createHmac("sha256", webhookSecret).update(body).digest("hex");
    const signatureBuffer = Buffer.from(chapaSignature);
    const expectedBuffer = Buffer.from(expected);
    if (
      signatureBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(signatureBuffer, expectedBuffer)
    ) {
      return c.json({ error: "Invalid signature" }, 400);
    }
  }

  let event: Record<string, unknown>;
  try {
    event = JSON.parse(body);
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }

  console.log("[chapa webhook] payload", JSON.stringify(event, null, 2));

  const eventType = event.event as string | undefined;
  if (eventType !== "charge.success") {
    return c.json({ received: true }, 200);
  }

  const txRef =
    (event.tx_ref as string | undefined) ?? (event.trx_ref as string | undefined);
  if (!txRef) {
    return c.json({ error: "Missing tx_ref" }, 400);
  }

  const payment = await prisma.payment.findUnique({
    where: { txRef },
    include: { order: true },
  });
  if (!payment) {
    return c.json({ error: "Payment not found" }, 404);
  }

  if (payment.status === "completed") {
    return c.json({ received: true }, 200);
  }

  try {
    const chapaData = await verifyTransaction(txRef);

    if (chapaData.status === "success") {
      await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: "completed",
            chapaRef: chapaData.ref_id,
            paymentMethod: dbPaymentMethodFromChapaResponse(chapaData.payment_method),
            chapaResponse: chapaData as unknown as Prisma.InputJsonValue,
          },
        });
        await tx.order.update({
          where: { id: payment.orderId },
          data: { status: "paid" },
        });
      });
    } else {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: chapaData.status === "cancelled" ? "cancelled" : "failed",
          chapaResponse: chapaData as unknown as Prisma.InputJsonValue,
        },
      });
    }
  } catch {
    return c.json({ error: "Verification failed" }, 500);
  }

  return c.json({ received: true }, 200);
});
