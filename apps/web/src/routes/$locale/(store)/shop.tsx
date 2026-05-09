import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  ExternalLink,
  Globe,
  Mail,
  MapPin,
  Phone,
  RotateCcw,
  Truck,
} from "lucide-react";
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

const ADDIS_ABABA_COORDS = { lat: 9.0301, lon: 38.7409 };

const ADDIS_SUBCITY_COORDS: Record<string, { lat: number; lon: number }> = {
  addisketema: { lat: 9.0373, lon: 38.7314 },
  akakykaliti: { lat: 8.8822, lon: 38.7898 },
  arada: { lat: 9.0351, lon: 38.7535 },
  bole: { lat: 8.9956, lon: 38.7895 },
  gulele: { lat: 9.0624, lon: 38.729 },
  kirkos: { lat: 9.0106, lon: 38.7611 },
  kolfe: { lat: 9.0255, lon: 38.6816 },
  lideta: { lat: 9.0104, lon: 38.7359 },
  nifassilk: { lat: 8.9673, lon: 38.7212 },
  yeka: { lat: 9.042, lon: 38.8032 },
  lemikura: { lat: 9.0034, lon: 38.8588 },
};

function normalizeLocation(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function shopLocationParts(shop: PublicStorefrontShop) {
  return [
    shop.businessSpecificLocation,
    shop.businessSubcity,
    shop.businessCity,
    "Ethiopia",
  ]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part));
}

function approximateCoordinates(shop: PublicStorefrontShop) {
  const city = normalizeLocation(shop.businessCity ?? "");
  if (!city.includes("addis") && !city.includes("adiss")) return null;

  const subcity = normalizeLocation(shop.businessSubcity ?? "");
  if (subcity) {
    const matchedKey = Object.keys(ADDIS_SUBCITY_COORDS).find((key) =>
      subcity.includes(key),
    );
    if (matchedKey) return ADDIS_SUBCITY_COORDS[matchedKey];
  }

  return ADDIS_ABABA_COORDS;
}

function osmSearchUrl(parts: string[]) {
  return `https://www.openstreetmap.org/search?query=${encodeURIComponent(parts.join(", "))}`;
}

function osmEmbedUrl(coords: { lat: number; lon: number }) {
  const delta = 0.014;
  const params = new URLSearchParams({
    bbox: [
      (coords.lon - delta).toFixed(5),
      (coords.lat - delta).toFixed(5),
      (coords.lon + delta).toFixed(5),
      (coords.lat + delta).toFixed(5),
    ].join(","),
    layer: "mapnik",
    marker: `${coords.lat.toFixed(5)},${coords.lon.toFixed(5)}`,
  });
  return `https://www.openstreetmap.org/export/embed.html?${params.toString()}`;
}

function ShopDetailsPage() {
  const { locale } = Route.useParams();
  const shop = useActiveStorefrontShop();

  useEffect(() => {
    if (shop) document.title = `${shop.name} details · YEJSIRA`;
  }, [shop]);

  if (!shop) return <Navigate to="/$locale" params={{ locale }} />;

  const links = socialLinks(shop);
  const hasContact = Boolean(shop.contactEmail || shop.contactPhone || links.length > 0);

  return (
    <main className="pb-12">
      <section className="grid gap-10 border-b border-border pb-10 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:items-end">
        <div className="flex min-w-0 flex-col gap-5">
          <Button asChild variant="ghost" size="sm" className="w-fit px-0 hover:bg-transparent">
            <Link to="/$locale" params={{ locale }}>
              <ArrowLeft data-icon="inline-start" />
              Browse items
            </Link>
          </Button>
          <div className="flex min-w-0 items-center gap-4">
            <div
              className={`flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border text-lg font-semibold sm:size-20${shop.imageUrl ? " bg-card" : " bg-muted text-muted-foreground"}`}
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
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Shop Details
            </p>
          </div>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-foreground md:text-6xl">
            {shop.name}
          </h1>
        </div>

        <p className="max-w-xl text-base leading-7 text-muted-foreground md:justify-self-end md:text-lg">
          {shop.description ?? "Shop details, contact information, location, shipping, and returns."}
        </p>
      </section>

      <section className="grid gap-10 py-10 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,26rem)]">
        <div className="flex min-w-0 flex-col gap-8">
          <InfoSection title="Contact">
            <ContactContent shop={shop} links={links} hasContact={hasContact} />
          </InfoSection>

          <div className="grid gap-8 md:grid-cols-2">
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
        </div>

        <LocationSection shop={shop} />
      </section>
    </main>
  );
}

function ContactContent({
  shop,
  links,
  hasContact,
}: {
  shop: PublicStorefrontShop;
  links: { label: string; url: string }[];
  hasContact: boolean;
}) {
  if (!hasContact) {
    return <p className="text-sm text-muted-foreground">Contact details coming soon.</p>;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
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
  );
}

function LocationSection({ shop }: { shop: PublicStorefrontShop }) {
  const parts = shopLocationParts(shop);
  const locationLine = [shop.businessSubcity, shop.businessCity]
    .filter(Boolean)
    .join(", ");
  const coords = approximateCoordinates(shop);
  const searchUrl = parts.length ? osmSearchUrl(parts) : "https://www.openstreetmap.org";

  return (
    <section className="flex min-w-0 flex-col gap-4 border-t border-border pt-8 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
            <MapPin className="size-4" aria-hidden />
            Location
          </h2>
          <address className="mt-2 not-italic text-sm leading-6 text-muted-foreground">
            {shop.businessSpecificLocation ? (
              <span className="block font-medium text-foreground">
                {shop.businessSpecificLocation}
              </span>
            ) : null}
            {locationLine ? <span className="block">{locationLine}</span> : null}
            {!parts.length ? <span>Location details coming soon.</span> : null}
          </address>
        </div>
        <Button variant="outline" size="sm" asChild>
          <a href={searchUrl} target="_blank" rel="noreferrer">
            <ExternalLink data-icon="inline-start" />
            Map
          </a>
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-muted">
        {coords ? (
          <iframe
            title={`${shop.name} location on OpenStreetMap`}
            src={osmEmbedUrl(coords)}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="h-72 w-full border-0"
          />
        ) : (
          <div className="flex h-72 flex-col items-center justify-center gap-3 px-6 text-center">
            <MapPin className="size-8 text-muted-foreground" aria-hidden />
            <p className="text-sm font-medium text-foreground">
              {parts.length
                ? "Open this shop location in OpenStreetMap."
                : "No shop location has been added yet."}
            </p>
          </div>
        )}
      </div>
    </section>
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
    <section className="min-w-0">
      <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-foreground">
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
      className="flex min-w-0 items-center gap-2 rounded-lg border border-border bg-card px-3 py-3 text-sm text-muted-foreground transition-colors hover:text-primary"
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
