import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { type ColumnDef } from "@tanstack/react-table";
import { Copy, Loader2, MoreHorizontal, Plus, Send, Trash2, Upload } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataPagination } from "@/features/shared/data-pagination";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { assetUrl, uploadImage } from "@/lib/api";
import { useLocale } from "@/lib/locale-path";
import type { Locale } from "@ys/intl";

import { SellerShellDataTable } from "@/features/seller/shared/shell-data-table";
import {
  adminShopsQuery,
  createAdminShopMutation,
  sendAdminShopPasswordResetMutation,
  updateAdminShopStatusMutation,
  type AdminShopListItem,
} from "./shops.queries";
import { formatDateTime } from "@/features/shared/formatters";

type Status = AdminShopListItem["status"];

function badgeVariant(
  s: Status,
): "default" | "secondary" | "outline" | "destructive" {
  switch (s) {
    case "active":
      return "default";
    case "pending":
      return "outline";
    case "rejected":
    case "suspended":
      return "destructive";
    default:
      return "secondary";
  }
}

const ALL_STATUSES: Status[] = ["pending", "active", "suspended", "rejected"];

type CreateShopFormState = {
  name: string;
  slug: string;
  ownerEmail: string;
  initialPassword: string;
  status: Status;
  description: string;
  imageUrl: string;
  contactPhone: string;
  businessType: "" | "individual" | "business";
  listingsLimit: string;
};

function emptyCreateShopForm(): CreateShopFormState {
  return {
    name: "",
    slug: "",
    ownerEmail: "",
    initialPassword: "",
    status: "active",
    description: "",
    imageUrl: "",
    contactPhone: "",
    businessType: "",
    listingsLimit: "20",
  };
}

function slugifyShopName(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function optionalString(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function generateTemporaryPassword() {
  return `Ys-${Math.random().toString(36).slice(2, 8)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function CreateShopDialog() {
  const queryClient = useQueryClient();
  const locale = useLocale() as Locale;
  const mutation = useMutation(createAdminShopMutation(queryClient));
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState<CreateShopFormState>(emptyCreateShopForm);
  const [slugEdited, setSlugEdited] = React.useState(false);
  const logoInputRef = React.useRef<HTMLInputElement | null>(null);
  const [logoUploading, setLogoUploading] = React.useState(false);
  const [logoError, setLogoError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setForm(emptyCreateShopForm());
      setSlugEdited(false);
      setLogoError(null);
      setLogoUploading(false);
    }
  }, [open]);

  const pending = mutation.isPending || logoUploading;
  const bind = <K extends keyof CreateShopFormState>(key: K) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((current) => ({ ...current, [key]: event.target.value }));

  const handleLogoFileChosen = async (file: File) => {
    setLogoError(null);
    setLogoUploading(true);
    try {
      const url = await uploadImage(file, "shops", locale);
      setForm((current) => ({ ...current, imageUrl: url }));
    } catch (err) {
      setLogoError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLogoUploading(false);
    }
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (logoUploading) return;
    mutation.mutate(
      {
        name: form.name.trim(),
        slug: form.slug.trim(),
        ownerEmail: form.ownerEmail.trim(),
        initialPassword: form.initialPassword,
        status: form.status,
        description: optionalString(form.description),
        imageUrl: optionalString(form.imageUrl),
        contactEmail: optionalString(form.ownerEmail),
        contactPhone: optionalString(form.contactPhone),
        businessType: form.businessType || undefined,
        listingsLimit: Number(form.listingsLimit) || 20,
      },
      {
        onSuccess: (data) => {
          toast.success(`${data.shop.name} created`);
          setOpen(false);
        },
        onError: (err: unknown) =>
          toast.error(err instanceof Error ? err.message : "Failed to create shop"),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8">
          <Plus data-icon="inline-start" />
          New shop
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>New shop</DialogTitle>
          <DialogDescription>Create a shop from the admin portal.</DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-4" onSubmit={submit}>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="shop-name">Shop name</Label>
              <Input
                id="shop-name"
                required
                value={form.name}
                onChange={(event) => {
                  const name = event.target.value;
                  setForm((current) => ({
                    ...current,
                    name,
                    slug: slugEdited ? current.slug : slugifyShopName(name),
                  }));
                }}
                placeholder="Addis Handmade"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="shop-slug">Slug</Label>
              <Input
                id="shop-slug"
                required
                value={form.slug}
                onChange={(event) => {
                  setSlugEdited(true);
                  setForm((current) => ({ ...current, slug: slugifyShopName(event.target.value) }));
                }}
                placeholder="addis-handmade"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="shop-email">Email address</Label>
              <Input
                id="shop-email"
                type="email"
                required
                value={form.ownerEmail}
                onChange={bind("ownerEmail")}
                placeholder="seller@example.com"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="shop-initial-password">Initial password</Label>
              <div className="flex gap-2">
                <Input
                  id="shop-initial-password"
                  type="text"
                  minLength={8}
                  required
                  value={form.initialPassword}
                  onChange={bind("initialPassword")}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      initialPassword: generateTemporaryPassword(),
                    }))
                  }
                >
                  Generate
                </Button>
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="shop-status">Status</Label>
              <NativeSelect id="shop-status" value={form.status} onChange={bind("status")}>
                {ALL_STATUSES.map((status) => (
                  <NativeSelectOption key={status} value={status}>
                    {status}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="shop-contact-phone">Contact phone</Label>
              <Input
                id="shop-contact-phone"
                value={form.contactPhone}
                onChange={bind("contactPhone")}
                placeholder="+251..."
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="shop-business-type">Business type</Label>
              <NativeSelect
                id="shop-business-type"
                value={form.businessType}
                onChange={bind("businessType")}
              >
                <NativeSelectOption value="">Not set</NativeSelectOption>
                <NativeSelectOption value="individual">Individual</NativeSelectOption>
                <NativeSelectOption value="business">Business</NativeSelectOption>
              </NativeSelect>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="shop-listings-limit">Listing limit</Label>
              <Input
                id="shop-listings-limit"
                type="number"
                min={1}
                max={10000}
                value={form.listingsLimit}
                onChange={bind("listingsLimit")}
              />
            </div>
            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label>Logo image</Label>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void handleLogoFileChosen(file);
                  event.target.value = "";
                }}
              />
              <div className="flex items-center gap-4 rounded-lg border border-dashed border-border p-4">
                <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
                  {form.imageUrl ? (
                    <img
                      src={assetUrl(form.imageUrl)}
                      alt="Shop logo preview"
                      className="size-full object-cover"
                    />
                  ) : (
                    <span className="text-xs text-muted-foreground">No logo</span>
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={logoUploading}
                      onClick={() => logoInputRef.current?.click()}
                    >
                      {logoUploading ? (
                        <>
                          <Loader2 data-icon="inline-start" className="animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload data-icon="inline-start" />
                          {form.imageUrl ? "Replace logo" : "Upload logo"}
                        </>
                      )}
                    </Button>
                    {form.imageUrl && !logoUploading ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setForm((current) => ({ ...current, imageUrl: "" }))
                        }
                      >
                        <Trash2 data-icon="inline-start" />
                        Remove
                      </Button>
                    ) : null}
                  </div>
                  <p className="text-xs text-muted-foreground">PNG, JPG, WEBP, or GIF. Max 5MB.</p>
                  {logoError ? <p className="text-xs text-destructive">{logoError}</p> : null}
                </div>
              </div>
            </div>
            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="shop-description">Description</Label>
              <Textarea
                id="shop-description"
                value={form.description}
                onChange={bind("description")}
                placeholder="What this shop sells and what makes it distinct."
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Creating..." : "Create shop"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ShopStatusActions({ shop }: { shop: AdminShopListItem }) {
  const queryClient = useQueryClient();
  const statusMutation = useMutation(updateAdminShopStatusMutation(queryClient));
  const passwordResetMutation = useMutation(sendAdminShopPasswordResetMutation(queryClient));
  const locale = useLocale() as Locale;

  const setStatus = (status: Status) => {
    statusMutation.mutate(
      { id: shop.id, status },
      {
        onSuccess: () => toast.success(`Shop marked ${status}`),
        onError: (err: unknown) =>
          toast.error(err instanceof Error ? err.message : "Failed to update shop"),
      },
    );
  };
  const copyTelegramMiniAppUrl = () => {
    if (!shop.telegramMiniAppUrl) return;
    void navigator.clipboard.writeText(shop.telegramMiniAppUrl);
    toast.success("Telegram Mini App link copied");
  };

  const sendPasswordReset = () => {
    passwordResetMutation.mutate(shop.id, {
      onSuccess: (data) => toast.success(`Password setup email sent to ${data.email}`),
      onError: (err: unknown) =>
        toast.error(err instanceof Error ? err.message : "Failed to send password email"),
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem asChild>
          <Link
            to="/$locale/shops/$shopSlug"
            params={{ locale, shopSlug: shop.slug }}
            search={{ page: 1 }}
          >
            View storefront
          </Link>
        </DropdownMenuItem>
        {shop.telegramMiniAppUrl ? (
          <>
            <DropdownMenuItem asChild>
              <a href={shop.telegramMiniAppUrl} target="_blank" rel="noreferrer">
                <Send className="size-3.5" />
                Open Telegram Mini App
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                copyTelegramMiniAppUrl();
              }}
            >
              <Copy className="size-3.5" />
              Copy Telegram link
            </DropdownMenuItem>
          </>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={passwordResetMutation.isPending}
          onSelect={(e) => {
            e.preventDefault();
            sendPasswordReset();
          }}
        >
          Send password setup email
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {ALL_STATUSES.filter((s) => s !== shop.status).map((s) => (
          <DropdownMenuItem
            key={s}
            disabled={statusMutation.isPending}
            onSelect={(e) => {
              e.preventDefault();
              setStatus(s);
            }}
            className="capitalize"
          >
            Mark as {s}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const columns: ColumnDef<AdminShopListItem>[] = [
  {
    accessorKey: "name",
    header: "Shop",
    cell: ({ row }) => (
      <div className="min-w-0">
        <p className="truncate font-medium">{row.original.name}</p>
        <p className="truncate text-xs text-muted-foreground">{row.original.slug}</p>
      </div>
    ),
  },
  {
    accessorKey: "owner",
    header: "Owner",
    cell: ({ row }) =>
      row.original.owner ? (
        <div className="min-w-0">
          <p className="truncate text-sm">{row.original.owner.name}</p>
          <p className="truncate text-xs text-muted-foreground">{row.original.owner.email}</p>
        </div>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={badgeVariant(row.original.status)} className="capitalize">
        {row.original.status}
      </Badge>
    ),
  },
  {
    accessorKey: "listingCount",
    header: "Listings",
    cell: ({ row }) => (
      <span className="tabular-nums">{row.original.listingCount}</span>
    ),
  },
  {
    accessorKey: "businessType",
    header: "Type",
    cell: ({ row }) => (
      <span className="capitalize text-muted-foreground">
        {row.original.businessType ?? "—"}
      </span>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => (
      <span className="text-muted-foreground">{formatDateTime(row.original.createdAt)}</span>
    ),
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => <ShopStatusActions shop={row.original} />,
    enableSorting: false,
    enableHiding: false,
  },
];

export function AdminShopsPage() {
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const { data, isLoading } = useQuery(
    adminShopsQuery({
      q: search || undefined,
      page,
      pageSize: 25,
    }),
  );

  return (
    <div className="@container/main flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          className="h-8 w-full max-w-sm rounded-md border border-input bg-background px-3 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          placeholder="Search name, slug, email…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <div className="ml-auto">
          <CreateShopDialog />
        </div>
      </div>

      <SellerShellDataTable
        columns={columns}
        data={data?.shops ?? []}
        filterColumnId="name"
        filterPlaceholder=""
        countNoun="shop"
        isLoading={isLoading}
        showFilter={false}
        showPagination={false}
      />

      {data ? (
        <DataPagination page={data.page} totalPages={data.totalPages} onPageChange={setPage} />
      ) : null}
    </div>
  );
}
