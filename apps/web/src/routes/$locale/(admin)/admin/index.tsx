import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/$locale/(admin)/admin/")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/$locale/admin/dashboard",
      params: { locale: params.locale },
    });
  },
});
