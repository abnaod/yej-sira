import type { Locale } from "@ys/intl";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { BrandLogo } from "@/components/layout/brand-logo";
import { featureCartCheckout } from "@/lib/features";
import { useLocale } from "@/lib/locale-path";

/** Slugs align with catalog seed */
const departmentSlugs = [
  { labelKey: "footerDeptCrochet" as const, slug: "crochet" },
  { labelKey: "footerDeptJewelry" as const, slug: "jewelry" },
  { labelKey: "footerDeptBasketry" as const, slug: "basketry" },
  { labelKey: "footerDeptPottery" as const, slug: "pottery" },
  { labelKey: "footerDeptClothing" as const, slug: "clothing" },
  { labelKey: "footerDeptArt" as const, slug: "art-collectibles" },
] as const;

const aboutKeys = [
  "footerAbout1",
  "footerAbout2",
  "footerAbout3",
] as const;

const serviceLinks: { labelKey: "footerService1" | "footerService3"; to?: "/$locale/sell" }[] = [
  { labelKey: "footerService1" },
  { labelKey: "footerService3", to: "/$locale/sell" },
];

const helpKeys = ["footerHelp3", "footerHelp4"] as const;

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
  locale,
  t,
}: {
  title: string;
  links:
    | readonly string[]
    | readonly { labelKey: string; to?: "/$locale/sell" }[];
  locale: Locale;
  t: (key: string) => string;
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <ul className="mt-4 space-y-2.5">
        {links.map((item) => {
          const label =
            typeof item === "string" ? t(item) : t(item.labelKey);
          const key = typeof item === "string" ? item : item.labelKey;
          const to = typeof item === "string" ? undefined : item.to;
          return (
            <li key={key}>
              {to ? (
                <Link
                  to={to}
                  params={{ locale }}
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
  const { t } = useTranslation("common");
  const locale = useLocale();
  const year = new Date().getFullYear();
  return (
    <footer className="hidden border-t border-white/20 bg-primary text-white md:block">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="flex flex-col gap-12 lg:flex-row lg:gap-16">
          <div className="max-w-sm shrink-0">
            <Link
              to="/$locale"
              params={{ locale }}
              className="inline-flex items-center text-white"
            >
              <BrandLogo className="text-white" />
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-white/80">
              {t("footerTagline")}
            </p>
          </div>

          <div className="grid flex-1 grid-cols-2 gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            <div>
              <h3 className="text-sm font-semibold text-white">
                {t("shopByCategory")}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {departmentSlugs.map(({ labelKey, slug }) => (
                  <li key={slug}>
                    <Link
                      to="/$locale/categories/$categoryId"
                      params={{ locale, categoryId: slug }}
                      search={{
                        sort: "relevancy",
                        tagSlugs: "",
                        promotionSlug: undefined,
                        attributeDefinitionKey: undefined,
                        allowedValueKey: undefined,
                      }}
                      className="block text-sm text-white/80 transition-colors hover:text-white"
                    >
                      {t(labelKey)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <FooterColumn
              title={t("footerAboutUs")}
              links={[...aboutKeys]}
              locale={locale}
              t={t}
            />
            <FooterColumn
              title={t("footerServices")}
              links={serviceLinks}
              locale={locale}
              t={t}
            />
            <FooterColumn
              title={t("footerHelp")}
              links={
                featureCartCheckout ? [...helpKeys] : helpKeys.filter((k) => k !== "footerHelp3")
              }
              locale={locale}
              t={t}
            />
          </div>
        </div>
      </div>

      <div className="border-t border-white/20">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-4 py-6 text-center md:flex-row md:justify-between md:text-left">
          <p className="text-xs text-white/70">
            {t("footerCopyright", { year })}
          </p>
          <nav className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/70">
            <Link
              to="/$locale/legal/terms"
              params={{ locale }}
              className="hover:text-white"
            >
              Terms
            </Link>
            <Link
              to="/$locale/legal/privacy"
              params={{ locale }}
              className="hover:text-white"
            >
              Privacy
            </Link>
            <Link
              to="/$locale/legal/returns"
              params={{ locale }}
              className="hover:text-white"
            >
              Returns
            </Link>
            <Link
              to="/$locale/legal/seller-policy"
              params={{ locale }}
              className="hover:text-white"
            >
              Seller Policy
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
