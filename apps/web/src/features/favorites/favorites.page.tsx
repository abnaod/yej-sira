import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";

import { useAuthDialog } from "@/components/auth";
import { Button } from "@/components/ui/button";
import { ListingCard } from "@/components/ui/listing-card";
import { addToCartMutationOptions } from "@/features/cart/cart.queries";
import { authClient } from "@/lib/auth-client";
import { useLocale } from "@/lib/locale-path";

import { favoritesQuery } from "./favorites.queries";

export function FavoritesPage() {
  const { data: session, isPending } = authClient.useSession();
  const { openAuth } = useAuthDialog();
  const locale = useLocale();

  if (isPending) {
    return (
      <main className="py-8">
        <p className="text-muted-foreground">Loading…</p>
      </main>
    );
  }

  if (!session?.user) {
    return (
      <main className="py-8">
        <h1 className="text-2xl font-semibold tracking-tight">Favorites</h1>
        <p className="mt-2 text-muted-foreground">
          Sign in to save listings and view them here.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button type="button" onClick={() => openAuth()}>
            Sign in
          </Button>
          <Button variant="outline" asChild>
            <Link to="/$locale" params={{ locale }}>
              Continue shopping
            </Link>
          </Button>
        </div>
      </main>
    );
  }

  return <FavoritesSignedIn />;
}

function FavoritesSignedIn() {
  const locale = useLocale();
  const queryClient = useQueryClient();
  const { data, isPending, isError, error } = useQuery(favoritesQuery(locale, true));
  const addToCart = useMutation(addToCartMutationOptions(queryClient, locale));

  if (isPending) {
    return (
      <main className="py-8">
        <p className="text-muted-foreground">Loading favorites…</p>
      </main>
    );
  }

  if (isError) {
    return (
      <main className="py-8">
        <p className="text-destructive">
          {error instanceof Error ? error.message : "Could not load favorites"}
        </p>
      </main>
    );
  }

  if (!data) {
    return null;
  }

  const { listings } = data;

  return (
    <main>
      <h1 className="text-2xl font-semibold tracking-tight">Favorites</h1>
      {listings.length > 0 && (
        <p className="mt-1 text-sm text-muted-foreground">
          {listings.length} saved {listings.length === 1 ? "item" : "items"}
        </p>
      )}

      {listings.length === 0 ? (
        <div className="mt-12 flex min-h-[min(40vh,320px)] flex-col items-center justify-center gap-4 px-4 text-center">
          <div
            className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground"
            aria-hidden
          >
            <Heart className="size-7" strokeWidth={1.5} />
          </div>
          <p className="max-w-sm text-sm text-muted-foreground leading-relaxed">
            You haven&apos;t saved anything yet. Tap the heart on a listing to add it
            here.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
          {listings.map((listing) => (
            <ListingCard
              key={listing.id}
              slug={listing.slug}
              defaultVariantId={listing.defaultVariantId}
              name={listing.name}
              price={listing.price}
              originalPrice={listing.originalPrice}
              description={listing.description}
              imageUrl={listing.imageUrl}
              rating={listing.rating}
              reviewCount={listing.reviewCount}
              shop={listing.shop}
              promotion={listing.promotion}
              onAddToCart={
                listing.defaultVariantId
                  ? () =>
                      addToCart.mutate({
                        variantId: listing.defaultVariantId!,
                        quantity: 1,
                        listingName: listing.name,
                      })
                  : undefined
              }
            />
          ))}
        </div>
      )}
    </main>
  );
}
