import { useEffect, useLayoutEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNavigate } from "@tanstack/react-router";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createConversationMutationOptions } from "@/features/store/conversations/conversations.queries";
import { cn } from "@/lib/utils";
import type { Locale } from "@ys/intl";

const DEFAULT_INTENT = `Hi, I'm interested in this item. Is it available? What's the final price including delivery?`;

const MOBILE_MAX_PX = 767;

type IntentKey = "default" | "available" | "price" | "delivery" | "custom";

const intentTemplates: Record<IntentKey, (opts: { name: string; quantity: number; location: string }) => string> = {
  default: () => DEFAULT_INTENT,
  available: () => `Is this item still available?`,
  price: () => `What's the final price for this item?`,
  delivery: ({ location }) =>
    `Do you deliver?${location ? ` My area: ${location}.` : " What's the delivery cost?"}`,
  custom: () => DEFAULT_INTENT,
};

function useMessageDrawerDirection(): "bottom" | "right" {
  const [direction, setDirection] = useState<"bottom" | "right">(
    () =>
      typeof window === "undefined"
        ? "bottom"
        : window.innerWidth <= MOBILE_MAX_PX
          ? "bottom"
          : "right",
  );

  useLayoutEffect(() => {
    const update = () => {
      setDirection(window.innerWidth <= MOBILE_MAX_PX ? "bottom" : "right");
    };
    update();
    const mql = window.matchMedia(`(max-width: ${MOBILE_MAX_PX}px)`);
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  return direction;
}

export function IntentSheet(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listingId: string;
  listingName: string;
  variantLabel?: string;
  quantity: number;
  locale: Locale;
}) {
  const { t } = useTranslation("common");
  const { open, onOpenChange, listingId, listingName, variantLabel, quantity, locale } = props;
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [intentKey, setIntentKey] = useState<IntentKey>("default");
  const [extraLocation, setExtraLocation] = useState("");
  const [customLine, setCustomLine] = useState("");
  const direction = useMessageDrawerDirection();

  const { mutate, reset, isPending, isError, error } = useMutation(
    createConversationMutationOptions(queryClient, locale, (conversationId) => {
      onOpenChange(false);
      void navigate({
        to: "/$locale/messages/$conversationId",
        params: { locale, conversationId },
      });
    }),
  );

  useEffect(() => {
    if (open) {
      reset();
    }
  }, [open, reset]);

  const composedBody = (() => {
    const line = customLine.trim();
    const namePart = `About "${listingName}"${variantLabel ? ` (${variantLabel})` : ""} — Qty: ${quantity}.`;
    if (intentKey === "custom" && line) {
      return `${namePart}\n\n${line}`;
    }
    if (intentKey === "default") {
      return `${namePart}\n\n${DEFAULT_INTENT}`;
    }
    return `${namePart}\n\n${intentTemplates[intentKey]({
      name: listingName,
      quantity,
      location: extraLocation.trim(),
    })}`;
  })();

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      direction={direction}
      shouldScaleBackground={direction === "bottom"}
    >
      <DrawerContent
        className={cn(
          "flex max-h-[min(90dvh,900px)] flex-col gap-0 overflow-hidden p-0",
          direction === "right" &&
            "h-dvh max-h-dvh w-full max-w-md! rounded-none border-l shadow-2xl",
          direction === "bottom" && "max-h-[90dvh] rounded-t-2xl border-t",
        )}
      >
        <div
          data-vaul-no-drag
          className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
        >
        <DrawerHeader
          className={cn(
            "shrink-0 space-y-1.5 border-b border-border/70 bg-muted/20 px-5 pb-4 pt-5 text-left",
            "group-data-[vaul-drawer-direction=bottom]/drawer-content:pt-2",
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1.5 pr-1">
              <DrawerTitle className="text-left text-lg font-semibold leading-tight">
                {t("messageSellerIntentTitle")}
              </DrawerTitle>
              <DrawerDescription className="text-left text-sm leading-relaxed">
                {t("messageSellerIntentSubtitle")}
              </DrawerDescription>
            </div>
            <DrawerClose asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0 text-muted-foreground"
                aria-label={t("close", { defaultValue: "Close" })}
              >
                <X className="h-4 w-4" />
              </Button>
            </DrawerClose>
          </div>
        </DrawerHeader>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-y-contain px-5 py-5">
          {isError ? (
            <p
              role="alert"
              className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive"
            >
              {error instanceof Error ? error.message : t("errorGeneric")}
            </p>
          ) : null}
          <div className="space-y-2.5">
            <p className="text-sm font-medium text-foreground">{t("whatDoYouWantToAsk")}</p>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["default", t("intentDefault")],
                  ["available", t("intentAvailable")],
                  ["price", t("intentFinalPrice")],
                  ["delivery", t("intentDelivery")],
                  ["custom", t("intentCustom")],
                ] as [IntentKey, string][]
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setIntentKey(key)}
                  className={cn(
                    "rounded-full border px-3.5 py-2 text-left text-sm font-medium transition-colors",
                    intentKey === key
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border text-muted-foreground hover:border-foreground/25 hover:text-foreground",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {intentKey === "delivery" && (
            <div className="space-y-2">
              <Label htmlFor="message-intent-loc" className="text-sm">
                {t("deliveryLocationOptional")}
              </Label>
              <Input
                id="message-intent-loc"
                value={extraLocation}
                onChange={(e) => setExtraLocation(e.target.value)}
                placeholder={t("cityOrAreaPlaceholder")}
                className="h-10"
              />
            </div>
          )}

          {intentKey === "custom" && (
            <div className="space-y-2">
              <Label htmlFor="message-intent-custom" className="text-sm">
                {t("yourMessage")}
              </Label>
              <Textarea
                id="message-intent-custom"
                value={customLine}
                onChange={(e) => setCustomLine(e.target.value)}
                rows={4}
                placeholder={t("typeYourQuestion")}
                className="min-h-[100px] resize-y"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">{t("preview")}</Label>
            <p className="whitespace-pre-wrap rounded-lg border border-border/80 bg-muted/50 px-3.5 py-3 text-sm leading-relaxed text-foreground/90">
              {composedBody}
            </p>
          </div>
        </div>

        <DrawerFooter className="shrink-0 border-t border-border/70 bg-background px-5 py-4">
          <Button
            type="button"
            className="h-12 w-full text-base font-medium"
            size="lg"
            disabled={isPending}
            onClick={() =>
              mutate({
                listingId,
                initialMessage: composedBody,
                intentKind: intentKey,
              })
            }
          >
            {isPending ? t("sending") : t("openConversation")}
          </Button>
        </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
