"use client";

import { useQuery } from "@tanstack/react-query";
import { MessageSquare, Timer } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { sellerMessageMetricsQuery } from "@/features/store/conversations/conversations.queries";
import { useLocale } from "@/lib/locale-path";
import type { Locale } from "@ys/intl";

export function SellerMessageMetricsCards() {
  const { t } = useTranslation("common");
  const locale = useLocale() as Locale;
  const q = useQuery(sellerMessageMetricsQuery(locale));
  if (q.isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="gap-2 py-4">
          <Skeleton className="h-20 w-full" />
        </Card>
        <Card className="gap-2 py-4">
          <Skeleton className="h-20 w-full" />
        </Card>
      </div>
    );
  }
  const m = q.data;
  const ratePct =
    m?.responseRate != null ? Math.round(m.responseRate * 100) : "—";
  const avg =
    m?.avgResponseSeconds != null
      ? m.avgResponseSeconds < 120
        ? `${m.avgResponseSeconds}s`
        : `${Math.round(m.avgResponseSeconds / 60)}m`
      : "—";
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card className="gap-2 py-4">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-0">
          <CardDescription>{t("leads")}</CardDescription>
          <MessageSquare className="size-4 text-primary" aria-hidden />
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-2xl font-semibold tabular-nums">{m?.leads ?? 0}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t("leadsDescription")}</p>
        </CardContent>
      </Card>
      <Card className="gap-2 py-4">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-0">
          <CardDescription>{t("responseRate")}</CardDescription>
          <Timer className="size-4 text-muted-foreground" aria-hidden />
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-2xl font-semibold tabular-nums">
            {ratePct}
            {m?.responseRate != null ? "%" : ""}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("avgFirstReply")}: {avg}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
