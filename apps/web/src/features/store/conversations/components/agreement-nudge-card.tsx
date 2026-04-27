import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ACTIONS = [
  { key: "pick_cod", labelKey: "payCod" as const },
  { key: "pick_bank", labelKey: "payBank" as const },
  { key: "pick_mobile", labelKey: "payMobile" as const },
  { key: "share_phone", labelKey: "sharePhone" as const },
  { key: "share_address", labelKey: "shareAddress" as const },
] as const;

export function AgreementNudgeCard(props: {
  body: string;
  meta: unknown;
  onSelect: (body: string, key: string) => void;
  className?: string;
}) {
  const { body, onSelect, className } = props;
  const { t } = useTranslation("common");
  return (
    <div
      className={cn("mx-auto w-full max-w-md rounded-xl border border-primary/30 bg-primary/5 p-4", className)}
    >
      <p className="text-sm font-semibold text-foreground">{t("agreementReadyTitle")}</p>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {ACTIONS.map((a) => (
          <Button
            key={a.key}
            type="button"
            size="sm"
            variant="secondary"
            className="text-xs"
            onClick={() =>
              onSelect(t(a.labelKey), a.key)
            }
          >
            {t(a.labelKey)}
          </Button>
        ))}
      </div>
    </div>
  );
}
