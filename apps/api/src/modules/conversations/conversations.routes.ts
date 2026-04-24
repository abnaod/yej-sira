import type { MessageKind } from "@prisma/client";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

import { requireUserId } from "../../lib/auth";
import {
  createConversationBodySchema,
  listConversationsQuerySchema,
  messageCursorQuerySchema,
  patchOutcomeBodySchema,
  patchReadBodySchema,
  postMessageBodySchema,
} from "./conversations.schema";
import {
  appendMessage,
  createOrAppendConversation,
  getConversationMessages,
  listConversationsForUser,
  markOutcomeAsked,
  markRead,
  setOutcome,
} from "./conversations.service";

export const conversationsRouter = new Hono();

conversationsRouter.post("/conversations", async (c) => {
  const userId = await requireUserId(c);
  const locale = c.get("locale");
  const body = await c.req.json().catch(() => null);
  const parsed = createConversationBodySchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    const message = first
      ? `${(first.path.length ? first.path.join(".") : "body")}: ${first.message}`
      : "Invalid body";
    throw new HTTPException(400, { message });
  }
  const { listingId, initialMessage, intentKind, meta } = parsed.data;
  const { conversationId, created } = await createOrAppendConversation(
    userId,
    listingId,
    initialMessage,
    locale,
    intentKind,
    meta,
  );
  return c.json({ conversationId, created });
});

conversationsRouter.get("/conversations", async (c) => {
  const userId = await requireUserId(c);
  const parsed = listConversationsQuerySchema.safeParse({ role: c.req.query("role") });
  if (!parsed.success) {
    throw new HTTPException(400, { message: "role must be buyer or seller" });
  }
  const { role } = parsed.data;
  return c.json(await listConversationsForUser(userId, role));
});

conversationsRouter.get("/conversations/:id", async (c) => {
  const userId = await requireUserId(c);
  const locale = c.get("locale");
  const id = c.req.param("id");
  const q = messageCursorQuerySchema.safeParse({
    cursor: c.req.query("cursor"),
    take: c.req.query("take"),
  });
  if (!q.success) {
    throw new HTTPException(400, { message: "Invalid query" });
  }
  return c.json(
    await getConversationMessages(
      userId,
      id,
      q.data.cursor,
      q.data.take ?? 50,
      locale,
    ),
  );
});

conversationsRouter.post("/conversations/:id/messages", async (c) => {
  const userId = await requireUserId(c);
  const id = c.req.param("id");
  const body = await c.req.json().catch(() => null);
  const parsed = postMessageBodySchema.safeParse(body);
  if (!parsed.success) {
    throw new HTTPException(400, { message: "Invalid body" });
  }
  const { kind, body: text, meta } = parsed.data;
  const { message, agreementNudge } = await appendMessage(
    userId,
    id,
    kind as MessageKind,
    text,
    meta,
  );
  return c.json({
    message: {
      id: message.id,
      kind: message.kind,
      body: message.body,
      meta: message.meta,
      createdAt: message.createdAt.toISOString(),
      senderUserId: message.senderUserId,
    },
    agreementNudge: agreementNudge
      ? {
          id: agreementNudge.id,
          kind: agreementNudge.kind,
          body: agreementNudge.body,
          meta: agreementNudge.meta,
          createdAt: agreementNudge.createdAt,
          senderUserId: agreementNudge.senderUserId,
        }
      : null,
  });
});

conversationsRouter.patch("/conversations/:id/read", async (c) => {
  const userId = await requireUserId(c);
  const id = c.req.param("id");
  const body = await c.req.json().catch(() => null);
  const parsed = patchReadBodySchema.safeParse(body);
  if (!parsed.success) {
    throw new HTTPException(400, { message: "Invalid body" });
  }
  return c.json(await markRead(userId, id, parsed.data.lastReadMessageId));
});

conversationsRouter.patch("/conversations/:id/outcome", async (c) => {
  const userId = await requireUserId(c);
  const id = c.req.param("id");
  const body = await c.req.json().catch(() => null);
  const parsed = patchOutcomeBodySchema.safeParse(body);
  if (!parsed.success) {
    throw new HTTPException(400, { message: "Invalid body" });
  }
  return c.json(await setOutcome(userId, id, parsed.data.outcome));
});

conversationsRouter.post("/conversations/:id/outcome-asked", async (c) => {
  const userId = await requireUserId(c);
  const id = c.req.param("id");
  return c.json(await markOutcomeAsked(userId, id));
});
