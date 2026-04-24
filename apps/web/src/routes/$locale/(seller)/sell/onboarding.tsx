import { createFileRoute, redirect } from "@tanstack/react-router";

/** Onboarding is merged into the open-shop form; this URL is kept for old links. */
export const Route = createFileRoute("/$locale/(seller)/sell/onboarding")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/$locale/sell/dashboard", params: { locale: params.locale } });
  },
});
