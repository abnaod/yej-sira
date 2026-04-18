import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataPagination } from "@/features/shared/data-pagination";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  adminPromotionsQuery,
  createPromotionMutation,
  deletePromotionMutation,
  updatePromotionMutation,
  type AdminPromotionListItem,
} from "./promotions.queries";
import { formatDate } from "@/features/shared/formatters";

type FormState = {
  slug: string;
  title: string;
  subtitle: string;
  badgeLabel: string;
  startsAt: string;
  endsAt: string;
  heroImageUrl: string;
  sortOrder: string;
  priority: string;
  titleAm: string;
  subtitleAm: string;
  badgeLabelAm: string;
};

function emptyForm(): FormState {
  return {
    slug: "",
    title: "",
    subtitle: "",
    badgeLabel: "",
    startsAt: "",
    endsAt: "",
    heroImageUrl: "",
    sortOrder: "0",
    priority: "0",
    titleAm: "",
    subtitleAm: "",
    badgeLabelAm: "",
  };
}

function toLocalDatetime(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromPromotion(p: AdminPromotionListItem): FormState {
  return {
    slug: p.slug,
    title: p.title,
    subtitle: p.subtitle ?? "",
    badgeLabel: p.badgeLabel,
    startsAt: toLocalDatetime(p.startsAt),
    endsAt: toLocalDatetime(p.endsAt),
    heroImageUrl: p.heroImageUrl ?? "",
    sortOrder: String(p.sortOrder),
    priority: String(p.priority),
    titleAm: p.titleAm ?? "",
    subtitleAm: p.subtitleAm ?? "",
    badgeLabelAm: p.badgeLabelAm ?? "",
  };
}

function toIso(local: string): string {
  if (!local) return new Date().toISOString();
  return new Date(local).toISOString();
}

function PromotionDialog({
  open,
  onOpenChange,
  mode,
  initial,
  promotionId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  mode: "create" | "edit";
  initial: FormState;
  promotionId?: string;
}) {
  const queryClient = useQueryClient();
  const createM = useMutation(createPromotionMutation(queryClient));
  const updateM = useMutation(updatePromotionMutation(queryClient));
  const [form, setForm] = React.useState<FormState>(initial);

  React.useEffect(() => {
    if (open) setForm(initial);
  }, [open, initial]);

  const pending = createM.isPending || updateM.isPending;
  const bind = <K extends keyof FormState>(key: K) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((s) => ({ ...s, [key]: e.target.value }));

  const submit = () => {
    const payload = {
      slug: form.slug.trim(),
      title: form.title.trim(),
      subtitle: form.subtitle.trim() || undefined,
      badgeLabel: form.badgeLabel.trim(),
      startsAt: toIso(form.startsAt),
      endsAt: toIso(form.endsAt),
      heroImageUrl: form.heroImageUrl.trim() || undefined,
      sortOrder: Number(form.sortOrder) || 0,
      priority: Number(form.priority) || 0,
      titleAm: form.titleAm.trim() || undefined,
      subtitleAm: form.subtitleAm.trim() || undefined,
      badgeLabelAm: form.badgeLabelAm.trim() || undefined,
    };

    if (mode === "create") {
      createM.mutate(payload, {
        onSuccess: () => {
          toast.success("Promotion created");
          onOpenChange(false);
        },
        onError: (err: unknown) =>
          toast.error(err instanceof Error ? err.message : "Failed"),
      });
    } else if (promotionId) {
      updateM.mutate(
        { id: promotionId, body: payload },
        {
          onSuccess: () => {
            toast.success("Promotion updated");
            onOpenChange(false);
          },
          onError: (err: unknown) =>
            toast.error(err instanceof Error ? err.message : "Failed"),
        },
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "New promotion" : "Edit promotion"}</DialogTitle>
          <DialogDescription>
            Promotions are shown on the storefront between the start and end dates.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1">
            <Label htmlFor="p-slug">Slug</Label>
            <Input id="p-slug" value={form.slug} onChange={bind("slug")} />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="p-badge">Badge label</Label>
            <Input id="p-badge" value={form.badgeLabel} onChange={bind("badgeLabel")} />
          </div>
          <div className="grid gap-1 sm:col-span-2">
            <Label htmlFor="p-title">Title</Label>
            <Input id="p-title" value={form.title} onChange={bind("title")} />
          </div>
          <div className="grid gap-1 sm:col-span-2">
            <Label htmlFor="p-subtitle">Subtitle</Label>
            <Input id="p-subtitle" value={form.subtitle} onChange={bind("subtitle")} />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="p-starts">Starts</Label>
            <Input
              id="p-starts"
              type="datetime-local"
              value={form.startsAt}
              onChange={bind("startsAt")}
            />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="p-ends">Ends</Label>
            <Input
              id="p-ends"
              type="datetime-local"
              value={form.endsAt}
              onChange={bind("endsAt")}
            />
          </div>
          <div className="grid gap-1 sm:col-span-2">
            <Label htmlFor="p-hero">Hero image URL</Label>
            <Input id="p-hero" value={form.heroImageUrl} onChange={bind("heroImageUrl")} />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="p-sort">Sort order</Label>
            <Input id="p-sort" type="number" value={form.sortOrder} onChange={bind("sortOrder")} />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="p-priority">Priority</Label>
            <Input
              id="p-priority"
              type="number"
              value={form.priority}
              onChange={bind("priority")}
            />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="p-title-am">Title (Amharic)</Label>
            <Input id="p-title-am" value={form.titleAm} onChange={bind("titleAm")} />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="p-badge-am">Badge (Amharic)</Label>
            <Input id="p-badge-am" value={form.badgeLabelAm} onChange={bind("badgeLabelAm")} />
          </div>
          <div className="grid gap-1 sm:col-span-2">
            <Label htmlFor="p-sub-am">Subtitle (Amharic)</Label>
            <Input id="p-sub-am" value={form.subtitleAm} onChange={bind("subtitleAm")} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={
              pending ||
              !form.slug.trim() ||
              !form.title.trim() ||
              !form.badgeLabel.trim() ||
              !form.startsAt ||
              !form.endsAt
            }
            onClick={submit}
          >
            {mode === "create" ? "Create" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AdminPromotionsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const { data, isLoading } = useQuery(
    adminPromotionsQuery({ q: search || undefined, page, pageSize: 24 }),
  );
  const deleteM = useMutation(deletePromotionMutation(queryClient));

  const [createOpen, setCreateOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<AdminPromotionListItem | null>(null);

  const handleDelete = (p: AdminPromotionListItem) => {
    if (!window.confirm(`Delete promotion "${p.title}"?`)) return;
    deleteM.mutate(p.id, {
      onSuccess: () => toast.success("Promotion deleted"),
      onError: (err: unknown) =>
        toast.error(err instanceof Error ? err.message : "Failed to delete"),
    });
  };

  const now = Date.now();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <input
            className="h-8 w-full max-w-sm rounded-md border border-input bg-background px-3 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            placeholder="Search title or slug…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <p className="text-sm text-muted-foreground">
            {data ? `${data.total} promotion${data.total === 1 ? "" : "s"}` : "…"}
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus />
              New promotion
            </Button>
          </DialogTrigger>
          <PromotionDialog
            open={createOpen}
            onOpenChange={setCreateOpen}
            mode="create"
            initial={emptyForm()}
          />
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {data?.promotions.map((p) => {
            const starts = new Date(p.startsAt).getTime();
            const ends = new Date(p.endsAt).getTime();
            const active = now >= starts && now <= ends;
            const upcoming = now < starts;
            return (
              <Card key={p.id} className="gap-0 py-4">
                <CardHeader className="flex-row items-start justify-between gap-2 pb-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{p.title}</p>
                    <CardDescription className="truncate">{p.slug}</CardDescription>
                  </div>
                  <Badge
                    variant={active ? "default" : upcoming ? "outline" : "secondary"}
                  >
                    {active ? "Active" : upcoming ? "Upcoming" : "Ended"}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-2 pt-0">
                  <p className="text-xs text-muted-foreground">
                    {formatDate(p.startsAt)} → {formatDate(p.endsAt)}
                  </p>
                  <p className="text-xs">
                    <span className="text-muted-foreground">Badge:</span>{" "}
                    <span className="font-medium">{p.badgeLabel}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {p.listingCount} listing{p.listingCount === 1 ? "" : "s"}
                  </p>
                  <div className="flex justify-end gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditing(p);
                        setEditOpen(true);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(p)}
                      disabled={deleteM.isPending}
                    >
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {data ? (
        <DataPagination page={data.page} totalPages={data.totalPages} onPageChange={setPage} />
      ) : null}

      {editing ? (
        <PromotionDialog
          open={editOpen}
          onOpenChange={(v) => {
            setEditOpen(v);
            if (!v) setEditing(null);
          }}
          mode="edit"
          initial={fromPromotion(editing)}
          promotionId={editing.id}
        />
      ) : null}
    </div>
  );
}
