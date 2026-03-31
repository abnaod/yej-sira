import { Link } from "@tanstack/react-router";
import { Briefcase, Gift, HelpCircle } from "lucide-react";

/** Matches `Shop Our Top Categories` on the storefront */
const departmentLinks = [
  "Jewelry & Accessories",
  "Home & Living",
  "Art & Collectibles",
  "Paper & Party",
  "Vintage",
  "Clothing",
];

const aboutLinks = [
  "About Yej Sira",
  "Careers",
  "Press",
  "Our impact",
  "Investors",
  "Shop local",
  "Seller stories",
  "Affiliate program",
  "Ideas & inspiration",
];

const serviceLinks = [
  "Gift cards",
  "Yej Sira app",
  "Shipping & policies",
  "Order updates",
  "Open a shop",
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
      className="block text-sm text-muted-foreground transition-colors hover:text-foreground"
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
  links: string[];
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <ul className="mt-4 space-y-2.5">
        {links.map((label) => (
          <li key={label}>
            <FooterLink>{label}</FooterLink>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-border bg-white">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="flex flex-col gap-12 lg:flex-row lg:gap-16">
          <div className="max-w-sm shrink-0">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-lg font-bold tracking-tight"
            >
              <span className="text-xl" aria-hidden>
                ✦
              </span>
              <span className="text-primary">Yej Sira</span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              A marketplace for handmade goods, vintage finds, and craft
              supplies—where independent makers and small studios connect with
              people who care about how things are made.
            </p>
          </div>

          <div className="grid flex-1 grid-cols-2 gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            <FooterColumn title="Shop by category" links={departmentLinks} />
            <FooterColumn title="About us" links={aboutLinks} />
            <FooterColumn title="Services" links={serviceLinks} />
            <FooterColumn title="Help" links={helpLinks} />
          </div>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-foreground">
            <a
              href="#"
              className="flex items-center gap-2 transition-colors hover:text-primary"
              onClick={(e) => e.preventDefault()}
            >
              <Briefcase className="h-4 w-4 text-rose-400" strokeWidth={1.5} />
              Open a shop
            </a>
            <a
              href="#"
              className="flex items-center gap-2 transition-colors hover:text-primary"
              onClick={(e) => e.preventDefault()}
            >
              <Gift className="h-4 w-4 text-rose-400" strokeWidth={1.5} />
              Gift cards
            </a>
            <a
              href="#"
              className="flex items-center gap-2 transition-colors hover:text-primary"
              onClick={(e) => e.preventDefault()}
            >
              <HelpCircle className="h-4 w-4 text-rose-400" strokeWidth={1.5} />
              Help Center
            </a>
          </div>

          <div className="flex flex-wrap gap-4 text-sm">
            <a
              href="#"
              className="text-foreground transition-colors hover:text-primary"
              onClick={(e) => e.preventDefault()}
            >
              Terms of Service
            </a>
            <a
              href="#"
              className="text-foreground transition-colors hover:text-primary"
              onClick={(e) => e.preventDefault()}
            >
              Privacy &amp; Policy
            </a>
          </div>

          <p className="text-xs text-muted-foreground sm:text-right">
            © {new Date().getFullYear()} Yej Sira. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
