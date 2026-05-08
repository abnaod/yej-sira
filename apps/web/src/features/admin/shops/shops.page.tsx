import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { type ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Plus } from "lucide-react";
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
import { useLocale } from "@/lib/locale-path";
import type { Locale } from "@ys/intl";

import { SellerShellDataTable } from "@/features/seller/shared/shell-data-table";
import {
  adminShopsQuery,
  createAdminShopMutation,
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
  status: Status;
  description: string;
  imageUrl: string;
  contactEmail: string;
  contactPhone: string;
  businessType: "" | "individual" | "business";
  listingsLimit: string;
};

function emptyCreateShopForm(): CreateShopFormState {
  return {
    name: "",
    slug: "",
    ownerEmail: "",
    status: "active",
    description: "",
    imageUrl: "",
    contactEmail: "",
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

function CreateShopDialog() {
  const queryClient = useQueryClient();
  const mutation = useMutation(createAdminShopMutation(queryClient));
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState<CreateShopFormState>(emptyCreateShopForm);
  const [slugEdited, setSlugEdited] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setForm(emptyCreateShopForm());
      setSlugEdited(false);
    }
  }, [open]);

  const pending = mutation.isPending;
  const bind = <K extends keyof CreateShopFormState>(key: K) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((current) => ({ ...current, [key]: event.target.value }));

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    mutation.mutate(
      {
        name: form.name.trim(),
        slug: form.slug.trim(),
        ownerEmail: optionalString(form.ownerEmail),
        status: form.status,
        description: optionalString(form.description),
        imageUrl: optionalString(form.imageUrl),
        contactEmail: optionalString(form.contactEmail),
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
              <Label htmlFor="shop-owner">Owner email</Label>
              <Input
                id="shop-owner"
                type="email"
                value={form.ownerEmail}
                onChange={bind("ownerEmail")}
                placeholder="seller@example.com"
              />
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
              <Label htmlFor="shop-contact-email">Contact email</Label>
              <Input
                id="shop-contact-email"
                type="email"
                value={form.contactEmail}
                onChange={bind("contactEmail")}
                placeholder="hello@shop.com"
              />
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
            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="shop-image-url">Logo URL</Label>
              <Input
                id="shop-image-url"
                value={form.imageUrl}
                onChange={bind("imageUrl")}
                placeholder="/static/shops/logo.webp or https://..."
              />
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
  const mutation = useMutation(updateAdminShopStatusMutation(queryClient));
  const locale = useLocale() as Locale;

  const setStatus = (status: Status) => {
    mutation.mutate(
      { id: shop.id, status },
      {
        onSuccess: () => toast.success(`Shop marked ${status}`),
        onError: (err: unknown) =>
          toast.error(err instanceof Error ? err.message : "Failed to update shop"),
      },
    );
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
        <DropdownMenuSeparator />
        {ALL_STATUSES.filter((s) => s !== shop.status).map((s) => (
          <DropdownMenuItem
            key={s}
            disabled={mutation.isPending}
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
  const [status, setStatus] = React.useState<Status | "all">("all");
  const [page, setPage] = React.useState(1);
  const { data, isLoading } = useQuery(
    adminShopsQuery({
      q: search || undefined,
      status: status === "all" ? undefined : status,
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
        <div className="flex gap-1">
          {(["all", ...ALL_STATUSES] as const).map((s) => (
            <Button
              key={s}
              variant={status === s ? "default" : "outline"}
              size="sm"
              className="h-8 capitalize"
              onClick={() => {
                setStatus(s);
                setPage(1);
              }}
            >
              {s}
            </Button>
          ))}
        </div>
        <span className="ml-auto text-xs text-muted-foreground">
          {data ? `${data.total} shop${data.total === 1 ? "" : "s"}` : "…"}
        </span>
        <CreateShopDialog />
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
