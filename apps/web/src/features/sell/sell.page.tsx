import type { Locale } from "@ys/intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { authClient } from "@/lib/auth-client";
import { useLocale } from "@/lib/locale-path";
import { createShopMutationOptions, myShopQuery } from "./sell.queries";

export function SellPage() {
  const locale = useLocale() as Locale;
  const queryClient = useQueryClient();
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const shopState = useQuery({
    ...myShopQuery(locale),
    enabled: !!session?.user,
  });

  const createShop = useMutation(createShopMutationOptions(queryClient, locale));
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");

  if (sessionPending) {
    return (
      <main className="mx-auto max-w-2xl py-12">
        <p className="text-muted-foreground">Loading…</p>
      </main>
    );
  }

  if (!session?.user) {
    return (
      <main className="mx-auto max-w-2xl py-12">
        <h1 className="font-serif text-3xl font-normal tracking-tight text-foreground md:text-4xl">
          Become a seller
        </h1>
        <p className="mt-4 text-muted-foreground leading-relaxed">
          Sign in to apply for a shop and list your products on Yej Sira.
        </p>
        <p className="mt-8 text-sm text-muted-foreground">
          Use <strong className="text-foreground">Account</strong> in the header to sign in or create
          an account.
        </p>
      </main>
    );
  }

  if (shopState.isLoading) {
    return (
      <main className="mx-auto max-w-2xl py-12">
        <p className="text-muted-foreground">Loading your shop…</p>
      </main>
    );
  }

  const shop = shopState.data?.shop;
  if (shop === undefined) {
    return null;
  }

  if (shop === null) {
    return (
      <main className="mx-auto max-w-2xl py-12">
        <h1 className="font-serif text-3xl font-normal tracking-tight text-foreground md:text-4xl">
          Apply to sell
        </h1>
        <p className="mt-4 text-muted-foreground leading-relaxed">
          Tell us about your shop. We review applications and will email you when your storefront is
          active.
        </p>
        <form
          className="mt-8 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            createShop.mutate({
              name: name.trim(),
              slug: slug.trim().toLowerCase(),
              description: description.trim() || undefined,
            });
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="shop-name">Shop name</Label>
            <Input
              id="shop-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={120}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="shop-slug">URL slug (kebab-case)</Label>
            <Input
              id="shop-slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
              placeholder="my-craft-studio"
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="shop-desc">Description (optional)</Label>
            <Textarea
              id="shop-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              maxLength={2000}
            />
          </div>
          {createShop.isError && (
            <p className="text-sm text-destructive">
              {(createShop.error as Error)?.message ?? "Something went wrong"}
            </p>
          )}
          <Button type="submit" disabled={createShop.isPending}>
            {createShop.isPending ? "Submitting…" : "Submit application"}
          </Button>
        </form>
      </main>
    );
  }

  if (shop.status === "pending") {
    return (
      <main className="mx-auto max-w-2xl py-12">
        <h1 className="font-serif text-3xl font-normal tracking-tight text-foreground md:text-4xl">
          Application received
        </h1>
        <p className="mt-4 text-muted-foreground leading-relaxed">
          Your shop <strong className="text-foreground">{shop.name}</strong> is pending review.
          We&apos;ll notify you when it&apos;s approved.
        </p>
      </main>
    );
  }

  if (shop.status === "rejected" || shop.status === "suspended") {
    return (
      <main className="mx-auto max-w-2xl py-12">
        <h1 className="font-serif text-3xl font-normal tracking-tight text-foreground md:text-4xl">
          Shop unavailable
        </h1>
        <p className="mt-4 text-muted-foreground leading-relaxed">
          This shop is {shop.status}. Contact support if you have questions.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl py-12">
      <h1 className="font-serif text-3xl font-normal tracking-tight text-foreground md:text-4xl">
        Your seller dashboard
      </h1>
      <p className="mt-4 text-muted-foreground leading-relaxed">
        Manage listings for <strong className="text-foreground">{shop.name}</strong>.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button asChild>
          <Link to="/$locale/sell/dashboard" params={{ locale }}>
            Open dashboard
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/$locale/shops/$shopSlug" params={{ locale, shopSlug: shop.slug }}>
            View storefront
          </Link>
        </Button>
      </div>
    </main>
  );
}
