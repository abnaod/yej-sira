import { createFileRoute } from "@tanstack/react-router";

import { LegalPage } from "@/features/legal/legal-page";

export const Route = createFileRoute("/$locale/(store)/legal/returns")({
  component: ReturnsPage,
  head: () => ({
    meta: [
      { title: "Returns Policy — Yejsira" },
      {
        name: "description",
        content: "How returns, refunds and exchanges work on Yejsira.",
      },
    ],
  }),
});

function ReturnsPage() {
  return (
    <LegalPage
      title="Returns Policy"
      updatedAt="April 21, 2026"
      sections={[
        {
          heading: "Eligibility",
          body: (
            <p>
              Most items can be returned within 7 days of delivery if they are
              unused, in their original packaging, and accompanied by proof of
              purchase. Individual sellers may offer longer windows; check the
              listing page for details.
            </p>
          ),
        },
        {
          heading: "Non-returnable items",
          body: (
            <p>
              Perishables, custom-made goods, intimate apparel, and digital
              downloads cannot be returned unless defective.
            </p>
          ),
        },
        {
          heading: "How to return an item",
          body: (
            <ol>
              <li>Go to Orders → select the order → &quot;Request return&quot;.</li>
              <li>
                Choose a reason and upload a photo. The seller has 48 hours to
                respond.
              </li>
              <li>
                Ship the item back per the seller&apos;s instructions. Refunds
                are issued within 5 business days after receipt.
              </li>
            </ol>
          ),
        },
        {
          heading: "Damaged or missing items",
          body: (
            <p>
              Contact <a href="mailto:support@yejsira.com">support@yejsira.com</a>
              {" "}within 48 hours of delivery. We&apos;ll investigate and refund
              you if appropriate.
            </p>
          ),
        },
      ]}
    />
  );
}
