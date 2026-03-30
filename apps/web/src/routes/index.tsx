import { createFileRoute } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 p-6">
      <div className="text-center">
        <h1 className="text-3xl font-semibold tracking-tight">yej-sira</h1>
        <p className="mt-2 text-neutral-600">
          TanStack Start + Hono + Prisma monorepo
        </p>
      </div>
      <Button type="button">Get started</Button>
    </main>
  );
}
