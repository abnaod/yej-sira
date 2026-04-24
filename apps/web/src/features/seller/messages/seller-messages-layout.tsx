"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { conversationsListQuery, type ConversationSummary } from "@/features/store/conversations/conversations.queries";
import { assetUrl } from "@/lib/api";
import { useLocale } from "@/lib/locale-path";
import { cn } from "@/lib/utils";
import type { Locale } from "@ys/intl";

import { inboxTimeLabel } from "@/features/store/conversations/message-time";

const detailTo = "/$locale/sell/messages/$conversationId" as const;

function parseMessagesConversationId(pathname: string): string | null {
  const m = pathname.match(/\/messages\/([^/]+)\/?$/);
  if (!m?.[1]) return null;
  if (m[1] === "messages") return null;
  return m[1];
}

export function SellerMessagesLayout() {
  const { t } = useTranslation("common");
  const locale = useLocale() as Locale;
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const conversationId = parseMessagesConversationId(pathname) ?? null;

  const [isLg, setIsLg] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    setIsLg(mq.matches);
    const fn = () => setIsLg(mq.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);

  const showInbox = isLg || !conversationId;
  const showRight = isLg || !!conversationId;

  const { data, isLoading, error } = useQuery(conversationsListQuery(locale, "seller"));

  const [query, setQuery] = useState("");
  const items = useMemo(() => {
    const list = data?.conversations ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (c) =>
        c.listing.name.toLowerCase().includes(q) ||
        c.shop.name.toLowerCase().includes(q) ||
        (c.lastMessage?.body.toLowerCase().includes(q) ?? false),
    );
  }, [data?.conversations, query]);

  const totalUnread = useMemo(() => (data?.conversations ?? []).reduce((a, c) => a + c.unreadCount, 0), [data?.conversations]);

  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-1 overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm",
        "max-lg:min-h-[min(100dvh,52rem)] lg:min-h-[calc(100dvh-7.5rem)]",
      )}
    >
      <aside
        className={cn(
          "flex w-full min-w-0 flex-col border-border/80 bg-muted/20 lg:max-w-88 lg:shrink-0 lg:border-r",
          !showInbox && "hidden",
        )}
      >
        <div className="shrink-0 space-y-3 border-b border-border/60 bg-background/80 p-3 backdrop-blur-sm">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("searchMessages")}
              className="h-10 rounded-lg border border-border/80 bg-white pl-9 shadow-sm"
            />
          </div>
          <div className="flex items-center justify-between gap-2 px-0.5">
            <div className="inline-flex h-8 items-center rounded-full bg-primary px-3 text-xs font-semibold text-primary-foreground shadow-sm">
              {t("inbox")}
              {totalUnread > 0 ? (
                <span className="ml-1.5 inline-flex min-w-5 items-center justify-center rounded-full bg-primary-foreground/20 px-1 text-[10px]">
                  {totalUnread > 99 ? "99+" : totalUnread}
                </span>
              ) : null}
            </div>
            <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              {t("leads")}
            </span>
          </div>
        </div>
        {isLoading ? (
          <p className="p-4 text-sm text-muted-foreground">{t("loading")}</p>
        ) : error ? (
          <p className="p-4 text-sm text-destructive">
            {error instanceof Error ? error.message : t("errorGeneric")}
          </p>
        ) : (
          <ScrollArea className="min-h-0 flex-1">
            <ul className="p-1.5">
              {items.length === 0 ? (
                <li className="px-2 py-10 text-center text-sm text-muted-foreground">{t("noMessagesYet")}</li>
              ) : (
                items.map((c) => (
                  <InboxItem
                    key={c.id}
                    c={c}
                    locale={locale}
                    active={c.id === conversationId}
                    tInboxTime={(iso) => inboxTimeLabel(iso, locale, t)}
                  />
                ))
              )}
            </ul>
          </ScrollArea>
        )}
      </aside>
      <section
        className={cn(
          "flex h-full min-h-0 min-w-0 flex-1 flex-col bg-background",
          !showRight ? "max-lg:hidden" : "",
        )}
      >
        <Outlet />
      </section>
    </div>
  );
}

function InboxItem(props: {
  c: ConversationSummary;
  locale: Locale;
  active: boolean;
  tInboxTime: (iso: string) => string;
}) {
  const { c, locale, active, tInboxTime } = props;
  return (
    <li>
      <Link
        to={detailTo}
        params={{ locale, conversationId: c.id }}
        className={cn(
          "flex gap-2.5 rounded-xl px-2.5 py-2.5 transition-colors",
          active
            ? "bg-primary/10 ring-1 ring-primary/20"
            : "hover:bg-muted/60",
        )}
      >
        <div className="relative flex w-1 shrink-0 items-center justify-center">
          {c.unreadCount > 0 && !active ? <span className="size-2 rounded-full bg-primary shadow-sm" /> : null}
        </div>
        <div className="relative h-11 w-11 shrink-0">
          <div className="h-11 w-11 overflow-hidden rounded-full border border-border/60 bg-muted">
            {c.listing.imageUrl ? (
              <img src={assetUrl(c.listing.imageUrl)} alt="" className="h-full w-full object-cover" />
            ) : null}
          </div>
          <span
            className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-background bg-emerald-500"
            title=""
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-sm font-semibold leading-tight text-foreground">{c.listing.name}</p>
            <span className="shrink-0 text-[11px] text-muted-foreground">{tInboxTime(c.lastMessageAt)}</span>
          </div>
          <p className="truncate text-xs text-muted-foreground">{c.shop.name}</p>
          {c.lastMessage ? (
            <p className="mt-0.5 line-clamp-1 text-xs text-foreground/80">{c.lastMessage.body}</p>
          ) : null}
        </div>
        {c.unreadCount > 0 ? (
          <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
            {c.unreadCount > 99 ? "99+" : c.unreadCount}
          </span>
        ) : null}
      </Link>
    </li>
  );
}
