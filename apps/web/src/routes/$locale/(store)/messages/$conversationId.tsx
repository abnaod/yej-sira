import { createFileRoute, getRouteApi } from "@tanstack/react-router";

import { ConversationChatView } from "@/features/store/conversations/components/conversation-chat-view";

const routeApi = getRouteApi("/$locale/(store)/messages/$conversationId");

export const Route = createFileRoute("/$locale/(store)/messages/$conversationId")({
  component: StoreMessageDetail,
});

function StoreMessageDetail() {
  const { conversationId } = routeApi.useParams();
  return (
    <ConversationChatView
      backTo="/$locale/messages"
      backContext="buyer"
      conversationId={conversationId}
    />
  );
}
