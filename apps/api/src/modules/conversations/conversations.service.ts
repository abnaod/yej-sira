import {
  ContentLocale,
  Prisma,
  type Conversation,
  type Message,
  type MessageKind,
} from "@prisma/client";
import { HTTPException } from "hono/http-exception";
import type { Locale } from "@ys/intl";

import { prisma } from "../../lib/db";
import { toNumber } from "../../lib/money";
import { agreementNudgeMeta, detectAgreementIntent } from "./intent-detection";
import { pickListingName } from "../catalog/catalog.localize";
import {
  buildConversationMessage,
  buildInitialConversationMessage,
  type ConversationMessageDraft,
} from "./conversations.messages";

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

type QueryableClient = Prisma.TransactionClient | typeof prisma;

function toMessageCreateInput(
  conversationId: string,
  senderUserId: string,
  draft: ConversationMessageDraft,
): Prisma.MessageUncheckedCreateInput {
  return {
    conversationId,
    senderUserId,
    kind: draft.kind,
    body: draft.body,
    meta: draft.meta === undefined ? undefined : (draft.meta as Prisma.InputJsonValue),
  };
}

async function createConversationMessage(
  tx: Prisma.TransactionClient,
  conversationId: string,
  senderUserId: string,
  draft: ConversationMessageDraft,
) {
  const message = await tx.message.create({
    data: toMessageCreateInput(conversationId, senderUserId, draft),
  });

  await tx.conversation.update({
    where: { id: conversationId },
    data: { lastMessageAt: message.createdAt },
  });

  return message;
}

async function getUnreadCountsForUser(
  db: QueryableClient,
  userId: string,
  conversationIds: string[],
) {
  if (conversationIds.length === 0) {
    return new Map<string, number>();
  }

  const rows = await db.$queryRaw<Array<{ conversationId: string; unreadCount: number }>>(
    Prisma.sql`
      SELECT
        c.id AS "conversationId",
        COUNT(m.id)::int AS "unreadCount"
      FROM "conversations" c
      LEFT JOIN "conversation_participant_states" s
        ON s."conversation_id" = c.id
       AND s."user_id" = ${userId}
      LEFT JOIN "messages" lr
        ON lr.id = s."last_read_message_id"
      LEFT JOIN "messages" m
        ON m."conversation_id" = c.id
       AND m."sender_user_id" <> ${userId}
       AND (lr."created_at" IS NULL OR m."created_at" > lr."created_at")
      WHERE c.id IN (${Prisma.join(conversationIds)})
      GROUP BY c.id
    `,
  );

  return new Map(rows.map((row) => [row.conversationId, Number(row.unreadCount)]));
}

async function getSellerMessageMetricsSnapshot(
  db: QueryableClient,
  shopId: string,
) {
  const [row] = await db.$queryRaw<
    Array<{
      leads: number;
      responseRate: number | null;
      avgResponseSeconds: number | null;
    }>
  >(Prisma.sql`
    WITH convs AS (
      SELECT id, buyer_user_id
      FROM "conversations"
      WHERE seller_shop_id = ${shopId}
    ),
    first_buyer AS (
      SELECT
        m.conversation_id,
        MIN(m.created_at) AS buyer_at
      FROM "messages" m
      INNER JOIN convs c
        ON c.id = m.conversation_id
      WHERE m.sender_user_id = c.buyer_user_id
      GROUP BY m.conversation_id
    ),
    first_seller AS (
      SELECT
        fb.conversation_id,
        MIN(m.created_at) AS seller_at
      FROM first_buyer fb
      INNER JOIN convs c
        ON c.id = fb.conversation_id
      INNER JOIN "messages" m
        ON m.conversation_id = fb.conversation_id
      WHERE m.sender_user_id <> c.buyer_user_id
        AND m.kind IN ('text', 'quick_action')
        AND m.created_at >= fb.buyer_at
      GROUP BY fb.conversation_id
    )
    SELECT
      (SELECT COUNT(*)::int FROM convs) AS "leads",
      CASE
        WHEN COUNT(fb.conversation_id) = 0 THEN NULL
        ELSE AVG(
          CASE
            WHEN fs.seller_at IS NOT NULL
             AND fs.seller_at < fb.buyer_at + INTERVAL '24 hours'
              THEN 1.0
            ELSE 0.0
          END
        )::float8
      END AS "responseRate",
      CASE
        WHEN COUNT(fs.conversation_id) = 0 THEN NULL
        ELSE AVG(EXTRACT(EPOCH FROM (fs.seller_at - fb.buyer_at)))::float8
      END AS "avgResponseSeconds"
    FROM first_buyer fb
    LEFT JOIN first_seller fs
      ON fs.conversation_id = fb.conversation_id
  `);

  return {
    leads: Number(row?.leads ?? 0),
    responseRate:
      row?.responseRate == null ? null : Number(row.responseRate),
    avgResponseSeconds:
      row?.avgResponseSeconds == null ? null : Math.round(Number(row.avgResponseSeconds)),
  };
}

export async function createOrAppendConversation(
  userId: string,
  listingId: string,
  body: string,
  locale: Locale,
  intentKind: string | undefined,
  meta: Record<string, unknown> | undefined,
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
  const trimmedBody = body.trim();
  const initialDraft =
    trimmedBody.length > 0
      ? buildInitialConversationMessage(trimmedBody, intentKind, meta)
      : null;

  if (existing) {
    return prisma.$transaction(async (tx) => {
      let firstMessage = null;
      if (initialDraft) {
        firstMessage = await createConversationMessage(
          tx,
          existing.id,
          userId,
          initialDraft,
        );
      }
      await ensureParticipantStates(
        tx,
        existing.id,
        userId,
        listing.shop.ownerUserId!,
      );
      return { conversationId: existing.id, created: false as const, firstMessage };
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
    let firstMessage = null;
    if (initialDraft) {
      firstMessage = await createConversationMessage(tx, conv.id, userId, initialDraft);
    }
    await ensureParticipantStates(
      tx,
      conv.id,
      userId,
      listing.shop.ownerUserId!,
    );
    return { conversationId: conv.id, created: true as const, firstMessage };
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

  const otherIdSet = new Set<string>();
  for (const c of rows) {
    const oid = role === "buyer" ? c.shop.ownerUserId ?? c.buyerUserId : c.buyerUserId;
    if (oid) otherIdSet.add(oid);
  }
  const otherUsers = await prisma.user.findMany({
    where: { id: { in: [...otherIdSet] } },
    select: { id: true, name: true, email: true },
  });
  const otherNameById = new Map(
    otherUsers.map((u) => [u.id, otherPartyDisplayName(u)] as const),
  );
  const unreadByConversationId = await getUnreadCountsForUser(
    prisma,
    userId,
    rows.map((row) => row.id),
  );

  const result: ReturnType<typeof mapListRow>[] = [];
  for (const c of rows) {
    const otherId =
      role === "buyer" ? c.shop.ownerUserId ?? c.buyerUserId : c.buyerUserId;
    const last = c.messages[0] ?? null;
    const imageUrl = c.listing.images[0]?.url ?? "";
    const responseRate = c.shop.responseRate != null ? toNumber(c.shop.responseRate) : null;
    const otherUserName = otherNameById.get(otherId) ?? "Customer";
    result.push(
      mapListRow(
        c,
        last,
        imageUrl,
        unreadByConversationId.get(c.id) ?? 0,
        role,
        responseRate,
        c.shop.responseTimeAvgSeconds,
        otherUserName,
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

function otherPartyDisplayName(u: { name: string | null; email: string | null }): string {
  return u.name?.trim() || (u.email ? u.email.split("@")[0] : "") || "Customer";
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
  otherUserName: string,
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
    otherUserName,
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

  const unreadByConversationId = await getUnreadCountsForUser(prisma, userId, [conversationId]);
  const unread = unreadByConversationId.get(conversationId) ?? 0;

  const otherUser = await prisma.user.findUnique({
    where: { id: otherUserId },
    select: { name: true, email: true },
  });
  const otherUserName = otherUser ? otherPartyDisplayName(otherUser) : "Customer";

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
    const msg = await createConversationMessage(
      tx,
      conversationId,
      userId,
      buildConversationMessage(kind, body, meta),
    );

    let extra: {
      id: string;
      kind: MessageKind;
      body: string;
      meta: unknown;
      createdAt: string;
      senderUserId: string;
    } | null = null;
    if (kind === "text" && detectAgreementIntent(body) && role === "buyer") {
      const nudge = await createConversationMessage(
        tx,
        conversationId,
        userId,
        buildConversationMessage(
          "agreement_nudge",
          AGREEMENT_NUDGE_BODY_EN,
          agreementNudgeMeta as unknown as Record<string, unknown>,
        ),
      );
      extra = {
        id: nudge.id,
        kind: nudge.kind,
        body: nudge.body,
        meta: nudge.meta,
        createdAt: nudge.createdAt.toISOString(),
        senderUserId: nudge.senderUserId,
      };
    }

    if (role === "seller" && kind === "text") {
      await updateShopResponseAfterSellerReply(tx, conversation, userId, msg.createdAt);
    }
    return { message: msg, agreementNudge: extra };
  });
}

/** First seller text after the first buyer message: refresh shop reply metrics. */
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
  const metrics = await getSellerMessageMetricsSnapshot(tx, conversation.sellerShopId);
  await tx.shop.update({
    where: { id: conversation.sellerShopId },
    data: {
      responseTimeAvgSeconds: metrics.avgResponseSeconds,
      responseRate: metrics.responseRate,
    },
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
  return getSellerMessageMetricsSnapshot(prisma, shopId);
}

/** Export for routes that need the raw `getOwnedShopId`. */
export { getOwnedShopId };
