import { createFileRoute } from "@tanstack/react-router";

import { MessagesInboxPage } from "@/features/store/conversations/messages-inbox.page";

export const Route = createFileRoute("/$locale/(store)/messages/")({
  component: StoreMessages,
});

function StoreMessages() {
  return <MessagesInboxPage role="buyer" />;
}
