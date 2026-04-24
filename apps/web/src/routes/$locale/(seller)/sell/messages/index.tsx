import { createFileRoute } from "@tanstack/react-router";
import { MessageSquare } from "lucide-react";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/$locale/(seller)/sell/messages/")({
  component: SellerMessagesIndex,
});

function SellerMessagesIndex() {
  const { t } = useTranslation("common");
  return (
    <div className="flex h-full min-h-[16rem] flex-1 flex-col items-center justify-center gap-2 px-6 text-center max-lg:min-h-[20rem]">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <MessageSquare className="size-7" />
      </div>
      <h2 className="text-lg font-semibold tracking-tight text-foreground">{t("selectConversation")}</h2>
      <p className="max-w-sm text-sm text-muted-foreground">{t("selectConversationDescription")}</p>
    </div>
  );
}
