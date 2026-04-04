import { useEffect, useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  CATEGORY_SORT_OPTIONS,
  type CategorySort,
} from "@/features/category/category.queries";
import { promotionsListQuery } from "@/features/promotions/promotions.queries";
import { categoriesQuery } from "@/features/storefront";
import { cn } from "@/lib/utils";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[15px] font-semibold leading-tight text-foreground">
      {children}
    </h3>
  );
}

export type CategoryApplyFilters = {
  categorySlug: string;
  tagSlugs: string[];
  promotionSlug?: string;
  sort: CategorySort;
};

export function CategoryFilterDrawer({
  currentCategorySlug,
  trigger,
  tags,
  selectedTagSlugs,
  selectedPromotionSlug,
  sort,
  onApplyFilters,
}: {
  currentCategorySlug: string;
  trigger: React.ReactNode;
  tags: { slug: string; name: string }[];
  selectedTagSlugs: string[];
  selectedPromotionSlug?: string;
  sort: CategorySort;
  onApplyFilters: (filters: CategoryApplyFilters) => void;
}) {
  const { data: categoriesData } = useQuery(categoriesQuery());
  const { data: promotionsData } = useQuery(promotionsListQuery());
  const categories = categoriesData?.categories ?? [];
  const [draftCategorySlug, setDraftCategorySlug] = useState(currentCategorySlug);
  const draftCategory = categories.find((c) => c.slug === draftCategorySlug);
  const categoryTriggerLabel = draftCategory?.name ?? "Select category";

  const [open, setOpen] = useState(false);
  const [draftTagSlugs, setDraftTagSlugs] = useState<string[]>(selectedTagSlugs);
  const [draftPromotionSlug, setDraftPromotionSlug] = useState<string | undefined>(
    selectedPromotionSlug,
  );
  const [draftSort, setDraftSort] = useState<CategorySort>(sort);

  useEffect(() => {
    if (open) {
      setDraftCategorySlug(currentCategorySlug);
      setDraftTagSlugs(selectedTagSlugs);
      setDraftPromotionSlug(selectedPromotionSlug);
      setDraftSort(sort);
    }
  }, [open, currentCategorySlug, selectedTagSlugs, selectedPromotionSlug, sort]);

  const handleCancel = () => {
    setOpen(false);
  };

  const handleApply = () => {
    onApplyFilters({
      categorySlug: draftCategorySlug || currentCategorySlug,
      tagSlugs: draftTagSlugs,
      promotionSlug: draftPromotionSlug,
      sort: draftSort,
    });
    setOpen(false);
  };

  const promotionRadioValue = draftPromotionSlug ?? "_all";

  /** Portaled dropdown content sits outside the drawer in the DOM; without this, Vaul treats those clicks as “outside” and closes the drawer. */
  const handleDrawerInteractOutside = (event: Event) => {
    const target = event.target as HTMLElement | null;
    if (
      target?.closest?.("[data-slot=dropdown-menu-content]") ||
      target?.closest?.("[data-slot=dropdown-menu-sub-content]")
    ) {
      event.preventDefault();
    }
  };

  return (
    <Drawer direction="left" open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>{trigger}</DrawerTrigger>
      <DrawerContent
        className={cn(
          "h-dvh max-h-dvh w-[min(100vw,90vw)] max-w-none gap-0 rounded-none border-r p-0 sm:max-w-md",
          "flex flex-col data-[vaul-drawer-direction=left]:mt-0",
        )}
        onPointerDownOutside={handleDrawerInteractOutside}
        onFocusOutside={handleDrawerInteractOutside}
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
              <SectionTitle>Category</SectionTitle>
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex h-9 w-full max-w-full justify-between gap-2 rounded-lg border-border px-3 text-sm font-normal"
                    aria-label="Choose category"
                  >
                    <span className="min-w-0 truncate text-left">{categoryTriggerLabel}</span>
                    <ChevronDown className="size-4 shrink-0 opacity-60" aria-hidden />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="max-h-60 min-w-(--radix-dropdown-menu-trigger-width) overflow-y-auto"
                >
                  <DropdownMenuRadioGroup
                    value={
                      categories.some((c) => c.slug === draftCategorySlug)
                        ? draftCategorySlug
                        : ""
                    }
                    onValueChange={(slug) => {
                      setDraftCategorySlug(slug);
                    }}
                  >
                    {categories.map((cat) => (
                      <DropdownMenuRadioItem key={cat.id} value={cat.slug}>
                        {cat.name}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </section>

            <section className="space-y-4">
              <SectionTitle>Sort</SectionTitle>
              <RadioGroup
                value={draftSort}
                onValueChange={(v) => setDraftSort(v as CategorySort)}
                className="gap-3"
              >
                {CATEGORY_SORT_OPTIONS.map((opt) => (
                  <div key={opt.value} className="flex items-center gap-3">
                    <RadioGroupItem value={opt.value} id={`sort-${opt.value}`} />
                    <Label htmlFor={`sort-${opt.value}`} className="font-normal">
                      {opt.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </section>

            {(promotionsData?.promotions ?? []).length > 0 && (
              <section className="space-y-4">
                <SectionTitle>Promotion</SectionTitle>
                <RadioGroup
                  value={promotionRadioValue}
                  onValueChange={(v) =>
                    setDraftPromotionSlug(v === "_all" ? undefined : v)
                  }
                  className="gap-3"
                >
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value="_all" id="promo-all" />
                    <Label htmlFor="promo-all" className="font-normal">
                      All products
                    </Label>
                  </div>
                  {(promotionsData?.promotions ?? []).map((p) => (
                    <div key={p.slug} className="flex items-center gap-3">
                      <RadioGroupItem value={p.slug} id={`promo-${p.slug}`} />
                      <Label htmlFor={`promo-${p.slug}`} className="font-normal">
                        <span className="font-medium">{p.title}</span>
                        {p.badgeLabel ? (
                          <span className="ml-2 text-muted-foreground">
                            ({p.badgeLabel})
                          </span>
                        ) : null}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </section>
            )}

            {tags.length > 0 && (
              <section className="space-y-4">
                <SectionTitle>Tags</SectionTitle>
                <div className="space-y-4">
                  {tags.map((t) => (
                    <div key={t.slug} className="flex items-center gap-3">
                      <Checkbox
                        id={`tag-${t.slug}`}
                        checked={draftTagSlugs.includes(t.slug)}
                        onCheckedChange={(v) =>
                          setDraftTagSlugs((prev) =>
                            v === true
                              ? prev.includes(t.slug)
                                ? prev
                                : [...prev, t.slug]
                              : prev.filter((s) => s !== t.slug),
                          )
                        }
                      />
                      <Label htmlFor={`tag-${t.slug}`} className="font-normal">
                        {t.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </ScrollArea>

        <div className="shrink-0 bg-background">
          <Separator />
          <div className="flex gap-2 p-4">
            <Button
              type="button"
              variant="outline"
              size="default"
              className="flex-1 rounded-full border-border"
              onClick={handleCancel}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="default"
              size="default"
              className="flex-1 rounded-full"
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
