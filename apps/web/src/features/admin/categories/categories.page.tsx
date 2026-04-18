import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type ColumnDef } from "@tanstack/react-table";
import { ImageIcon, Loader2, MoreHorizontal, Plus, Trash2, Upload } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { assetUrl, uploadImage } from "@/lib/api";
import { useLocale } from "@/lib/locale-path";
import type { Locale } from "@ys/intl";
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

import { SellerShellDataTable } from "@/features/seller/shared/shell-data-table";
import {
  adminCategoriesQuery,
  createCategoryMutation,
  deleteCategoryMutation,
  updateCategoryMutation,
  type AdminCategoryListItem,
} from "./categories.queries";

type FormState = {
  slug: string;
  name: string;
  nameAm: string;
  imageUrl: string;
  sortOrder: string;
};

function emptyForm(): FormState {
  return { slug: "", name: "", nameAm: "", imageUrl: "", sortOrder: "0" };
}

function fromCategory(c: AdminCategoryListItem): FormState {
  return {
    slug: c.slug,
    name: c.name,
    nameAm: c.nameAm ?? "",
    imageUrl: c.imageUrl,
    sortOrder: String(c.sortOrder),
  };
}

function CategoryDialog({
  open,
  onOpenChange,
  mode,
  initial,
  categoryId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  mode: "create" | "edit";
  initial: FormState;
  categoryId?: string;
}) {
  const locale = useLocale() as Locale;
  const queryClient = useQueryClient();
  const createM = useMutation(createCategoryMutation(queryClient));
  const updateM = useMutation(updateCategoryMutation(queryClient));
  const [form, setForm] = React.useState<FormState>(initial);
  const [uploading, setUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const imageInputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    if (open) {
      setForm(initial);
      setUploading(false);
      setUploadError(null);
    }
  }, [open, initial]);

  const pending = createM.isPending || updateM.isPending;
  const bind = <K extends keyof FormState>(key: K) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((s) => ({ ...s, [key]: e.target.value }));

  const handleImageFileChosen = async (file: File) => {
    setUploadError(null);
    setUploading(true);
    try {
      const url = await uploadImage(file, "categories", locale);
      setForm((s) => ({ ...s, imageUrl: url }));
    } catch (err) {
      setUploadError((err as Error).message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const submit = () => {
    const sortOrder = Number(form.sortOrder) || 0;
    if (mode === "create") {
      createM.mutate(
        {
          slug: form.slug.trim(),
          name: form.name.trim(),
          nameAm: form.nameAm.trim() || undefined,
          imageUrl: form.imageUrl.trim(),
          sortOrder,
        },
        {
          onSuccess: () => {
            toast.success("Category created");
            onOpenChange(false);
          },
          onError: (err: unknown) =>
            toast.error(err instanceof Error ? err.message : "Failed"),
        },
      );
    } else if (categoryId) {
      updateM.mutate(
        {
          id: categoryId,
          body: {
            slug: form.slug.trim(),
            name: form.name.trim(),
            nameAm: form.nameAm.trim() ? form.nameAm.trim() : null,
            imageUrl: form.imageUrl.trim(),
            sortOrder,
          },
        },
        {
          onSuccess: () => {
            toast.success("Category updated");
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "New category" : "Edit category"}</DialogTitle>
          <DialogDescription>Categories drive the storefront navigation.</DialogDescription>
        </DialogHeader>
        <div className="grid min-w-0 gap-3">
          <div className="grid gap-1">
            <Label htmlFor="cat-slug">Slug</Label>
            <Input id="cat-slug" value={form.slug} onChange={bind("slug")} placeholder="crochet" />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="cat-name">Name (English)</Label>
            <Input id="cat-name" value={form.name} onChange={bind("name")} placeholder="Crochet" />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="cat-name-am">Name (Amharic, optional)</Label>
            <Input id="cat-name-am" value={form.nameAm} onChange={bind("nameAm")} />
          </div>
          <div className="min-w-0 grid gap-1">
            <Label>Image</Label>
            <div className="flex min-w-0 items-start gap-3 overflow-hidden rounded-lg border border-border bg-muted/20 p-3">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
                {form.imageUrl ? (
                  <img
                    src={assetUrl(form.imageUrl)}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <ImageIcon className="size-6 text-muted-foreground" aria-hidden />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleImageFileChosen(file);
                    e.target.value = "";
                  }}
                />
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={uploading}
                    onClick={() => imageInputRef.current?.click()}
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="mr-1.5 size-3.5 animate-spin" /> Uploading…
                      </>
                    ) : (
                      <>
                        <Upload className="mr-1.5 size-3.5" />
                        {form.imageUrl ? "Replace" : "Choose file"}
                      </>
                    )}
                  </Button>
                  {form.imageUrl ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={uploading}
                      onClick={() => {
                        setForm((s) => ({ ...s, imageUrl: "" }));
                        setUploadError(null);
                      }}
                    >
                      <Trash2 className="mr-1.5 size-3.5" />
                      Remove
                    </Button>
                  ) : null}
                </div>
                {form.imageUrl && !uploading && (
                  <p className="mt-1 max-w-full break-all text-xs text-muted-foreground">{form.imageUrl}</p>
                )}
                {uploadError ? (
                  <p className="mt-1 text-xs text-destructive">{uploadError}</p>
                ) : null}
              </div>
            </div>
          </div>
          <div className="grid gap-1">
            <Label htmlFor="cat-sort">Sort order</Label>
            <Input
              id="cat-sort"
              type="number"
              value={form.sortOrder}
              onChange={bind("sortOrder")}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={
              pending ||
              uploading ||
              !form.slug.trim() ||
              !form.name.trim() ||
              !form.imageUrl.trim()
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

function CategoryActions({
  category,
  onEdit,
}: {
  category: AdminCategoryListItem;
  onEdit: (c: AdminCategoryListItem) => void;
}) {
  const queryClient = useQueryClient();
  const deleteM = useMutation(deleteCategoryMutation(queryClient));

  const handleDelete = () => {
    if (!window.confirm(`Delete category "${category.name}"?`)) return;
    deleteM.mutate(category.id, {
      onSuccess: () => toast.success("Category deleted"),
      onError: (err: unknown) =>
        toast.error(err instanceof Error ? err.message : "Failed to delete"),
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
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            onEdit(category);
          }}
        >
          Edit
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={deleteM.isPending}
          onSelect={(e) => {
            e.preventDefault();
            handleDelete();
          }}
          className="text-destructive focus:text-destructive"
        >
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function buildColumns(
  onEdit: (c: AdminCategoryListItem) => void,
): ColumnDef<AdminCategoryListItem>[] {
  return [
    {
      id: "image",
      header: () => <span className="sr-only">Image</span>,
      cell: ({ row }) => {
        const url = row.original.imageUrl?.trim();
        return (
          <div className="size-9 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
            {url ? (
              <img src={assetUrl(url)} alt="" className="size-full object-cover" />
            ) : (
              <div className="flex size-full items-center justify-center text-muted-foreground">
                <ImageIcon className="size-4" aria-hidden />
              </div>
            )}
          </div>
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: "name",
      header: "Category",
      cell: ({ row }) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{row.original.name}</p>
          <p className="truncate text-xs text-muted-foreground">{row.original.slug}</p>
        </div>
      ),
    },
    {
      accessorKey: "nameAm",
      header: "Amharic",
      cell: ({ row }) =>
        row.original.nameAm ? (
          <span className="text-sm">{row.original.nameAm}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      accessorKey: "listingCount",
      header: () => <div className="text-right">Listings</div>,
      cell: ({ row }) => (
        <div className="text-right tabular-nums">{row.original.listingCount}</div>
      ),
    },
    {
      accessorKey: "sortOrder",
      header: () => <div className="text-right">Sort</div>,
      cell: ({ row }) => (
        <div className="text-right tabular-nums text-muted-foreground">
          {row.original.sortOrder}
        </div>
      ),
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => <CategoryActions category={row.original} onEdit={onEdit} />,
      enableSorting: false,
      enableHiding: false,
    },
  ];
}

export function AdminCategoriesPage() {
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const { data, isLoading } = useQuery(
    adminCategoriesQuery({ q: search || undefined, page, pageSize: 25 }),
  );

  const [createOpen, setCreateOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<AdminCategoryListItem | null>(null);

  const handleEdit = React.useCallback((c: AdminCategoryListItem) => {
    setEditing(c);
    setEditOpen(true);
  }, []);

  const columns = React.useMemo(() => buildColumns(handleEdit), [handleEdit]);

  return (
    <div className="@container/main flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          className="h-8 w-full max-w-sm rounded-md border border-input bg-background px-3 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          placeholder="Search name or slug…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <span className="text-xs text-muted-foreground">
          {data ? `${data.total} categor${data.total === 1 ? "y" : "ies"}` : "…"}
        </span>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="ml-auto h-8">
              <Plus />
              New category
            </Button>
          </DialogTrigger>
          <CategoryDialog
            open={createOpen}
            onOpenChange={setCreateOpen}
            mode="create"
            initial={emptyForm()}
          />
        </Dialog>
      </div>

      <SellerShellDataTable
        columns={columns}
        data={data?.categories ?? []}
        filterColumnId="name"
        filterPlaceholder=""
        countNoun="category"
        isLoading={isLoading}
        showFilter={false}
        showPagination={false}
      />

      {data ? (
        <DataPagination page={data.page} totalPages={data.totalPages} onPageChange={setPage} />
      ) : null}

      {editing ? (
        <CategoryDialog
          open={editOpen}
          onOpenChange={(v) => {
            setEditOpen(v);
            if (!v) setEditing(null);
          }}
          mode="edit"
          initial={fromCategory(editing)}
          categoryId={editing.id}
        />
      ) : null}
    </div>
  );
}
