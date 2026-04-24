"use client";

import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useLocale } from "@/lib/locale-path";
import type { Locale } from "@ys/intl";

export function OutcomeSheet(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onYes: () => void;
  onNo: (reason: "no_response" | "price_too_high" | "changed_mind" | "other") => void;
  listingSlug: string;
}) {
  const { open, onOpenChange, onYes, onNo, listingSlug } = props;
  const { t } = useTranslation("common");
  const locale = useLocale() as Locale;
  const navigate = useNavigate();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="sm:mx-auto sm:max-w-md sm:rounded-t-xl">
        <SheetHeader>
          <SheetTitle>{t("outcomePromptTitle")}</SheetTitle>
          <SheetDescription>{t("outcomePromptDescription")}</SheetDescription>
        </SheetHeader>
        <div className="mt-4 flex flex-col gap-2">
          <Button
            type="button"
            onClick={() => {
              onYes();
              onOpenChange(false);
              void navigate({
                to: "/$locale/listings/$listingId",
                params: { locale, listingId: listingSlug },
                hash: "reviews" as never,
              });
            }}
          >
            {t("outcomeYes")}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onNo("no_response");
              onOpenChange(false);
            }}
          >
            {t("outcomeReasonNoReply")}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onNo("price_too_high");
              onOpenChange(false);
            }}
          >
            {t("outcomeReasonPrice")}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onNo("changed_mind");
              onOpenChange(false);
            }}
          >
            {t("outcomeReasonChangedMind")}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
