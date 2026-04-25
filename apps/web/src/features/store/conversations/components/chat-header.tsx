import { Link } from "@tanstack/react-router";
import { ArrowLeft, MoreHorizontal, Phone, Video } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/locale-path";
import type { Locale } from "@ys/intl";

type MobileBack = {
  to: "/$locale/sell/messages" | "/$locale/messages";
};

export function ChatHeader(props: {
  listingName: string;
  imageUrl: string;
  shopName: string;
  estimatedMinutes: number;
  /** Replaces the shop + “usually replies” block (e.g. seller split: buyer’s name). */
  leadingSubtitle?: string;
  variant?: "default" | "split";
  showMobileBack?: boolean;
  mobileBack?: MobileBack;
}) {
  const {
    listingName,
    imageUrl,
    shopName,
    estimatedMinutes,
    leadingSubtitle,
    variant = "default",
    showMobileBack,
    mobileBack,
  } = props;
  const { t } = useTranslation("common");
  const locale = useLocale() as Locale;
  const split = variant === "split";

  if (split) {
    return (
      <div className="flex shrink-0 items-center gap-2 border-b border-border/60 bg-background/95 px-2 py-2 backdrop-blur-sm sm:px-3">
        {showMobileBack && mobileBack ? (
          <Button variant="ghost" size="icon" className="shrink-0 lg:hidden" asChild>
            <Link to={mobileBack.to} params={{ locale }}>
              <ArrowLeft className="size-5" />
            </Link>
          </Button>
        ) : null}
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border border-border/60 bg-muted">
            {imageUrl ? <img src={imageUrl} alt="" className="h-full w-full object-cover" /> : null}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-semibold tracking-tight text-foreground">{listingName}</p>
            <p className="truncate text-sm text-muted-foreground">
              {leadingSubtitle ?? shopName}
            </p>
          </div>
        </div>
        <div className="hidden shrink-0 items-center gap-0.5 sm:flex">
          <Button type="button" size="icon" variant="ghost" className="text-muted-foreground" aria-label="Call">
            <Phone className="size-4" />
          </Button>
          <Button type="button" size="icon" variant="ghost" className="text-muted-foreground" aria-label="Video">
            <Video className="size-4" />
          </Button>
          <Button type="button" size="icon" variant="ghost" className="text-muted-foreground" aria-label="More">
            <MoreHorizontal className="size-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 rounded-lg border border-border/80 bg-white p-3 shadow-sm">
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md bg-muted">
        {imageUrl ? <img src={imageUrl} alt="" className="h-full w-full object-cover" /> : null}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-foreground">{listingName}</p>
        <p className="truncate text-sm text-muted-foreground">{shopName}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {t("usuallyReplies", { minutes: estimatedMinutes })}
        </p>
      </div>
    </div>
  );
}
