import { createFileRoute, getRouteApi } from "@tanstack/react-router";

import { ConversationChatView } from "@/features/store/conversations/components/conversation-chat-view";

const routeApi = getRouteApi("/$locale/(seller)/sell/messages/$conversationId");

export const Route = createFileRoute("/$locale/(seller)/sell/messages/$conversationId")({
  component: SellerMessageDetail,
});

function SellerMessageDetail() {
  const { conversationId } = routeApi.useParams();
  return (
    <ConversationChatView
      backTo="/$locale/sell/messages"
      backContext="seller"
      conversationId={conversationId}
      variant="split"
    />
  );
}
