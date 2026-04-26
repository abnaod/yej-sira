import test from "node:test";
import assert from "node:assert/strict";

import {
  buildConversationMessage,
  buildInitialConversationMessage,
  mergeConversationMeta,
} from "./conversations.messages";

test("buildInitialConversationMessage keeps explicit intent metadata", () => {
  const message = buildInitialConversationMessage(
    "Is this still available?",
    "availability",
    { source: "intent_sheet" },
  );

  assert.equal(message.kind, "intent");
  assert.equal(message.body, "Is this still available?");
  assert.deepEqual(message.meta, {
    source: "intent_sheet",
    intentKind: "availability",
  });
});

test("buildInitialConversationMessage falls back to plain text without intent", () => {
  const message = buildInitialConversationMessage("Hello there");

  assert.equal(message.kind, "text");
  assert.equal(message.body, "Hello there");
  assert.equal(message.meta, undefined);
});

test("buildConversationMessage keeps ordinary metadata untouched", () => {
  const message = buildConversationMessage("quick_action", "Delivery available.", {
    actionKey: "seller_delivery",
  });

  assert.equal(message.kind, "quick_action");
  assert.deepEqual(message.meta, { actionKey: "seller_delivery" });
});

test("mergeConversationMeta omits empty objects", () => {
  assert.equal(mergeConversationMeta(undefined), undefined);
  assert.equal(mergeConversationMeta({}, undefined), undefined);
});
