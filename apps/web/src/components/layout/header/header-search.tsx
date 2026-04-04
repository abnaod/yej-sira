import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { Loader2, Search } from "lucide-react";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { StarRating } from "@/components/ui/star-rating";
import { productSearchQuery } from "@/features/storefront/storefront.queries";

const DEBOUNCE_MS = 280;
const MIN_CHARS = 2;

export function HeaderSearch() {
  const navigate = useNavigate();
  const [q, setQ] = React.useState("");
  const [debouncedQ, setDebouncedQ] = React.useState("");
  const [popoverOpen, setPopoverOpen] = React.useState(false);

  React.useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQ(q.trim()), DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [q]);

  const canSearch = debouncedQ.length >= MIN_CHARS;

  React.useEffect(() => {
    if (canSearch) setPopoverOpen(true);
  }, [canSearch, debouncedQ]);

  const { data, isPending, isError, error } = useQuery({
    ...productSearchQuery(debouncedQ),
    enabled: canSearch,
    staleTime: 30_000,
  });

  const products = data?.products ?? [];
  const showPanel = popoverOpen && canSearch;

  /** Clears cmdk highlight so the footer link hover does not keep the last item selected. */
  const [commandValue, setCommandValue] = React.useState("");

  React.useEffect(() => {
    setCommandValue("");
  }, [debouncedQ]);

  const goToSearchResults = React.useCallback(() => {
    const term = q.trim();
    if (term.length < MIN_CHARS) return;
    setPopoverOpen(false);
    void navigate({
      to: "/search",
      search: {
        q: term,
        sort: "relevancy",
        tagSlugs: "",
        promotionSlug: undefined,
      },
    });
  }, [navigate, q]);

  return (
    <div className="flex min-w-0 flex-1">
      <Popover open={showPanel} onOpenChange={setPopoverOpen} modal={false}>
        <PopoverAnchor asChild>
          <div className="relative min-w-0 w-full">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search for handmade, vintage, supplies…"
              className="pl-9 pr-3 shadow-none"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onFocus={() => setPopoverOpen(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  goToSearchResults();
                }
              }}
              aria-expanded={showPanel}
              aria-controls="header-search-results"
              autoComplete="off"
              type="search"
            />
          </div>
        </PopoverAnchor>
        <PopoverContent
          id="header-search-results"
          align="start"
          side="bottom"
          sideOffset={8}
          className="min-w-(--radix-popover-trigger-width) w-(--radix-popover-trigger-width) max-w-none flex flex-col gap-0 overflow-hidden p-0"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <Command
            shouldFilter={false}
            className="min-h-0"
            value={commandValue}
            onValueChange={setCommandValue}
          >
            <CommandList className="max-h-[min(60vh,320px)]">
              {isPending && (
                <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  Searching…
                </div>
              )}
              {!isPending && isError && (
                <div className="px-3 py-6 text-center text-sm text-destructive">
                  {error instanceof Error ? error.message : "Something went wrong"}
                </div>
              )}
              {!isPending && !isError && products.length === 0 && (
                <CommandEmpty>No products found.</CommandEmpty>
              )}
              {!isPending && !isError && products.length > 0 && (
                <CommandGroup heading="Products">
                  {products.map((product) => (
                    <CommandItem
                      key={product.slug}
                      value={`${product.slug} ${product.name}`}
                      className="cursor-pointer gap-3 px-2 py-2"
                      onSelect={() => {
                        setPopoverOpen(false);
                        setQ("");
                        setDebouncedQ("");
                        void navigate({
                          to: "/products/$productId",
                          params: { productId: product.slug },
                        });
                      }}
                    >
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md bg-neutral-100">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {product.name}
                        </p>
                        <StarRating
                          rating={product.rating}
                          reviewCount={product.reviewCount}
                        />
                      </div>
                      <div className="flex shrink-0 items-baseline gap-1.5 whitespace-nowrap">
                        <span className="text-sm font-semibold">
                          ${product.price.toFixed(2)}
                        </span>
                        {product.originalPrice != null &&
                          product.originalPrice > product.price && (
                            <span className="text-xs text-muted-foreground line-through">
                              ${product.originalPrice.toFixed(2)}
                            </span>
                          )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
          {canSearch && (
            <div
              className="relative z-10 shrink-0 bg-popover"
              onMouseEnter={() => setCommandValue("")}
            >
              <Separator />
              <Link
                to="/search"
                search={{
                  q: debouncedQ,
                  sort: "relevancy",
                  tagSlugs: "",
                  promotionSlug: undefined,
                }}
                className="block px-3 py-2.5 text-sm text-primary transition-colors hover:bg-accent hover:text-accent-foreground"
                onClick={() => setPopoverOpen(false)}
              >
                Results for{" "}
                <span className="font-medium">&ldquo;{debouncedQ}&rdquo;</span>
              </Link>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
