import type { MessageKind } from "@prisma/client";

export type ConversationMessageMeta = Record<string, unknown> | undefined;

export type ConversationMessageDraft = {
  kind: MessageKind;
  body: string;
  meta?: Record<string, unknown>;
};

export function mergeConversationMeta(
  meta?: ConversationMessageMeta,
  extra?: Record<string, unknown>,
): Record<string, unknown> | undefined {
  const merged = {
    ...(meta ?? {}),
    ...(extra ?? {}),
  };
  return Object.keys(merged).length > 0 ? merged : undefined;
}

export function buildInitialConversationMessage(
  body: string,
  intentKind?: string,
  meta?: ConversationMessageMeta,
): ConversationMessageDraft {
  const mergedMeta = mergeConversationMeta(
    meta,
    intentKind ? { intentKind } : undefined,
  );

  return {
    kind: intentKind ? "intent" : "text",
    body,
    ...(mergedMeta ? { meta: mergedMeta } : {}),
  };
}

export function buildConversationMessage(
  kind: MessageKind,
  body: string,
  meta?: ConversationMessageMeta,
): ConversationMessageDraft {
  const mergedMeta = mergeConversationMeta(meta);
  return {
    kind,
    body,
    ...(mergedMeta ? { meta: mergedMeta } : {}),
  };
}
