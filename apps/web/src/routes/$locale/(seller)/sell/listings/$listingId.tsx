import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/$locale/(seller)/sell/listings/$listingId")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/$locale/sell/listings",
      params: { locale: params.locale },
      search: { new: false, edit: params.listingId },
    });
  },
});
