import type { Locale } from "@ys/intl";
import { useSuspenseQuery } from "@tanstack/react-query";

import { ListingListItem } from "@/components/ui/listing-list-item";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { moreFromShopListingsQuery } from "../listings.queries";
import { ListingReviewsSection } from "./listings-reviews-section";

interface ListingDetailTabsProps {
  locale: Locale;
  listingSlug: string;
  description: string;
  shopName: string;
  attributes: { key: string; label: string; displayValue: string }[];
}

export function ListingDetailTabs({
  locale,
  listingSlug,
  description,
  shopName,
  attributes,
}: ListingDetailTabsProps) {
  const { data: shopData } = useSuspenseQuery(
    moreFromShopListingsQuery(locale, listingSlug),
  );

  return (
    <section className="mt-10">
      <Tabs defaultValue="description" className="w-full gap-6">
        <TabsList
          variant="line"
          className="h-auto min-h-0 w-full min-w-0 flex-wrap items-end justify-start gap-x-1 gap-y-0 rounded-none border-b border-border bg-transparent p-0"
        >
          <TabsTrigger
            value="description"
            className="flex-none justify-start rounded-none px-3 py-3 text-base data-[state=active]:shadow-none"
          >
            Description
          </TabsTrigger>
          <TabsTrigger
            value="reviews"
            className="flex-none justify-start rounded-none px-3 py-3 text-base data-[state=active]:shadow-none"
          >
            Reviews
          </TabsTrigger>
          <TabsTrigger
            value="more-from-shop"
            className="flex-none justify-start rounded-none px-3 py-3 text-base data-[state=active]:shadow-none"
          >
            More from this shop
          </TabsTrigger>
        </TabsList>

        <TabsContent value="description" className="mt-0">
          {attributes.filter((a) => a.displayValue.trim()).length > 0 && (
            <dl className="mb-8 grid max-w-3xl gap-x-8 gap-y-3 sm:grid-cols-2">
              {attributes
                .filter((a) => a.displayValue.trim())
                .map((a) => (
                  <div key={a.key} className="border-b border-border/70 pb-3">
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {a.label}
                    </dt>
                    <dd className="mt-1 text-sm text-foreground">{a.displayValue}</dd>
                  </div>
                ))}
            </dl>
          )}
          {description.trim() ? (
            <p className="max-w-3xl whitespace-pre-wrap text-sm leading-relaxed text-foreground md:text-base">
              {description}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              No description has been added for this listing yet.
            </p>
          )}
        </TabsContent>

        <TabsContent value="reviews" className="mt-0">
          <ListingReviewsSection
            locale={locale}
            listingSlug={listingSlug}
            embedded
          />
        </TabsContent>

        <TabsContent value="more-from-shop" className="mt-0">
          <p className="mb-4 text-sm text-muted-foreground">
            Other listings from{" "}
            <span className="font-medium text-foreground">{shopName}</span>.
          </p>
          {shopData.listings.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No other listings from this shop right now.
            </p>
          ) : (
            <div className="space-y-2">
              {shopData.listings.map((p) => (
                <ListingListItem
                  key={p.id}
                  id={p.slug}
                  name={p.name}
                  price={p.price}
                  originalPrice={p.originalPrice}
                  imageUrl={p.imageUrl}
                  rating={p.rating}
                  reviewCount={p.reviewCount}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </section>
  );
}
