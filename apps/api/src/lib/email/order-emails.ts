import { isUnclaimedGuestUser } from "../../modules/auth/guest";
import { prisma } from "../db";
import { getEnv } from "../env";
import { toNumber } from "../money";
import { signOrderAccess } from "../order-access";
import { sendEmail } from "./send-email";
import { logger } from "../logger";

function formatCurrency(n: number): string {
  return `${n.toFixed(2)} ETB`;
}

function webOrigin(): string {
  return getEnv().PUBLIC_WEB_URL.replace(/\/$/, "");
}

/** Notify the buyer that their order is confirmed and paid. */
export async function sendOrderConfirmedEmail(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { user: true, items: true },
  });
  if (!order) return;

  const to = order.user?.email;
  if (!to) {
    logger.warn("order_email.no_buyer_email", { orderId });
    return;
  }

  const lines = order.items.map((i) => {
    const unit = toNumber(i.unitPrice);
    return `• ${i.listingName}${i.variantLabel ? ` — ${i.variantLabel}` : ""} x${i.quantity} (${formatCurrency(unit)})`;
  });

  const isGuest = await isUnclaimedGuestUser(order.userId);
  const origin = webOrigin();

  let trackLine: string;
  const footerLines: string[] = [];
  if (isGuest) {
    const token = signOrderAccess(order.id, to);
    trackLine = `View your order: ${origin}/en/orders/by-token/${token}`;
    footerLines.push(
      "",
      `Create an account to track future orders and leave reviews: ${origin}/en/auth/forgot-password`,
    );
  } else {
    trackLine = `Track your order: ${origin}/en/orders/${order.id}`;
  }

  const text = [
    `Hi ${order.user?.name ?? "there"},`,
    "",
    `Thanks for your order! We've received your payment.`,
    "",
    `Order #${order.id}`,
    lines.join("\n"),
    "",
    `Subtotal: ${formatCurrency(toNumber(order.subtotal))}`,
    `Shipping: ${formatCurrency(toNumber(order.shipping))}`,
    `Tax: ${formatCurrency(toNumber(order.tax))}`,
    `Total: ${formatCurrency(toNumber(order.total))}`,
    "",
    trackLine,
    ...footerLines,
    "",
    "— Yej-sira",
  ].join("\n");

  await sendEmail({
    to,
    subject: `Your Yej-sira order is confirmed`,
    text,
  });
}

/** Notify each seller whose listings are in this order about the new paid order. */
export async function sendSellerNewOrderEmail(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          listing: { include: { shop: { include: { owner: true } } } },
        },
      },
    },
  });
  if (!order) return;

  const grouped = new Map<
    string,
    { email: string; name: string; lines: string[] }
  >();

  for (const item of order.items) {
    const shop = item.listing?.shop;
    const owner = shop?.owner;
    if (!shop || !owner?.email) continue;
    const existing = grouped.get(shop.id) ?? {
      email: owner.email,
      name: shop.name,
      lines: [],
    };
    existing.lines.push(
      `• ${item.listingName}${item.variantLabel ? ` — ${item.variantLabel}` : ""} x${item.quantity}`,
    );
    grouped.set(shop.id, existing);
  }

  for (const { email, name, lines } of grouped.values()) {
    const text = [
      `New paid order for ${name}.`,
      "",
      `Order #${order.id}`,
      lines.join("\n"),
      "",
      "Log in to your seller dashboard to start fulfillment.",
      "",
      "— Yej-sira",
    ].join("\n");

    await sendEmail({
      to: email,
      subject: `New order for ${name}`,
      text,
    });
  }
}
