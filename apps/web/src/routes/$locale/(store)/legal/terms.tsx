import { createFileRoute } from "@tanstack/react-router";

import { LegalPage } from "@/features/legal/legal-page";

export const Route = createFileRoute("/$locale/(store)/legal/terms")({
  component: TermsPage,
  head: () => ({
    meta: [
      { title: "Terms of Service — Yej-sira" },
      {
        name: "description",
        content: "The terms governing use of the Yej-sira marketplace.",
      },
    ],
  }),
});

function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      updatedAt="April 21, 2026"
      intro={
        <p>
          These Terms of Service govern your use of the Yej-sira marketplace.
          By accessing or using the service you agree to be bound by these
          terms.
        </p>
      }
      sections={[
        {
          heading: "1. Accounts",
          body: (
            <p>
              You are responsible for maintaining the security of your account
              credentials and for any activity under your account. You must be
              at least 18 years old or have the consent of a parent or legal
              guardian.
            </p>
          ),
        },
        {
          heading: "2. Buying",
          body: (
            <p>
              Orders are fulfilled by independent sellers. Yej-sira facilitates
              payments via Chapa (card and Telebirr). Once your order is paid
              for it cannot be cancelled except as described in the Returns
              policy.
            </p>
          ),
        },
        {
          heading: "3. Selling",
          body: (
            <p>
              Sellers agree to the Seller Policy in addition to these terms.
              Shops that violate our policies may be suspended or removed at
              our sole discretion.
            </p>
          ),
        },
        {
          heading: "4. Prohibited items",
          body: (
            <p>
              You may not list items that are illegal, counterfeit, stolen,
              hazardous, or that infringe third-party rights. See the Seller
              Policy for a non-exhaustive list.
            </p>
          ),
        },
        {
          heading: "5. Disclaimers",
          body: (
            <p>
              The service is provided &quot;as-is&quot; without warranty of any
              kind. To the maximum extent permitted by law, Yej-sira disclaims
              all warranties and is not liable for indirect, incidental, or
              consequential damages.
            </p>
          ),
        },
        {
          heading: "6. Governing law",
          body: (
            <p>
              These terms are governed by the laws of the Federal Democratic
              Republic of Ethiopia. Disputes will be resolved in the competent
              courts of Addis Ababa.
            </p>
          ),
        },
        {
          heading: "7. Contact",
          body: (
            <p>
              Questions about these terms? Email{" "}
              <a href="mailto:support@yej-sira.com">support@yej-sira.com</a>.
            </p>
          ),
        },
      ]}
    />
  );
}
