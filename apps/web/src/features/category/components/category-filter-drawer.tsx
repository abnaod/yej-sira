import { useEffect, useState } from "react";
import { ChevronRight, Star, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const initialFilters = {
  categoryLabel: "Jewelry",
  specialOffers: {
    freeDelivery: false,
    onSale: false,
    starSeller: false,
  },
  etsyBest: {
    etsyPick: false,
    starSeller: false,
  },
  readyToShip: {
    oneDay: false,
    threeDays: false,
    sevenDays: false,
  },
  shopLocation: "anywhere" as "anywhere" | "local" | "custom",
  customLocation: "",
  itemFormat: "any" as "any" | "physical" | "digital",
};

type FilterState = typeof initialFilters;

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[15px] font-semibold leading-tight text-foreground">
      {children}
    </h3>
  );
}

function StarSellerLabel() {
  return (
    <div className="flex flex-col gap-1">
      <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
        <Star
          className="size-4 shrink-0 fill-violet-600 text-violet-600"
          aria-hidden
        />
        Star Seller
      </span>
      <p className="text-xs leading-snug text-muted-foreground">
        This shop consistently earned 5-star reviews, dispatched on time, and
        replied quickly to any messages they received.
      </p>
    </div>
  );
}

export function CategoryFilterDrawer({
  categoryLabel = initialFilters.categoryLabel,
  trigger,
}: {
  categoryLabel?: string;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [applied, setApplied] = useState<FilterState>(() => ({
    ...initialFilters,
    categoryLabel,
  }));
  const [draft, setDraft] = useState<FilterState>(() => ({
    ...initialFilters,
    categoryLabel,
  }));

  useEffect(() => {
    setApplied((a) => ({ ...a, categoryLabel }));
  }, [categoryLabel]);

  useEffect(() => {
    setDraft(applied);
  }, [open, applied]);

  const handleCancel = () => {
    setOpen(false);
  };

  const handleApply = () => {
    setApplied(draft);
    setOpen(false);
  };

  return (
    <Drawer direction="left" open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>{trigger}</DrawerTrigger>
      <DrawerContent
        className={cn(
          "h-dvh max-h-dvh w-[min(100vw,90vw)] max-w-none gap-0 rounded-none border-r p-0 sm:max-w-md",
          "flex flex-col data-[vaul-drawer-direction=left]:mt-0",
        )}
      >
        <DrawerHeader className="shrink-0 flex-row items-start justify-between gap-4 border-b border-border px-5 pb-4 pt-5">
          <DrawerTitle className="font-serif text-3xl font-normal tracking-tight text-foreground">
            Filters
          </DrawerTitle>
          <DrawerClose asChild>
            <button
              type="button"
              className="rounded-full p-2 text-foreground transition-colors hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              aria-label="Close filters"
            >
              <X className="size-5" />
            </button>
          </DrawerClose>
        </DrawerHeader>

        <ScrollArea className="min-h-0 flex-1">
          <div className="space-y-8 px-5 py-6">
            <section className="space-y-3">
              <SectionTitle>Filter by category</SectionTitle>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 rounded-2xl border border-border bg-background px-4 py-3 text-left text-sm font-medium text-foreground transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                <span>{draft.categoryLabel}</span>
                <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
              </button>
            </section>

            <section className="space-y-4">
              <SectionTitle>Special offers</SectionTitle>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="free-delivery"
                    checked={draft.specialOffers.freeDelivery}
                    onCheckedChange={(v) =>
                      setDraft((d) => ({
                        ...d,
                        specialOffers: {
                          ...d.specialOffers,
                          freeDelivery: v === true,
                        },
                      }))
                    }
                    className="mt-0.5"
                  />
                  <Label htmlFor="free-delivery" className="font-normal">
                    Free delivery
                  </Label>
                </div>
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="on-sale"
                    checked={draft.specialOffers.onSale}
                    onCheckedChange={(v) =>
                      setDraft((d) => ({
                        ...d,
                        specialOffers: { ...d.specialOffers, onSale: v === true },
                      }))
                    }
                    className="mt-0.5"
                  />
                  <Label htmlFor="on-sale" className="font-normal">
                    On sale
                  </Label>
                </div>
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="so-star-seller"
                    checked={draft.specialOffers.starSeller}
                    onCheckedChange={(v) =>
                      setDraft((d) => ({
                        ...d,
                        specialOffers: {
                          ...d.specialOffers,
                          starSeller: v === true,
                        },
                      }))
                    }
                    className="mt-0.5"
                  />
                  <Label htmlFor="so-star-seller" className="font-normal">
                    <StarSellerLabel />
                  </Label>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <SectionTitle>Etsy&apos;s best</SectionTitle>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="etsy-pick"
                    checked={draft.etsyBest.etsyPick}
                    onCheckedChange={(v) =>
                      setDraft((d) => ({
                        ...d,
                        etsyBest: { ...d.etsyBest, etsyPick: v === true },
                      }))
                    }
                    className="mt-0.5"
                  />
                  <Label htmlFor="etsy-pick" className="font-normal">
                    Etsy&apos;s Pick
                  </Label>
                </div>
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="eb-star-seller"
                    checked={draft.etsyBest.starSeller}
                    onCheckedChange={(v) =>
                      setDraft((d) => ({
                        ...d,
                        etsyBest: { ...d.etsyBest, starSeller: v === true },
                      }))
                    }
                    className="mt-0.5"
                  />
                  <Label htmlFor="eb-star-seller" className="font-normal">
                    <StarSellerLabel />
                  </Label>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <SectionTitle>Ready to ship in</SectionTitle>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="ship-1"
                    checked={draft.readyToShip.oneDay}
                    onCheckedChange={(v) =>
                      setDraft((d) => ({
                        ...d,
                        readyToShip: { ...d.readyToShip, oneDay: v === true },
                      }))
                    }
                    className="mt-0.5"
                  />
                  <Label htmlFor="ship-1" className="font-normal">
                    1 business day
                  </Label>
                </div>
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="ship-3"
                    checked={draft.readyToShip.threeDays}
                    onCheckedChange={(v) =>
                      setDraft((d) => ({
                        ...d,
                        readyToShip: {
                          ...d.readyToShip,
                          threeDays: v === true,
                        },
                      }))
                    }
                    className="mt-0.5"
                  />
                  <Label htmlFor="ship-3" className="font-normal">
                    3 business days
                  </Label>
                </div>
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="ship-7"
                    checked={draft.readyToShip.sevenDays}
                    onCheckedChange={(v) =>
                      setDraft((d) => ({
                        ...d,
                        readyToShip: {
                          ...d.readyToShip,
                          sevenDays: v === true,
                        },
                      }))
                    }
                    className="mt-0.5"
                  />
                  <Label htmlFor="ship-7" className="font-normal">
                    7 business days
                  </Label>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <SectionTitle>Shop location</SectionTitle>
              <RadioGroup
                value={draft.shopLocation}
                onValueChange={(v) =>
                  setDraft((d) => ({
                    ...d,
                    shopLocation: v as FilterState["shopLocation"],
                  }))
                }
                className="gap-4"
              >
                <div className="flex items-center gap-3">
                  <RadioGroupItem value="anywhere" id="loc-any" />
                  <Label htmlFor="loc-any" className="font-normal">
                    Anywhere
                  </Label>
                </div>
                <div className="flex items-center gap-3">
                  <RadioGroupItem value="local" id="loc-local" />
                  <Label htmlFor="loc-local" className="font-normal">
                    Local
                  </Label>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value="custom" id="loc-custom" />
                    <Label htmlFor="loc-custom" className="font-normal">
                      Custom
                    </Label>
                  </div>
                  {draft.shopLocation === "custom" && (
                    <Input
                      placeholder="Enter location"
                      value={draft.customLocation}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          customLocation: e.target.value,
                        }))
                      }
                      className="ml-7 rounded-xl border-border"
                    />
                  )}
                </div>
              </RadioGroup>
            </section>

            <section className="space-y-4 pb-2">
              <SectionTitle>Item format</SectionTitle>
              <RadioGroup
                value={draft.itemFormat}
                onValueChange={(v) =>
                  setDraft((d) => ({
                    ...d,
                    itemFormat: v as FilterState["itemFormat"],
                  }))
                }
                className="gap-4"
              >
                <div className="flex items-center gap-3">
                  <RadioGroupItem value="any" id="fmt-any" />
                  <Label htmlFor="fmt-any" className="font-normal">
                    Any item
                  </Label>
                </div>
                <div className="flex items-center gap-3">
                  <RadioGroupItem value="physical" id="fmt-physical" />
                  <Label htmlFor="fmt-physical" className="font-normal">
                    Physical items
                  </Label>
                </div>
                <div className="flex items-center gap-3">
                  <RadioGroupItem value="digital" id="fmt-digital" />
                  <Label htmlFor="fmt-digital" className="font-normal">
                    Digital items
                  </Label>
                </div>
              </RadioGroup>
            </section>
          </div>
        </ScrollArea>

        <div className="shrink-0 bg-background">
          <Separator />
          <div className="flex gap-3 p-4">
            <Button
              type="button"
              variant="outline"
              className="h-12 flex-1 rounded-full border-foreground/20 text-foreground"
              onClick={handleCancel}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="h-12 flex-1 rounded-full"
              onClick={handleApply}
            >
              Apply
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
