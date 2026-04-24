import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function QuickActionsBar(props: {
  role: "buyer" | "seller";
  disabled?: boolean;
  onPick: (body: string, meta?: Record<string, unknown>) => void;
  className?: string;
}) {
  const { role, disabled, onPick, className } = props;
  const { t } = useTranslation("common");
  if (role === "buyer") {
    return (
      <div className={cn("mt-2 flex flex-wrap gap-1.5", className)}>
        <span className="w-full text-[10px] font-medium uppercase text-muted-foreground">
          {t("quickActions")}
        </span>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8 text-xs"
          disabled={disabled}
          onClick={() => onPick(t("quickAskDiscount") + ".", { actionKey: "buyer_discount" })}
        >
          {t("quickAskDiscount")}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8 text-xs"
          disabled={disabled}
          onClick={() => onPick(t("quickConfirmAvailability") + "?", { actionKey: "buyer_stock" })}
        >
          {t("quickConfirmAvailability")}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8 text-xs"
          disabled={disabled}
          onClick={() => onPick(t("quickRequestDelivery") + "?", { actionKey: "buyer_delivery" })}
        >
          {t("quickRequestDelivery")}
        </Button>
      </div>
    );
  }
  return (
    <div
      className={cn("mt-2 flex max-w-full flex-nowrap items-center gap-1.5 overflow-x-auto pb-0.5", className)}
    >
      <span className="shrink-0 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
        {t("quickActions")}
      </span>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="h-7 shrink-0 rounded-full text-xs"
        disabled={disabled}
        onClick={() => onPick(t("sellerAvailable") + "!", { actionKey: "seller_available" })}
      >
        {t("sellerAvailable")}
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="h-7 shrink-0 rounded-full text-xs"
        disabled={disabled}
        onClick={() => onPick(t("sellerOutOfStock") + ".", { actionKey: "seller_ooo" })}
      >
        {t("sellerOutOfStock")}
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="h-7 shrink-0 rounded-full text-xs"
        disabled={disabled}
        onClick={() => onPick(t("sellerPriceIs") + " …", { actionKey: "seller_price" })}
      >
        {t("sellerPriceIs")}
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="h-7 shrink-0 rounded-full text-xs"
        disabled={disabled}
        onClick={() => onPick(t("sellerDeliveryAvailable") + ".", { actionKey: "seller_delivery" })}
      >
        {t("sellerDeliveryAvailable")}
      </Button>
    </div>
  );
}
