import { Link } from "@tanstack/react-router";

/** Matches `Shop by category` on the storefront — slugs align with catalog seed */
const departmentLinks = [
  { label: "Jewelry & Accessories", slug: "jewelry-accessories" },
  { label: "Home & Living", slug: "home-living" },
  { label: "Art & Collectibles", slug: "art-collectibles" },
  { label: "Paper & Party", slug: "paper-party" },
  { label: "Vintage", slug: "vintage" },
  { label: "Clothing", slug: "clothing" },
] as const;

const aboutLinks = ["About Yej Sira", "Seller stories", "Our impact"];

const serviceLinks: { label: string; to?: "/sell" }[] = [
  { label: "Yej Sira app" },
  { label: "Shipping & policies" },
  { label: "Open a shop", to: "/sell" },
];

const helpLinks = [
  "Help Center",
  "Returns & exchanges",
  "Track your order",
  "Contact us",
  "Site feedback",
  "Trust & safety",
];

function FooterLink({ children }: { children: React.ReactNode }) {
  return (
    <a
      href="#"
      className="block text-sm text-white/80 transition-colors hover:text-white"
      onClick={(e) => e.preventDefault()}
    >
      {children}
    </a>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: readonly string[] | readonly { label: string; to?: "/sell" }[];
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <ul className="mt-4 space-y-2.5">
        {links.map((item) => {
          const label = typeof item === "string" ? item : item.label;
          const to = typeof item === "string" ? undefined : item.to;
          return (
            <li key={label}>
              {to ? (
                <Link
                  to={to}
                  className="block text-sm text-white/80 transition-colors hover:text-white"
                >
                  {label}
                </Link>
              ) : (
                <FooterLink>{label}</FooterLink>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-white/20 bg-primary text-white">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="flex flex-col gap-12 lg:flex-row lg:gap-16">
          <div className="max-w-sm shrink-0">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-lg font-bold tracking-tight text-white"
            >
              <span className="text-xl" aria-hidden>
                ✦
              </span>
              <span>Yej Sira</span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-white/80">
              A marketplace for handmade goods, vintage finds, and craft
              supplies—where independent makers and small studios connect with
              people who care about how things are made.
            </p>
          </div>

          <div className="grid flex-1 grid-cols-2 gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            <div>
              <h3 className="text-sm font-semibold text-white">
                Shop by category
              </h3>
              <ul className="mt-4 space-y-2.5">
                {departmentLinks.map(({ label, slug }) => (
                  <li key={slug}>
                    <Link
                      to="/categories/$categoryId"
                      params={{ categoryId: slug }}
                      search={{ sort: "relevancy", tagSlugs: "", promotionSlug: undefined }}
                      className="block text-sm text-white/80 transition-colors hover:text-white"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <FooterColumn title="About us" links={aboutLinks} />
            <FooterColumn title="Services" links={serviceLinks} />
            <FooterColumn title="Help" links={helpLinks} />
          </div>
        </div>
      </div>

      <div className="border-t border-white/20">
        <div className="mx-auto max-w-6xl px-4 py-6 text-center">
          <p className="text-xs text-white/70">
            © {new Date().getFullYear()} Yej Sira. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
