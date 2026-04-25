import type { Locale } from "@ys/intl";
import { mutationOptions, queryOptions, type QueryClient } from "@tanstack/react-query";

import { apiFetchJson } from "@/lib/api";

export type MessageKind = "text" | "system" | "intent" | "quick_action" | "agreement_nudge";

export type ConversationSummary = {
  id: string;
  lastMessageAt: string;
  outcome: string;
  listing: { id: string; slug: string; name: string; imageUrl: string };
  shop: { name: string; slug: string };
  lastMessage: {
    id: string;
    body: string;
    kind: MessageKind;
    createdAt: string;
    senderUserId: string;
  } | null;
  unreadCount: number;
  role: "buyer" | "seller";
  responseRate: number | null;
  responseTimeAvgSec: number | null;
};

export type ConversationListResponse = {
  conversations: ConversationSummary[];
};

export type ConversationMessageDto = {
  id: string;
  kind: MessageKind;
  body: string;
  meta: unknown;
  createdAt: string;
  senderUserId: string;
};

export type ConversationDetailResponse = {
  conversation: {
    id: string;
    outcome: string;
    outcomeAskedAt: string | null;
    lastMessageAt: string;
    closedAt: string | null;
  };
  listing: { id: string; slug: string; name: string; imageUrl: string };
  shop: { name: string; slug: string; responseRate: number | null; estimatedReplyMinutes: number };
  role: "buyer" | "seller";
  otherUserId: string;
  /** Display name for the other participant (e.g. buyer name in seller chat). */
  otherUserName: string;
  messages: ConversationMessageDto[];
  nextCursor?: string;
  unreadCount: number;
};

export const conversationsListQuery = (locale: Locale, role: "buyer" | "seller") =>
  queryOptions({
    queryKey: ["conversations", locale, role] as const,
    queryFn: () =>
      apiFetchJson<ConversationListResponse>(`/api/conversations?role=${role}`, { locale }),
  });

export const conversationDetailQuery = (locale: Locale, conversationId: string) =>
  queryOptions({
    queryKey: ["conversation", locale, conversationId] as const,
    queryFn: () =>
      apiFetchJson<ConversationDetailResponse>(`/api/conversations/${encodeURIComponent(conversationId)}`, {
        locale,
      }),
  });

export function createConversationMutationOptions(
  queryClient: QueryClient,
  locale: Locale,
  onSuccess?: (id: string) => void,
) {
  return mutationOptions({
    mutationFn: (body: {
      listingId: string;
      initialMessage: string;
      intentKind?: string;
    }) =>
      apiFetchJson<{ conversationId: string; created: boolean }>("/api/conversations", {
        method: "POST",
        locale,
        body: JSON.stringify(body),
      }),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ["conversations", locale, "buyer"] });
      void queryClient.invalidateQueries({ queryKey: ["conversations", locale, "seller"] });
      onSuccess?.(data.conversationId);
    },
  });
}

export function sendConversationMessageMutationOptions(
  queryClient: QueryClient,
  locale: Locale,
  conversationId: string,
) {
  return mutationOptions({
    mutationFn: (body: {
      kind: MessageKind;
      body: string;
      meta?: Record<string, unknown>;
    }) =>
      apiFetchJson<{
        message: ConversationMessageDto;
        agreementNudge: ConversationMessageDto | null;
      }>(`/api/conversations/${encodeURIComponent(conversationId)}/messages`, {
        method: "POST",
        locale,
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["conversation", locale, conversationId] });
      void queryClient.invalidateQueries({ queryKey: ["conversations", locale] });
    },
  });
}

export function markConversationReadMutationOptions(locale: Locale, conversationId: string) {
  return mutationOptions({
    mutationFn: (lastReadMessageId: string) =>
      apiFetchJson<{ ok: true }>(`/api/conversations/${encodeURIComponent(conversationId)}/read`, {
        method: "PATCH",
        locale,
        body: JSON.stringify({ lastReadMessageId }),
      }),
  });
}

export function setConversationOutcomeMutationOptions(
  queryClient: QueryClient,
  locale: Locale,
  conversationId: string,
) {
  return mutationOptions({
    mutationFn: (outcome: string) =>
      apiFetchJson<{ ok: true; listingId: string }>(
        `/api/conversations/${encodeURIComponent(conversationId)}/outcome`,
        {
          method: "PATCH",
          locale,
          body: JSON.stringify({ outcome }),
        },
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["conversation", locale, conversationId] });
    },
  });
}

export function markOutcomeAskedMutationOptions(locale: Locale, conversationId: string) {
  return mutationOptions({
    mutationFn: () =>
      apiFetchJson<{ ok: true }>(
        `/api/conversations/${encodeURIComponent(conversationId)}/outcome-asked`,
        {
          method: "POST",
          locale,
        },
      ),
  });
}

export type SellerMessageMetrics = {
  leads: number;
  responseRate: number | null;
  avgResponseSeconds: number | null;
};

export const sellerMessageMetricsQuery = (locale: Locale) =>
  queryOptions({
    queryKey: ["seller", "messages", "metrics", locale] as const,
    queryFn: () => apiFetchJson<SellerMessageMetrics>("/api/seller/messages/metrics", { locale }),
  });
