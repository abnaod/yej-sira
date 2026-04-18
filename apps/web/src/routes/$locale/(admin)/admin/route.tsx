import { createFileRoute } from "@tanstack/react-router";

import { AdminAppShell } from "@/features/admin";

export const Route = createFileRoute("/$locale/(admin)/admin")({
  component: AdminAppShell,
});
