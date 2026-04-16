import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/$locale/(seller)/sell/products/$productId")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/$locale/sell/products",
      params: { locale: params.locale },
      search: { new: false, edit: params.productId },
    });
  },
});
