"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Image as ImageIcon,
  MoreHorizontal,
  Paperclip,
  Send,
  Smile,
  User,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { useAuthDialog } from "@/features/shared/auth";
import { dayDividerLabel, timeShort } from "../message-time";
import { assetUrl } from "@/lib/api";
import { useLocale } from "@/lib/locale-path";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import type { Locale } from "@ys/intl";

import {
  conversationDetailQuery,
  markConversationReadMutationOptions,
  sendConversationMessageMutationOptions,
  setConversationOutcomeMutationOptions,
  type ConversationMessageDto,
} from "../conversations.queries";
import { AgreementNudgeCard } from "./agreement-nudge-card";
import { ChatHeader } from "./chat-header";
import { OutcomeSheet } from "./outcome-sheet";
import { QuickActionsBar } from "./quick-actions-bar";

const IDLE_MS = 24 * 60 * 60 * 1000;

type BackRoute = "/$locale/messages" | "/$locale/sell/messages";

function dayKey(iso: string) {
  const d = new Date(iso);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export function ConversationChatView(props: {
  conversationId: string;
  backTo: BackRoute;
  backContext?: "buyer" | "seller";
  /** Seller portal: split column with list + MantaUI-style thread. */
  variant?: "default" | "split";
}) {
  const { conversationId, backTo, backContext = "buyer", variant = "default" } = props;
  const { t } = useTranslation("common");
  const locale = useLocale() as Locale;
  const queryClient = useQueryClient();
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const { openAuth } = useAuthDialog();
  const userId = session?.user?.id;
  const bottomRef = useRef<HTMLDivElement>(null);
  const isSplit = variant === "split";

  const [isLg, setIsLg] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    setIsLg(mq.matches);
    const fn = () => setIsLg(mq.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);

  const { data, isLoading, error } = useQuery({
    ...conversationDetailQuery(locale, conversationId),
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
    enabled: !!session?.user,
  });

  const send = useMutation(sendConversationMessageMutationOptions(queryClient, locale, conversationId));
  const markRead = useMutation(markConversationReadMutationOptions(locale, conversationId));
  const setOutcome = useMutation(setConversationOutcomeMutationOptions(queryClient, locale, conversationId));
  const [draft, setDraft] = useState("");

  const lastMessage = data?.messages[data.messages.length - 1];
  useEffect(() => {
    if (!data || !userId || !lastMessage) return;
    if (lastMessage.senderUserId === userId) return;
    void markRead.mutateAsync(lastMessage.id);
  }, [data?.conversation.id, lastMessage?.id, userId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [data?.messages.length]);

  const showOutcome = useMemo(() => {
    if (!data || data.role !== "buyer") return false;
    if (data.conversation.outcome !== "open") return false;
    if (typeof window !== "undefined") {
      const dismissed = sessionStorage.getItem(`ys_outcome_${data.conversation.id}`);
      if (dismissed) return false;
    }
    const lastAt = new Date(data.conversation.lastMessageAt).getTime();
    return Date.now() - lastAt > IDLE_MS;
  }, [data]);

  const closeOutcomePrompt = () => {
    if (data) {
      sessionStorage.setItem(`ys_outcome_${data.conversation.id}`, "1");
    }
  };

  if (sessionPending) {
    return (
      <main
        className={
          isSplit
            ? "flex h-full min-h-48 flex-1 items-center justify-center p-4"
            : "mx-auto w-full max-w-6xl py-8"
        }
      >
        <p className="text-muted-foreground">{t("loading")}</p>
      </main>
    );
  }

  if (!session?.user) {
    return (
      <main className="mx-auto w-full max-w-6xl py-8 text-center">
        <h1 className="text-lg font-semibold">{t("messages")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("signInToViewMessages")}</p>
        <Button className="mt-6" onClick={() => openAuth()}>
          {t("account")}
        </Button>
      </main>
    );
  }

  if (isLoading || !data) {
    return (
      <main
        className={
          isSplit
            ? "flex h-full min-h-48 flex-1 items-center justify-center p-4"
            : "mx-auto w-full max-w-6xl py-8"
        }
      >
        <p className="text-muted-foreground">{t("loading")}</p>
      </main>
    );
  }

  if (error) {
    return (
      <main
        className={
          isSplit
            ? "flex h-full min-h-48 flex-1 items-center justify-center p-4"
            : "mx-auto w-full max-w-6xl py-8"
        }
      >
        <p className="text-destructive">{error instanceof Error ? error.message : t("errorGeneric")}</p>
      </main>
    );
  }

  const onSend = () => {
    const text = draft.trim();
    if (!text || send.isPending) return;
    setDraft("");
    send.mutate({ kind: "text", body: text });
  };

  const headerSubtitle = backContext === "seller" && isSplit ? data.otherUserName : undefined;

  const mainClasses = isSplit
    ? "flex h-full min-h-0 w-full min-w-0 flex-1 flex-col bg-background"
    : "mx-auto flex min-h-[70vh] w-full max-w-6xl flex-col pb-8 pt-4";

  return (
    <main className={mainClasses}>
      {!isSplit ? (
        <div className="mb-4 flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link to={backTo} params={{ locale }}>
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <span className="text-sm text-muted-foreground">
            {backContext === "seller" ? t("messages") : t("inbox")}
          </span>
        </div>
      ) : null}

      <ChatHeader
        listingName={data.listing.name}
        imageUrl={assetUrl(data.listing.imageUrl)}
        shopName={data.shop.name}
        estimatedMinutes={data.shop.estimatedReplyMinutes}
        leadingSubtitle={headerSubtitle}
        variant={isSplit ? "split" : "default"}
        showMobileBack={isSplit && !isLg}
        mobileBack={isSplit ? { to: backTo } : undefined}
      />

      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col gap-3",
          isSplit
            ? "min-h-0 flex-1 overflow-y-auto bg-muted/15 px-2 py-2 sm:px-4"
            : "mt-4 min-h-[200px] rounded-lg border border-border/80 bg-muted/20 p-3",
        )}
      >
        {data.messages.map((m, i) => {
          const prev = data.messages[i - 1];
          const showDay = !prev || dayKey(prev.createdAt) !== dayKey(m.createdAt);
          return (
            <Fragment key={m.id}>
              {showDay ? (
                <div className="flex items-center justify-center py-1">
                  <span className="rounded-full border border-border/60 bg-white/90 px-3 py-0.5 text-[11px] font-medium text-muted-foreground shadow-sm">
                    {dayDividerLabel(m.createdAt, locale, t)}
                  </span>
                </div>
              ) : null}
              {m.kind === "agreement_nudge" ? (
                <AgreementNudgeCard
                  body={m.body}
                  meta={m.meta}
                  onSelect={(body, key) =>
                    send.mutate({
                      kind: "quick_action",
                      body,
                      meta: { actionKey: key, fromNudge: true },
                    })
                  }
                />
              ) : (
                <MessageBubble
                  m={m}
                  selfId={userId ?? ""}
                  variant={isSplit ? "split" : "default"}
                  locale={locale}
                  otherLabel={data.otherUserName}
                />
              )}
            </Fragment>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className={cn("shrink-0", isSplit ? "border-t border-border/60 bg-background p-2 sm:p-3" : "")}>
        <QuickActionsBar
          role={data.role}
          disabled={send.isPending}
          onPick={(body, meta) => send.mutate({ kind: "quick_action", body, meta })}
          className={isSplit ? "mt-0" : undefined}
        />

        {isSplit ? (
          <div className="mt-2 flex items-end gap-1 rounded-2xl border border-border/80 bg-white px-1 py-1 pl-2 shadow-sm">
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), onSend())}
              placeholder="Aa"
              className="min-h-9 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/70"
            />
            <div className="flex shrink-0 items-center">
              <Button type="button" size="icon" variant="ghost" className="size-9 text-muted-foreground" aria-label="Emoji">
                <Smile className="size-4" />
              </Button>
              <Button type="button" size="icon" variant="ghost" className="size-9 text-muted-foreground" aria-label="More">
                <MoreHorizontal className="size-4" />
              </Button>
              <Button type="button" size="icon" variant="ghost" className="size-9 text-muted-foreground" aria-label="Attach">
                <Paperclip className="size-4" />
              </Button>
              <Button type="button" size="icon" variant="ghost" className="size-9 text-muted-foreground" aria-label="Image">
                <ImageIcon className="size-4" />
              </Button>
            </div>
            <Button
              type="button"
              size="icon"
              className="shrink-0 rounded-xl"
              onClick={onSend}
              disabled={send.isPending || !draft.trim()}
            >
              <Send className="size-4" />
            </Button>
          </div>
        ) : (
          <div className="mt-3 flex gap-2">
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), onSend())}
              placeholder={t("typeMessage")}
              className="min-h-10 flex-1 rounded-md border border-border bg-white px-3 py-2 text-sm"
            />
            <Button type="button" size="icon" onClick={onSend} disabled={send.isPending || !draft.trim()}>
              <Send className="size-4" />
            </Button>
          </div>
        )}
      </div>

      <OutcomeSheet
        open={showOutcome}
        onOpenChange={(open) => {
          if (!open) closeOutcomePrompt();
        }}
        onYes={() => {
          if (data) sessionStorage.setItem(`ys_outcome_${data.conversation.id}`, "1");
          void setOutcome.mutateAsync("purchased");
        }}
        onNo={(reason) => {
          if (data) sessionStorage.setItem(`ys_outcome_${data.conversation.id}`, "1");
          void setOutcome.mutateAsync(reason);
        }}
        listingSlug={data.listing.slug}
      />
    </main>
  );
}

function MessageBubble(props: {
  m: ConversationMessageDto;
  selfId: string;
  variant: "default" | "split";
  locale: Locale;
  otherLabel: string;
}) {
  const { m, selfId, variant, locale, otherLabel } = props;
  const { t } = useTranslation("common");
  const isSelf = m.senderUserId === selfId;
  const isSplit = variant === "split";

  const bubble = (
    <div
      className={cn(
        "max-w-[min(85%,20rem)] rounded-2xl px-3.5 py-2 text-sm",
        isSelf ? "bg-primary text-primary-foreground" : "bg-white text-foreground shadow-sm",
        m.kind === "quick_action" &&
          "border border-dashed border-primary/40 bg-primary/5 text-foreground shadow-none",
        m.kind === "intent" && "border border-border bg-amber-50/80",
      )}
    >
      {m.kind === "quick_action" && (
        <p
          className={cn(
            "mb-1 text-[10px] font-semibold uppercase tracking-wide",
            isSelf ? "text-primary-foreground/80" : "text-muted-foreground",
          )}
        >
          {t("quickAction")}
        </p>
      )}
      <p className="whitespace-pre-wrap wrap-break-word">{m.body}</p>
    </div>
  );

  if (!isSplit) {
    return (
      <div
        className={cn("flex", isSelf ? "justify-end" : "justify-start")}
      >
        {bubble}
      </div>
    );
  }

  if (isSelf) {
    return (
      <div className="flex flex-col items-end gap-0.5">
        {bubble}
        {isSplit ? (
          <span className="text-[10px] text-muted-foreground">{timeShort(m.createdAt, locale)}</span>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-full gap-2">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <User className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-0.5 flex flex-wrap items-baseline gap-2">
          <span className="text-xs font-semibold text-foreground">{otherLabel}</span>
          <span className="text-[10px] text-muted-foreground">{timeShort(m.createdAt, locale)}</span>
        </div>
        {bubble}
      </div>
    </div>
  );
}
