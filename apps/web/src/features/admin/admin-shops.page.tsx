import type { Locale } from "@ys/intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { useLocale } from "@/lib/locale-path";
import { userMeQueryOptions } from "@/features/user/user.queries";
import { adminShopsQuery, patchAdminShopMutationOptions } from "./admin.queries";

export function AdminShopsPage() {
  const locale = useLocale() as Locale;
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();
  const userMe = useQuery({
    ...userMeQueryOptions,
    enabled: !!session?.user,
  });
  const shops = useQuery({
    ...adminShopsQuery(locale),
    enabled: userMe.data?.user.role === "admin",
  });
  const patch = useMutation(patchAdminShopMutationOptions(queryClient, locale));

  if (!session?.user) {
    return (
      <main className="mx-auto max-w-3xl py-12">
        <p className="text-muted-foreground">Sign in as admin.</p>
      </main>
    );
  }

  if (userMe.isLoading) {
    return (
      <main className="mx-auto max-w-3xl py-12">
        <p className="text-muted-foreground">Loading…</p>
      </main>
    );
  }

  if (userMe.data?.user.role !== "admin") {
    return (
      <main className="mx-auto max-w-3xl py-12">
        <p className="text-destructive">Access denied.</p>
      </main>
    );
  }

  const rows = shops.data?.shops ?? [];

  return (
    <main className="mx-auto max-w-4xl py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Shops (admin)</h1>
      {shops.isLoading ? (
        <p className="mt-6 text-muted-foreground">Loading…</p>
      ) : (
        <div className="mt-8 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="pb-2 pr-4 font-medium">Name</th>
                <th className="pb-2 pr-4 font-medium">Owner</th>
                <th className="pb-2 pr-4 font-medium">Status</th>
                <th className="pb-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id} className="border-b border-border/60">
                  <td className="py-3 pr-4">
                    <span className="font-medium">{s.name}</span>
                    <span className="ml-2 text-muted-foreground">({s.slug})</span>
                  </td>
                  <td className="py-3 pr-4 text-muted-foreground">{s.owner?.email ?? "—"}</td>
                  <td className="py-3 pr-4">{s.status}</td>
                  <td className="py-3">
                    {s.status === "pending" && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={patch.isPending}
                        onClick={() => patch.mutate({ id: s.id, status: "active" })}
                      >
                        Approve
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
