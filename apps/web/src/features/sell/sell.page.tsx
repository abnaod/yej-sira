import { Link } from "@tanstack/react-router";

export function SellPage() {
  return (
    <main className="mx-auto max-w-2xl py-12">
      <h1 className="font-serif text-3xl font-normal tracking-tight text-foreground md:text-4xl">
        Become a seller
      </h1>
      <p className="mt-4 text-muted-foreground leading-relaxed">
        We&apos;re building tools for Ethiopian makers and shops to list crafts,
        textiles, coffee, and more—reach buyers across the country and beyond.
        Join the waitlist and we&apos;ll reach out when onboarding opens.
      </p>
      <p className="mt-8 text-sm text-muted-foreground">
        In the meantime, explore{" "}
        <Link to="/" className="font-medium text-foreground underline underline-offset-4">
          the marketplace
        </Link>
        .
      </p>
    </main>
  );
}
