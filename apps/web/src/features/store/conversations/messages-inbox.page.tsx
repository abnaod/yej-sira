"use client";

import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { useAuthDialog } from "@/features/shared/auth";
import { assetUrl } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { useLocale } from "@/lib/locale-path";
import { cn } from "@/lib/utils";
import type { Locale } from "@ys/intl";

import { conversationsListQuery, type ConversationSummary } from "./conversations.queries";

export function MessagesInboxPage(props: { role: "buyer" | "seller" }) {
  const { role } = props;
  const { t } = useTranslation("common");
  const locale = useLocale() as Locale;
  const { data: session } = authClient.useSession();
  const { openAuth } = useAuthDialog();
  const { data, isLoading, error } = useQuery({
    ...conversationsListQuery(locale, role),
    enabled: role === "seller" || !!session?.user,
  });
  const detailParam =
    role === "buyer" ? ("/$locale/messages/$conversationId" as const) : ("/$locale/sell/messages/$conversationId" as const);

  if (role === "buyer" && !session?.user) {
    return (
      <main className="mx-auto w-full max-w-6xl py-8 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">{t("messages")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("signInToViewMessages")}</p>
        <Button className="mt-6" onClick={() => openAuth()}>
          {t("account")}
        </Button>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className="mx-auto w-full max-w-6xl py-8">
        <p className="text-muted-foreground">{t("loading")}</p>
      </main>
    );
  }
  if (error) {
    return (
      <main className="mx-auto w-full max-w-6xl py-8 text-destructive">
        {error instanceof Error ? error.message : t("errorGeneric")}
      </main>
    );
  }

  const items = data?.conversations ?? [];

  return (
    <main className="mx-auto w-full max-w-6xl">
      <h1 className="text-2xl font-semibold tracking-tight">{t("messages")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t("inbox")}</p>
      <ul className="mt-6 divide-y divide-border">
        {items.length === 0 ? (
          <li className="py-8 text-center text-sm text-muted-foreground">{t("noMessagesYet")}</li>
        ) : (
          items.map((c) => <InboxRow key={c.id} c={c} detailTo={detailParam} locale={locale} />)
        )}
      </ul>
    </main>
  );
}

function InboxRow(props: {
  c: ConversationSummary;
  detailTo: "/$locale/messages/$conversationId" | "/$locale/sell/messages/$conversationId";
  locale: Locale;
}) {
  const { c, detailTo, locale } = props;
  return (
    <li>
      <Link
        to={detailTo}
        params={{ locale, conversationId: c.id }}
        className="flex gap-3 py-4 transition-colors hover:bg-muted/30"
      >
        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
          {c.listing.imageUrl ? (
            <img src={assetUrl(c.listing.imageUrl)} alt="" className="h-full w-full object-cover" />
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <p className="truncate font-medium">{c.listing.name}</p>
            <span className="shrink-0 text-xs text-muted-foreground">
              {new Date(c.lastMessageAt).toLocaleDateString()}
            </span>
          </div>
          <p className="truncate text-sm text-muted-foreground">{c.shop.name}</p>
          {c.lastMessage && (
            <p className="mt-0.5 line-clamp-2 text-sm text-foreground/90">{c.lastMessage.body}</p>
          )}
        </div>
        {c.unreadCount > 0 ? (
          <span
            className={cn(
              "flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground",
            )}
          >
            {c.unreadCount > 99 ? "99+" : c.unreadCount}
          </span>
        ) : null}
      </Link>
    </li>
  );
}
