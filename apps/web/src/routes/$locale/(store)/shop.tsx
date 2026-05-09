import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { Globe, Mail, Phone, RotateCcw, Truck } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { assetUrl } from "@/lib/api";
import { useActiveStorefrontShop } from "@/lib/storefront-context";
import type { PublicStorefrontShop } from "@/lib/storefront";

export const Route = createFileRoute("/$locale/(store)/shop")({
  component: ShopDetailsPage,
});

function shopInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  return name.slice(0, 2).toUpperCase() || "?";
}

function socialLinks(shop: PublicStorefrontShop) {
  if (!shop.socialLinks || typeof shop.socialLinks !== "object") return [];
  const entries = Object.entries(shop.socialLinks as Record<string, unknown>);
  return entries
    .filter(
      (entry): entry is [string, string] =>
        typeof entry[1] === "string" && entry[1].trim().length > 0,
    )
    .map(([label, url]) => ({ label, url }));
}

function ShopDetailsPage() {
  const { locale } = Route.useParams();
  const shop = useActiveStorefrontShop();

  useEffect(() => {
    if (shop) document.title = `${shop.name} details · YEJSIRA`;
  }, [shop]);

  if (!shop) return <Navigate to="/$locale" params={{ locale }} />;

  const links = socialLinks(shop);
  const hasContact = shop.contactEmail || shop.contactPhone || links.length > 0;

  return (
    <main className="pb-12">
      <section className="flex flex-col gap-8 md:grid md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:items-start">
        <div className="space-y-5">
          <div
            className={`flex size-28 items-center justify-center overflow-hidden rounded-sm text-2xl font-semibold sm:size-32${shop.imageUrl ? "" : " bg-muted text-muted-foreground"}`}
          >
            {shop.imageUrl ? (
              <img
                src={assetUrl(shop.imageUrl)}
                alt={`${shop.name} logo`}
                className="size-full object-cover"
              />
            ) : (
              <span>{shopInitials(shop.name)}</span>
            )}
          </div>
          <div>
            <h1 className="font-serif text-2xl font-normal tracking-tight text-foreground md:text-4xl">
              {shop.name}
            </h1>
            <p className="mt-3 max-w-xl text-base leading-7 text-muted-foreground">
              {shop.description ?? "Shop details and contact information."}
            </p>
          </div>
          <Button asChild variant="outline">
            <Link to="/$locale" params={{ locale }}>
              Browse items
            </Link>
          </Button>
        </div>

        <div className="space-y-4">
          <InfoSection title="Contact">
            {hasContact ? (
              <div className="space-y-3">
                {shop.contactEmail ? (
                  <InfoLink icon={<Mail className="size-4" />} href={`mailto:${shop.contactEmail}`}>
                    {shop.contactEmail}
                  </InfoLink>
                ) : null}
                {shop.contactPhone ? (
                  <InfoLink icon={<Phone className="size-4" />} href={`tel:${shop.contactPhone}`}>
                    {shop.contactPhone}
                  </InfoLink>
                ) : null}
                {links.map((link) => (
                  <InfoLink
                    key={`${link.label}-${link.url}`}
                    icon={<Globe className="size-4" />}
                    href={link.url}
                  >
                    {link.label}
                  </InfoLink>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Contact details coming soon.</p>
            )}
          </InfoSection>

          <InfoSection title="Shipping" icon={<Truck className="size-4" />}>
            <PolicyText
              text={shop.shippingPolicy}
              fallback="Shipping information is not available yet."
            />
          </InfoSection>

          <InfoSection title="Returns" icon={<RotateCcw className="size-4" />}>
            <PolicyText
              text={shop.returnsPolicy}
              fallback="Returns information is not available yet."
            />
          </InfoSection>
        </div>
      </section>
    </main>
  );
}

function InfoSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border bg-white p-5">
      <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-foreground">
        {icon}
        {title}
      </h2>
      {children}
    </section>
  );
}

function InfoLink({
  icon,
  href,
  children,
}: {
  icon: ReactNode;
  href: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
    >
      <span className="shrink-0">{icon}</span>
      <span className="truncate">{children}</span>
    </a>
  );
}

function PolicyText({ text, fallback }: { text: string | null; fallback: string }) {
  return (
    <p className="whitespace-pre-line text-sm leading-6 text-muted-foreground">
      {text?.trim() || fallback}
    </p>
  );
}
