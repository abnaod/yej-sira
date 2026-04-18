import { Fragment } from "react";
import { ChevronRight, CreditCard, Truck, User, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

import type { CheckoutStep } from "../checkout.store";

const STEPS: {
  key: CheckoutStep;
  title: string;
  subtitle: string;
  Icon: LucideIcon;
}[] = [
  {
    key: "account",
    title: "Contact",
    subtitle: "Your details",
    Icon: User,
  },
  {
    key: "delivery",
    title: "Delivery",
    subtitle: "Method & address",
    Icon: Truck,
  },
  {
    key: "payment-method",
    title: "Payment",
    subtitle: "Pay securely",
    Icon: CreditCard,
  },
];

const STEP_ORDER = STEPS.map((s) => s.key);

interface CheckoutProgressBarProps {
  step: CheckoutStep;
  className?: string;
}

export function CheckoutProgressBar({ step, className }: CheckoutProgressBarProps) {
  const currentIndex = STEP_ORDER.indexOf(step);

  return (
    <div
      className={cn(
        "mb-8 w-full overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
      role="navigation"
      aria-label="Checkout steps"
    >
      <ol className="flex min-w-max list-none flex-wrap items-start justify-start gap-x-6 gap-y-4 p-0 sm:min-w-0 sm:w-full sm:gap-x-10">
        {STEPS.map((s, i) => {
          const isActive = i === currentIndex;
          const isCompleted = i < currentIndex;
          const Icon = s.Icon;

          const stepBody = (
            <>
              <div
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                  isCompleted && "border-primary bg-primary text-primary-foreground",
                  isActive && "border-primary bg-background text-primary",
                  !isCompleted && !isActive && "border-transparent bg-muted text-muted-foreground",
                )}
                aria-current={isActive ? "step" : undefined}
              >
                <Icon className="size-5" strokeWidth={1.75} aria-hidden />
              </div>
              <div className="min-w-0 pt-0.5">
                <p
                  className={cn(
                    "text-sm font-semibold leading-tight",
                    isActive && "text-primary",
                    !isActive && "text-foreground",
                  )}
                >
                  {s.title}
                </p>
                <p
                  className={cn(
                    "mt-0.5 text-xs",
                    isActive ? "text-primary/80" : "text-muted-foreground",
                  )}
                >
                  {s.subtitle}
                </p>
              </div>
            </>
          );

          if (i < STEPS.length - 1) {
            return (
              <Fragment key={s.key}>
                <li className="flex w-max items-start gap-3">{stepBody}</li>
                <li className="flex min-h-11 shrink-0 items-center self-center px-2 sm:px-3" aria-hidden>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground/70" strokeWidth={2} />
                </li>
              </Fragment>
            );
          }

          return (
            <li key={s.key} className="flex w-max items-start gap-3">
              {stepBody}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
