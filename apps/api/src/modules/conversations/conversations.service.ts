import type { Conversation, Message, MessageKind, Prisma } from "@prisma/client";
import { HTTPException } from "hono/http-exception";

import { prisma } from "../../lib/db";
import { toNumber } from "../../lib/money";
import { agreementNudgeMeta, detectAgreementIntent } from "./intent-detection";
import { pickListingName } from "../catalog/catalog.localize";
import type { Locale } from "@ys/intl";
import { ContentLocale } from "@prisma/client";

const AGREEMENT_NUDGE_BODY_EN =
  "Ready to complete your purchase? You can share how you want to pay and arrange delivery in chat.";

export async function getConversationAccess(
  userId: string,
  conversationId: string,
): Promise<{
  conversation: Conversation & { shop: { ownerUserId: string | null } };
  role: "buyer" | "seller";
  otherUserId: string;
}> {
  const conv = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { shop: { select: { ownerUserId: true } } },
  });
  if (!conv) {
    throw new HTTPException(404, { message: "Conversation not found" });
  }
  const owner = conv.shop.ownerUserId;
  if (conv.buyerUserId === userId) {
    if (!owner) {
      throw new HTTPException(500, { message: "Shop has no owner" });
    }
    return {
      conversation: conv,
      role: "buyer",
      otherUserId: owner,
    };
  }
  if (owner === userId) {
    return {
      conversation: conv,
      role: "seller",
      otherUserId: conv.buyerUserId,
    };
  }
  throw new HTTPException(404, { message: "Conversation not found" });
}

async function ensureParticipantStates(
  tx: Prisma.TransactionClient,
  conversationId: string,
  buyerId: string,
  sellerId: string,
) {
  await tx.conversationParticipantState.upsert({
    where: { conversationId_userId: { conversationId, userId: buyerId } },
    create: { conversationId, userId: buyerId },
    update: {},
  });
  await tx.conversationParticipantState.upsert({
    where: { conversationId_userId: { conversationId, userId: sellerId } },
    create: { conversationId, userId: sellerId },
    update: {},
  });
}

function unreadCountWhere(
  conversationId: string,
  fromUserId: string,
  lastReadAt: Date | null,
): Prisma.MessageWhereInput {
  return {
    conversationId,
    senderUserId: fromUserId,
    ...(lastReadAt ? { createdAt: { gt: lastReadAt } } : {}),
  };
}

export async function createOrAppendConversation(
  userId: string,
  listingId: string,
  body: string,
  locale: Locale,
  _intentKind: string | undefined,
  _meta: Record<string, unknown> | undefined,
) {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    include: {
      shop: { select: { id: true, ownerUserId: true, name: true, responseTimeAvgSeconds: true } },
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
      ...(locale !== "en"
        ? { translations: { where: { locale: locale as ContentLocale } } }
        : {}),
    },
  });
  if (!listing || !listing.isPublished) {
    throw new HTTPException(404, { message: "Listing not found" });
  }
  if (!listing.shop.ownerUserId) {
    throw new HTTPException(400, { message: "Shop has no owner" });
  }
  if (listing.shop.ownerUserId === userId) {
    throw new HTTPException(400, { message: "You cannot message your own listing" });
  }

  const existing = await prisma.conversation.findUnique({
    where: { buyerUserId_listingId: { buyerUserId: userId, listingId: listing.id } },
  });

  if (existing) {
    return prisma.$transaction(async (tx) => {
      const msg = await tx.message.create({
        data: {
          conversationId: existing.id,
          senderUserId: userId,
          kind: "text" as MessageKind,
          body,
        },
      });
      await tx.conversation.update({
        where: { id: existing.id },
        data: { lastMessageAt: msg.createdAt },
      });
      await ensureParticipantStates(
        tx,
        existing.id,
        userId,
        listing.shop.ownerUserId!,
      );
      return { conversationId: existing.id, created: false as const, firstMessage: msg };
    });
  }

  return prisma.$transaction(async (tx) => {
    const conv = await tx.conversation.create({
      data: {
        buyerUserId: userId,
        sellerShopId: listing.shop.id,
        listingId: listing.id,
        lastMessageAt: new Date(),
      },
    });
    const first = await tx.message.create({
      data: {
        conversationId: conv.id,
        senderUserId: userId,
        kind: "intent" as MessageKind,
        body,
      },
    });
    await tx.conversation.update({
      where: { id: conv.id },
      data: { lastMessageAt: first.createdAt },
    });
    await ensureParticipantStates(
      tx,
      conv.id,
      userId,
      listing.shop.ownerUserId!,
    );
    return { conversationId: conv.id, created: true as const, firstMessage: first };
  });
}

export async function listConversationsForUser(
  userId: string,
  role: "buyer" | "seller",
) {
  const where: Prisma.ConversationWhereInput =
    role === "buyer"
      ? { buyerUserId: userId }
      : { sellerShopId: (await getOwnedShopId(userId)) ?? "__none__" };

  if (role === "seller" && where.sellerShopId === "__none__") {
    return { conversations: [] as ReturnType<typeof mapListRow>[] };
  }

  const rows = await prisma.conversation.findMany({
    where,
    orderBy: { lastMessageAt: "desc" },
    take: 100,
    include: {
      listing: {
        include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
      },
      shop: {
        select: {
          id: true,
          name: true,
          slug: true,
          ownerUserId: true,
          responseTimeAvgSeconds: true,
          responseRate: true,
        },
      },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  const result: ReturnType<typeof mapListRow>[] = [];
  for (const c of rows) {
    const otherId =
      role === "buyer" ? c.shop.ownerUserId ?? c.buyerUserId : c.buyerUserId;
    const state = await prisma.conversationParticipantState.findUnique({
      where: { conversationId_userId: { conversationId: c.id, userId: userId } },
    });
    const lastRead = state?.lastReadMessageId
      ? await prisma.message.findUnique({ where: { id: state.lastReadMessageId } })
      : null;
    const unread = await prisma.message.count({
      where: unreadCountWhere(
        c.id,
        otherId,
        lastRead?.createdAt ?? null,
      ),
    });
    const last = c.messages[0] ?? null;
    const imageUrl = c.listing.images[0]?.url ?? "";
    const responseRate = c.shop.responseRate != null ? toNumber(c.shop.responseRate) : null;
    result.push(
      mapListRow(
        c,
        last,
        imageUrl,
        unread,
        role,
        responseRate,
        c.shop.responseTimeAvgSeconds,
      ),
    );
  }

  return { conversations: result };
}

async function getOwnedShopId(userId: string): Promise<string | null> {
  const s = await prisma.shop.findUnique({
    where: { ownerUserId: userId },
    select: { id: true },
  });
  return s?.id ?? null;
}

function mapListRow(
  c: Conversation & {
    listing: { name: string; slug: string };
    shop: {
      name: string;
      slug: string;
      responseTimeAvgSeconds: number | null;
      responseRate: unknown;
    };
  },
  last: Message | null,
  imageUrl: string,
  unread: number,
  role: "buyer" | "seller",
  responseRate: number | null,
  responseTimeAvgSec: number | null,
) {
  return {
    id: c.id,
    lastMessageAt: c.lastMessageAt.toISOString(),
    outcome: c.outcome,
    listing: {
      id: c.listingId,
      slug: c.listing.slug,
      name: c.listing.name,
      imageUrl,
    },
    shop: { name: c.shop.name, slug: c.shop.slug },
    lastMessage: last
      ? {
          id: last.id,
          body: last.body,
          kind: last.kind,
          createdAt: last.createdAt.toISOString(),
          senderUserId: last.senderUserId,
        }
      : null,
    unreadCount: unread,
    role,
    responseRate,
    responseTimeAvgSec,
  };
}

export async function getConversationMessages(
  userId: string,
  conversationId: string,
  cursor: string | undefined,
  take: number,
  locale: Locale,
) {
  const { conversation, otherUserId, role } = await getConversationAccess(userId, conversationId);
  const listing = await prisma.listing.findUnique({
    where: { id: conversation.listingId },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      shop: { select: { id: true, name: true, slug: true, responseTimeAvgSeconds: true, responseRate: true } },
      ...(locale !== "en"
        ? { translations: { where: { locale: locale as ContentLocale } } }
        : {}),
    },
  });
  if (!listing) {
    throw new HTTPException(404, { message: "Listing not found" });
  }
  const name = pickListingName(
    { name: listing.name, translations: listing.translations ?? [] },
    locale,
  );
  const thumb = listing.images[0]?.url ?? "";
  const estimatedReplyMinutes = listing.shop.responseTimeAvgSeconds
    ? Math.max(1, Math.round(listing.shop.responseTimeAvgSeconds / 60))
    : 15;

  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "desc" },
    take: take + 1,
    ...(cursor
      ? {
          cursor: { id: cursor },
          skip: 1,
        }
      : {}),
  });
  const hasMore = messages.length > take;
  const page = hasMore ? messages.slice(0, take) : messages;
  const nextCursor = hasMore ? page[page.length - 1]?.id : undefined;

  // Return chronological for UI
  const chronological = [...page].reverse();

  const state = await prisma.conversationParticipantState.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  });
  const lastRead = state?.lastReadMessageId
    ? await prisma.message.findUnique({ where: { id: state.lastReadMessageId } })
    : null;
  const unread = await prisma.message.count({
    where: unreadCountWhere(
      conversationId,
      otherUserId,
      lastRead?.createdAt ?? null,
    ),
  });

  const otherUser = await prisma.user.findUnique({
    where: { id: otherUserId },
    select: { name: true, email: true },
  });
  const otherUserName =
    otherUser?.name?.trim() ||
    (otherUser?.email ? otherUser.email.split("@")[0] : "") ||
    "Customer";

  return {
    conversation: {
      id: conversation.id,
      outcome: conversation.outcome,
      outcomeAskedAt: conversation.outcomeAskedAt?.toISOString() ?? null,
      lastMessageAt: conversation.lastMessageAt.toISOString(),
      closedAt: conversation.closedAt?.toISOString() ?? null,
    },
    listing: {
      id: listing.id,
      slug: listing.slug,
      name,
      imageUrl: thumb,
    },
    shop: {
      name: listing.shop.name,
      slug: listing.shop.slug,
      responseRate: listing.shop.responseRate != null ? toNumber(listing.shop.responseRate) : null,
      estimatedReplyMinutes,
    },
    role,
    otherUserId,
    otherUserName,
    messages: chronological.map((m) => ({
      id: m.id,
      kind: m.kind,
      body: m.body,
      meta: m.meta,
      createdAt: m.createdAt.toISOString(),
      senderUserId: m.senderUserId,
    })),
    nextCursor: hasMore ? nextCursor : undefined,
    unreadCount: unread,
  };
}

export async function appendMessage(
  userId: string,
  conversationId: string,
  kind: MessageKind,
  body: string,
  meta: Record<string, unknown> | undefined,
) {
  const { conversation, role } = await getConversationAccess(userId, conversationId);
  if (kind === "agreement_nudge" || kind === "system") {
    throw new HTTPException(400, { message: "Cannot send this message kind" });
  }
  return prisma.$transaction(async (tx) => {
    const msg = await tx.message.create({
      data: {
        conversationId,
        senderUserId: userId,
        kind,
        body,
        meta: meta === undefined ? undefined : (meta as Prisma.InputJsonValue),
      },
    });
    await tx.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: msg.createdAt },
    });

    // Optional: recompute shop rolling stats from this reply (lightweight: skip heavy aggregation here)
    let extra: { id: string; kind: MessageKind; body: string; meta: unknown; createdAt: string; senderUserId: string } | null = null;
    if (kind === "text" && detectAgreementIntent(body) && role === "buyer") {
      const nudge = await tx.message.create({
        data: {
          conversationId,
          senderUserId: userId,
          kind: "agreement_nudge" as MessageKind,
          body: AGREEMENT_NUDGE_BODY_EN,
          meta: { ...agreementNudgeMeta } as Prisma.InputJsonValue,
        },
      });
      await tx.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: nudge.createdAt },
      });
      extra = {
        id: nudge.id,
        kind: nudge.kind,
        body: nudge.body,
        meta: nudge.meta,
        createdAt: nudge.createdAt.toISOString(),
        senderUserId: nudge.senderUserId,
      };
    }
    // Update shop denormalized response metrics on seller reply
    if (role === "seller" && kind === "text") {
      void updateShopResponseAfterSellerReply(
        tx,
        conversation,
        userId,
        msg.createdAt,
      ).catch(() => {});
    }
    return { message: msg, agreementNudge: extra };
  });
}

/** First seller text after the first buyer message: update responseTimeAvgSeconds. */
async function updateShopResponseAfterSellerReply(
  tx: Prisma.TransactionClient,
  conversation: Conversation,
  sellerId: string,
  replyTime: Date,
) {
  const firstBuyer = await tx.message.findFirst({
    where: { conversationId: conversation.id, senderUserId: conversation.buyerUserId },
    orderBy: { createdAt: "asc" },
  });
  if (!firstBuyer) return;
  const firstSellerBefore = await tx.message.findFirst({
    where: {
      conversationId: conversation.id,
      senderUserId: sellerId,
      createdAt: { lt: replyTime },
    },
    orderBy: { createdAt: "asc" },
  });
  if (firstSellerBefore) {
    // not first reply
    return;
  }
  const seconds = (replyTime.getTime() - firstBuyer.createdAt.getTime()) / 1000;
  if (seconds < 0) return;
  const shop = await tx.shop.findUnique({
    where: { id: conversation.sellerShopId },
    select: { responseTimeAvgSeconds: true, responseRate: true },
  });
  if (!shop) return;
  const prev = shop.responseTimeAvgSeconds;
  const nextAvg = prev == null ? Math.round(seconds) : Math.round((prev * 0.7 + seconds * 0.3) / 1);
  await tx.shop.update({
    where: { id: conversation.sellerShopId },
    data: { responseTimeAvgSeconds: nextAvg, responseRate: shop.responseRate ?? 0.9 },
  });
}

export async function markRead(userId: string, conversationId: string, lastReadMessageId: string) {
  await getConversationAccess(userId, conversationId);
  const m = await prisma.message.findFirst({
    where: { id: lastReadMessageId, conversationId },
  });
  if (!m) {
    throw new HTTPException(400, { message: "Invalid message" });
  }
  await prisma.conversationParticipantState.upsert({
    where: { conversationId_userId: { conversationId, userId } },
    create: { conversationId, userId, lastReadMessageId },
    update: { lastReadMessageId },
  });
  return { ok: true as const };
}

export async function setOutcome(
  userId: string,
  conversationId: string,
  outcome: "open" | "purchased" | "no_response" | "price_too_high" | "changed_mind" | "other",
) {
  const { conversation } = await getConversationAccess(userId, conversationId);
  if (conversation.buyerUserId !== userId) {
    throw new HTTPException(403, { message: "Only the buyer can set outcome" });
  }
  await prisma.conversation.update({
    where: { id: conversationId },
    data: {
      outcome,
      closedAt: outcome === "open" ? null : new Date(),
    },
  });
  return { ok: true as const, listingId: conversation.listingId };
}

export async function markOutcomeAsked(userId: string, conversationId: string) {
  const { conversation } = await getConversationAccess(userId, conversationId);
  if (conversation.buyerUserId !== userId) {
    throw new HTTPException(403, { message: "Forbidden" });
  }
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { outcomeAskedAt: new Date() },
  });
  return { ok: true as const };
}

export async function getSellerMessageMetrics(shopId: string) {
  const convs = await prisma.conversation.findMany({
    where: { sellerShopId: shopId },
    select: { id: true, buyerUserId: true, createdAt: true },
  });
  const leads = convs.length;
  if (leads === 0) {
    return { leads: 0, responseRate: null as number | null, avgResponseSeconds: null as number | null };
  }
  const deltas: number[] = [];
  let repliedIn24h = 0;
  let withBuyerMessage = 0;
  for (const c of convs) {
    const firstBuyer = await prisma.message.findFirst({
      where: { conversationId: c.id, senderUserId: c.buyerUserId },
      orderBy: { createdAt: "asc" },
    });
    if (!firstBuyer) continue;
    withBuyerMessage += 1;
    const firstSeller = await prisma.message.findFirst({
      where: {
        conversationId: c.id,
        senderUserId: { not: c.buyerUserId },
        kind: { in: ["text", "quick_action"] },
      },
      orderBy: { createdAt: "asc" },
    });
    if (firstSeller) {
      const sec = (firstSeller.createdAt.getTime() - firstBuyer.createdAt.getTime()) / 1000;
      if (sec >= 0) deltas.push(sec);
      if (sec < 24 * 3600) repliedIn24h += 1;
    }
  }
  const responseRate = withBuyerMessage > 0 ? repliedIn24h / withBuyerMessage : null;
  const avgResponseSeconds =
    deltas.length > 0 ? Math.round(deltas.reduce((a, b) => a + b, 0) / deltas.length) : null;
  return { leads, responseRate, avgResponseSeconds };
}

/** Export for routes that need the raw `getOwnedShopId`. */
export { getOwnedShopId };
