import { createFileRoute } from "@tanstack/react-router";

import { StoreLayout } from "@/components/shells/store-layout";

export const Route = createFileRoute("/$locale/(store)")({
  component: StoreLayout,
});
