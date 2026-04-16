import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/$locale/(seller)/sell/listings/new")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/$locale/sell/listings",
      params: { locale: params.locale },
      search: { new: true, edit: undefined },
    });
  },
});
