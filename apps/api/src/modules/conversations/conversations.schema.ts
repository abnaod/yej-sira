import { z } from "zod";

export const createConversationBodySchema = z.object({
  listingId: z.string().min(1),
  initialMessage: z.string().min(1).max(20_000),
  intentKind: z.string().max(64).optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
});

export const listConversationsQuerySchema = z.object({
  role: z.enum(["buyer", "seller"]),
});

export const postMessageBodySchema = z.object({
  kind: z
    .enum(["text", "system", "intent", "quick_action", "agreement_nudge"])
    .default("text"),
  body: z.string().min(1).max(20_000),
  meta: z.record(z.string(), z.unknown()).optional(),
});

export const patchReadBodySchema = z.object({
  lastReadMessageId: z.string().min(1),
});

export const patchOutcomeBodySchema = z.object({
  outcome: z.enum([
    "open",
    "purchased",
    "no_response",
    "price_too_high",
    "changed_mind",
    "other",
  ]),
  /** Shown to buyer when outcome is not purchased. */
  reasonDetail: z.string().max(2000).optional(),
});

export const messageCursorQuerySchema = z.object({
  cursor: z.string().cuid().optional(),
  take: z.coerce.number().int().min(1).max(100).optional().default(50),
});
