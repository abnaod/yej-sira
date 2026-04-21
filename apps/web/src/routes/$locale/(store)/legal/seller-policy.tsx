import { createFileRoute } from "@tanstack/react-router";

import { LegalPage } from "@/features/legal/legal-page";

export const Route = createFileRoute("/$locale/(store)/legal/seller-policy")({
  component: SellerPolicyPage,
  head: () => ({
    meta: [
      { title: "Seller Policy — Yej-sira" },
      {
        name: "description",
        content: "Rules and expectations for sellers on the Yej-sira marketplace.",
      },
    ],
  }),
});

function SellerPolicyPage() {
  return (
    <LegalPage
      title="Seller Policy"
      updatedAt="April 21, 2026"
      intro={
        <p>
          This policy applies to every seller on Yej-sira. It supplements the
          Terms of Service. Failure to comply may result in suspension or
          removal of your shop.
        </p>
      }
      sections={[
        {
          heading: "Your shop",
          body: (
            <ul>
              <li>
                Provide accurate business details, working contact methods, and
                a shop description in your listings&apos; primary language.
              </li>
              <li>
                Keep inventory counts, variants and prices up to date. Do not
                use fake compare-at prices or deceptive discounts.
              </li>
              <li>
                Respond to buyer messages within 2 business days.
              </li>
            </ul>
          ),
        },
        {
          heading: "Fulfilment",
          body: (
            <ul>
              <li>Ship or hand over orders within 3 business days of payment.</li>
              <li>
                Use the tracking / fulfilment status in your seller dashboard so
                buyers always know where their order stands.
              </li>
              <li>
                Include an invoice or packing slip that lists the shop name and
                order number.
              </li>
            </ul>
          ),
        },
        {
          heading: "Prohibited content",
          body: (
            <ul>
              <li>Illegal, counterfeit, stolen, or hazardous goods.</li>
              <li>Items that infringe third-party intellectual property.</li>
              <li>Adult content, weapons, or items that promote hate.</li>
              <li>Food, medication or cosmetics without the required permits.</li>
            </ul>
          ),
        },
        {
          heading: "Payouts and fees",
          body: (
            <p>
              Payouts are initiated to the bank or Telebirr account you
              provided during onboarding. Platform and payment processing fees
              are disclosed in your payout statement.
            </p>
          ),
        },
        {
          heading: "Suspension and appeals",
          body: (
            <p>
              Yej-sira may suspend shops that violate this policy, harm buyers,
              or pose a legal risk. You can appeal a suspension by emailing
              {" "}
              <a href="mailto:sellers@yej-sira.com">sellers@yej-sira.com</a>.
            </p>
          ),
        },
      ]}
    />
  );
}
