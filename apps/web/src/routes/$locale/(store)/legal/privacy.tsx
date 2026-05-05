import { createFileRoute } from "@tanstack/react-router";

import { LegalPage } from "@/features/legal/legal-page";

export const Route = createFileRoute("/$locale/(store)/legal/privacy")({
  component: PrivacyPage,
  head: () => ({
    meta: [
      { title: "Privacy Policy — Yejsira" },
      {
        name: "description",
        content: "How Yejsira collects, uses and protects your personal data.",
      },
    ],
  }),
});

function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updatedAt="April 21, 2026"
      intro={
        <p>
          We value your privacy. This policy describes what we collect, why we
          collect it, and the controls you have.
        </p>
      }
      sections={[
        {
          heading: "Information we collect",
          body: (
            <ul>
              <li>
                Account info you provide: name, email, phone, and shipping
                addresses.
              </li>
              <li>Payment details you submit to Chapa; we never store card numbers.</li>
              <li>
                Usage data such as pages viewed and actions taken to improve
                the service.
              </li>
            </ul>
          ),
        },
        {
          heading: "How we use it",
          body: (
            <p>
              We use your information to operate the marketplace, fulfill
              orders, provide customer support, prevent fraud, and comply with
              the law. We do not sell your personal data.
            </p>
          ),
        },
        {
          heading: "Cookies",
          body: (
            <p>
              We use first-party cookies required for authentication and the
              shopping cart. We do not use third-party advertising cookies.
            </p>
          ),
        },
        {
          heading: "Data sharing",
          body: (
            <p>
              We share only what&apos;s needed with sellers fulfilling your
              order, with Chapa to process payments, and with service providers
              bound by confidentiality.
            </p>
          ),
        },
        {
          heading: "Your rights",
          body: (
            <p>
              You can view and update your profile from the Account page. To
              delete your account or request a copy of your data, email{" "}
              <a href="mailto:privacy@yejsira.com">privacy@yejsira.com</a>.
            </p>
          ),
        },
      ]}
    />
  );
}
