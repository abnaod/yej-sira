import type { Locale } from "@ys/intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { Loader2, Plus, Trash2, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { assetUrl, uploadImage } from "@/lib/api";
import { useLocale } from "@/lib/locale-path";

import { Button } from "@/components/ui/button";
import { DialogBody, DialogFooter, DialogMain } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { categoriesQuery } from "@/features/store/home/home.queries";
import {
  categoryAttributeDefinitionsQuery,
  createSellerListingMutationOptions,
  sellerListingDetailQuery,
  updateSellerListingMutationOptions,
  type CategoryAttributeDefinitionDto,
  type CreateSellerListingBody,
  type SellerAttributeInput,
} from "./listings.queries";
import { getCategoryDescriptionHints } from "../shared/description-hints";

type VariantForm = {
  label: string;
  price: string;
  stock: string;
};

/**
 * One slot in the listing image "field array". Each slot is either empty,
 * currently uploading, or has a resolved `/static/uploads/...` URL. Using a
 * stable `id` lets React keep focus/previews when rows are reordered or removed.
 */
type ImageSlot = {
  id: string;
  url: string | null;
  uploading: boolean;
  error: string | null;
};

const emptyVariant = (): VariantForm => ({ label: "", price: "", stock: "0" });

/** Single-option listings send one variant; label is not shown in the seller form. */
const DEFAULT_LISTING_OPTION_LABEL = "Default";

let imageSlotCounter = 0;
const makeImageSlot = (url: string | null = null): ImageSlot => {
  imageSlotCounter += 1;
  return { id: `img-${imageSlotCounter}`, url, uploading: false, error: null };
};

const SELLER_LISTING_EMBEDDED_FORM_ID = "seller-listing-embedded-form";

/** Kebab-case slug from listing name; matches API `listingSlugSchema` (min 2, max 120). */
function slugifyListingName(name: string): string {
  const raw = name
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
  let out = raw.slice(0, 120);
  if (out.length === 1) {
    out = `${out}0`;
  }
  if (out.length === 0) {
    out = "listing";
  }
  return out;
}

function buildAttributesPayload(
  defs: CategoryAttributeDefinitionDto[],
  values: Record<string, string>,
): SellerAttributeInput[] {
  const out: SellerAttributeInput[] = [];
  for (const d of defs) {
    const raw = values[d.key];
    if (d.inputType === "select") {
      if (raw) out.push({ key: d.key, allowedValueKey: raw });
    } else if (d.inputType === "text") {
      const t = raw?.trim();
      if (t) out.push({ key: d.key, textValue: t });
    } else if (d.inputType === "number") {
      if (raw != null && raw !== "") {
        const n = Number(raw);
        if (!Number.isNaN(n)) out.push({ key: d.key, numberValue: n });
      }
    } else if (d.inputType === "boolean") {
      if (raw === "true" || raw === "false") {
        out.push({ key: d.key, booleanValue: raw === "true" });
      }
    }
  }
  return out;
}

export function SellerListingNewDialogForm({
  onCreated,
  onCancel,
}: {
  onCreated: () => void;
  onCancel: () => void;
}) {
  return <SellerListingEditor mode="new" embedded onCreated={onCreated} onCancel={onCancel} />;
}

export function SellerListingEditDialogForm({
  listingId,
  onSaved,
  onCancel,
}: {
  listingId: string;
  onSaved: () => void;
  onCancel: () => void;
}) {
  return (
    <SellerListingEditor
      mode="edit"
      listingId={listingId}
      embedded
      onSaved={onSaved}
      onCancel={onCancel}
    />
  );
}

function SellerListingEditor({
  mode,
  listingId,
  embedded = false,
  onCreated,
  onSaved,
  onCancel,
}: {
  mode: "new" | "edit";
  listingId?: string;
  embedded?: boolean;
  onCreated?: () => void;
  onSaved?: () => void;
  onCancel?: () => void;
}) {
  const locale = useLocale() as Locale;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: categoriesData } = useQuery(categoriesQuery(locale));

  const [attrValues, setAttrValues] = useState<Record<string, string>>({});

  const detailQuery = useQuery({
    ...sellerListingDetailQuery(locale, listingId ?? ""),
    enabled: mode === "edit" && !!listingId,
  });

  const createMut = useMutation(createSellerListingMutationOptions(queryClient, locale));
  const updateMut = useMutation(
    updateSellerListingMutationOptions(queryClient, locale, listingId ?? ""),
  );

  const [categorySlug, setCategorySlug] = useState("");
  const attrsQuery = useQuery({
    ...categoryAttributeDefinitionsQuery(locale, categorySlug),
    enabled: Boolean(categorySlug),
  });
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [imageSlots, setImageSlots] = useState<ImageSlot[]>(() => [makeImageSlot()]);
  /** Simple price/stock: new listings and single-variant edits. */
  const [simplePrice, setSimplePrice] = useState("");
  const [simpleStock, setSimpleStock] = useState("1");
  /** Multi-variant: only when editing a listing with more than one variant. */
  const [multiVariants, setMultiVariants] = useState<VariantForm[]>([]);
  const [publish, setPublish] = useState(false);

  /** Apply server listing into form state once per open listing — not on every detail refetch,
   *  or React Query would reset images/fields and wipe extra image slots the user added. */
  const hasHydratedFromDetailRef = useRef(false);

  useEffect(() => {
    hasHydratedFromDetailRef.current = false;
  }, [listingId]);

  useEffect(() => {
    if (mode !== "edit" || !detailQuery.data || !listingId) return;
    const p = detailQuery.data.listing;
    if (p.id !== listingId) return;
    if (hasHydratedFromDetailRef.current) return;
    hasHydratedFromDetailRef.current = true;

    setCategorySlug(p.categorySlug);
    setName(p.name);
    setSlug(p.slug);
    setDescription(p.description);
    setImageSlots(
      p.images.length > 0 ? p.images.map((u) => makeImageSlot(u)) : [makeImageSlot()],
    );
    if (p.variants.length > 1) {
      setMultiVariants(
        p.variants.map((v) => ({
          label: v.label,
          price: String(v.price),
          stock: String(v.stock),
        })),
      );
    } else {
      setMultiVariants([]);
      const v0 = p.variants[0];
      if (v0) {
        setSimplePrice(String(v0.price));
        setSimpleStock(String(v0.stock));
      } else {
        setSimplePrice("");
        setSimpleStock("1");
      }
    }
    setPublish(p.isPublished);
    if (p.attributes?.length) {
      const m: Record<string, string> = {};
      for (const a of p.attributes) {
        if (a.allowedValueKey) m[a.key] = a.allowedValueKey;
        else if (a.textValue != null) m[a.key] = a.textValue;
        else if (a.numberValue != null) m[a.key] = String(a.numberValue);
        else if (a.booleanValue !== undefined) m[a.key] = a.booleanValue ? "true" : "false";
      }
      setAttrValues(m);
    } else {
      setAttrValues({});
    }
  }, [mode, detailQuery.data, listingId]);

  const multiVariantMode =
    mode === "edit" && (detailQuery.data?.listing.variants.length ?? 0) > 1;

  const buildBody = (): CreateSellerListingBody => {
    if (imageSlots.some((s) => s.uploading)) {
      throw new Error("Wait for image uploads to finish");
    }
    const images = imageSlots
      .map((s) => s.url?.trim() ?? "")
      .filter(Boolean);
    if (images.length === 0) {
      throw new Error("Attach at least one image");
    }
    if (!categorySlug) throw new Error("Choose a category");

    let variantRows: { label: string; price: number; stock: number }[];
    if (multiVariantMode) {
      if (multiVariants.length === 0) {
        throw new Error("Add at least one option");
      }
      variantRows = multiVariants.map((v) => ({
        label: v.label.trim(),
        price: Number(v.price),
        stock: Number.parseInt(v.stock, 10) || 0,
      }));
      if (variantRows.some((v) => !v.label || Number.isNaN(v.price) || v.price <= 0)) {
        throw new Error("Each option needs a label and a valid price");
      }
    } else {
      const price = Number(simplePrice);
      const stock = Number.parseInt(simpleStock, 10) || 0;
      if (Number.isNaN(price) || price <= 0) {
        throw new Error("Enter a valid price");
      }
      variantRows = [{ label: DEFAULT_LISTING_OPTION_LABEL, price, stock }];
    }
    const attrsPayload = buildAttributesPayload(attrsQuery.data?.definitions ?? [], attrValues);
    return {
      categorySlug,
      name: name.trim(),
      slug:
        mode === "new" ? slugifyListingName(name.trim()) : slug.trim().toLowerCase(),
      description: description.trim(),
      images,
      variants: variantRows,
      isPublished: publish,
      attributes: attrsPayload,
    };
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const body = buildBody();
      if (mode === "new") {
        createMut.mutate(body, {
          onSuccess: () => {
            if (onCreated) onCreated();
            else
              void navigate({
                to: "/$locale/sell/listings",
                params: { locale },
                search: { new: false, edit: undefined },
              });
          },
        });
      } else if (listingId) {
        updateMut.mutate(
          {
            ...body,
            isPublished: publish,
          },
          {
            onSuccess: () => {
              onSaved?.();
            },
          },
        );
      }
    } catch (err) {
      window.alert((err as Error).message);
    }
  };

  if (mode === "edit" && detailQuery.isLoading) {
    if (embedded) {
      return (
        <DialogMain>
          <DialogBody className="mx-0 px-6 py-8">
            <p className="text-sm text-muted-foreground">Loading…</p>
          </DialogBody>
        </DialogMain>
      );
    }
    return (
      <main className="mx-auto max-w-2xl py-12">
        <p className="text-muted-foreground">Loading…</p>
      </main>
    );
  }

  if (mode === "edit" && detailQuery.isError) {
    if (embedded) {
      return (
        <DialogMain>
          <DialogBody className="mx-0 space-y-4 px-6 py-8">
            <p className="text-sm text-destructive">Could not load listing.</p>
            <Button type="button" variant="outline" onClick={() => onCancel?.()}>
              Close
            </Button>
          </DialogBody>
        </DialogMain>
      );
    }
    return (
      <main className="mx-auto max-w-2xl py-12">
        <p className="text-destructive">Could not load listing.</p>
        <Button className="mt-4" variant="outline" asChild>
          <Link to="/$locale/sell/listings" params={{ locale }} search={{ new: false, edit: undefined }}>
            Back
          </Link>
        </Button>
      </main>
    );
  }

  const descHints = getCategoryDescriptionHints(categorySlug || undefined);

  const updateImageSlot = (id: string, patch: Partial<ImageSlot>) => {
    setImageSlots((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  const handleImageFileChosen = async (id: string, file: File) => {
    updateImageSlot(id, { uploading: true, error: null });
    try {
      const url = await uploadImage(file, "listings", locale);
      updateImageSlot(id, { url, uploading: false, error: null });
    } catch (err) {
      updateImageSlot(id, {
        uploading: false,
        error: (err as Error).message || "Upload failed",
      });
    }
  };

  const addImageSlot = () => {
    setImageSlots((prev) => [...prev, makeImageSlot()]);
  };

  const removeImageSlot = (id: string) => {
    setImageSlots((prev) => {
      const next = prev.filter((s) => s.id !== id);
      return next.length > 0 ? next : [makeImageSlot()];
    });
  };

  const form = (
    <form
      id={embedded ? SELLER_LISTING_EMBEDDED_FORM_ID : undefined}
      className={embedded ? "space-y-4" : "mt-8 space-y-4"}
      onSubmit={onSubmit}
    >
      <div className="space-y-2">
        <Label htmlFor="cat">Category</Label>
        <NativeSelect
          id="cat"
          value={categorySlug}
          onChange={(e) => {
            setCategorySlug(e.target.value);
            setAttrValues({});
          }}
          required
        >
          <NativeSelectOption value="">Select…</NativeSelectOption>
          {categoriesData?.categories.map((c) => (
            <NativeSelectOption key={c.slug} value={c.slug}>
              {c.name}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>
      {categorySlug && attrsQuery.data && attrsQuery.data.definitions.length > 0 && (
        <div className="space-y-4 rounded-lg border border-border p-4">
          <p className="text-sm font-medium">Listing details</p>
          {attrsQuery.data.definitions.map((d) => (
            <div key={d.key} className="space-y-2">
              <Label htmlFor={`attr-${d.key}`}>
                {d.label}
                {d.isRequired ? " *" : ""}
              </Label>
              {d.inputType === "select" && d.options && (
                <NativeSelect
                  id={`attr-${d.key}`}
                  value={attrValues[d.key] ?? ""}
                  required={d.isRequired}
                  onChange={(e) => {
                    const v = e.target.value;
                    setAttrValues((prev) => ({ ...prev, [d.key]: v }));
                  }}
                >
                  <NativeSelectOption value="">
                    {d.isRequired ? "Select…" : "Optional"}
                  </NativeSelectOption>
                  {d.options.map((o) => (
                    <NativeSelectOption key={o.key} value={o.key}>
                      {o.label}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              )}
              {d.inputType === "text" && (
                <Input
                  id={`attr-${d.key}`}
                  value={attrValues[d.key] ?? ""}
                  required={d.isRequired}
                  onChange={(e) =>
                    setAttrValues((prev) => ({ ...prev, [d.key]: e.target.value }))
                  }
                />
              )}
              {d.inputType === "number" && (
                <Input
                  id={`attr-${d.key}`}
                  type="number"
                  step="any"
                  value={attrValues[d.key] ?? ""}
                  required={d.isRequired}
                  onChange={(e) =>
                    setAttrValues((prev) => ({ ...prev, [d.key]: e.target.value }))
                  }
                />
              )}
              {d.inputType === "boolean" && (
                <NativeSelect
                  id={`attr-${d.key}`}
                  value={attrValues[d.key] ?? ""}
                  required={d.isRequired}
                  onChange={(e) =>
                    setAttrValues((prev) => ({ ...prev, [d.key]: e.target.value }))
                  }
                >
                  <NativeSelectOption value="">
                    {d.isRequired ? "Select…" : "Optional"}
                  </NativeSelectOption>
                  <NativeSelectOption value="true">Yes</NativeSelectOption>
                  <NativeSelectOption value="false">No</NativeSelectOption>
                </NativeSelect>
              )}
            </div>
          ))}
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="pname">Name</Label>
        <Input id="pname" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="pdesc">Description</Label>
        <Textarea
          id="pdesc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          rows={5}
          placeholder={descHints.placeholder}
        />
        <p className="text-xs text-muted-foreground">{descHints.tip}</p>
      </div>
      <div className="space-y-3">
        <Label>Images</Label>
        <p className="text-xs text-muted-foreground">
          Attach images one at a time. PNG, JPG, WEBP, or GIF, max 5MB each.
        </p>
        <div className="space-y-3">
          {imageSlots.map((slot, i) => (
            <ImageSlotRow
              key={slot.id}
              slot={slot}
              index={i}
              onFileChosen={(file) => void handleImageFileChosen(slot.id, file)}
              onRemove={() => removeImageSlot(slot.id)}
            />
          ))}
        </div>
        <Button type="button" variant="outline" size="sm" onClick={addImageSlot}>
          <Plus className="mr-1.5 size-3.5" />
          Add image
        </Button>
      </div>
      {multiVariantMode ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            This listing has several price options. Edit each option below, or remove options you no
            longer need before saving.
          </p>
          <Label>Options</Label>
          <div className="space-y-3">
            {multiVariants.map((v, i) => (
              <div
                key={i}
                className="rounded-lg border border-border bg-muted/20 p-4"
              >
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2 sm:min-w-0">
                    <Label htmlFor={`variant-${i}-label`}>Label</Label>
                    <Input
                      id={`variant-${i}-label`}
                      placeholder="e.g. Size M, Red"
                      value={v.label}
                      onChange={(e) => {
                        const next = [...multiVariants];
                        next[i] = { ...v, label: e.target.value };
                        setMultiVariants(next);
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`variant-${i}-price`}>Price</Label>
                    <Input
                      id={`variant-${i}-price`}
                      type="number"
                      step="0.01"
                      inputMode="decimal"
                      value={v.price}
                      onChange={(e) => {
                        const next = [...multiVariants];
                        next[i] = { ...v, price: e.target.value };
                        setMultiVariants(next);
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`variant-${i}-stock`}>Stock</Label>
                    <Input
                      id={`variant-${i}-stock`}
                      type="number"
                      min={0}
                      inputMode="numeric"
                      value={v.stock}
                      onChange={(e) => {
                        const next = [...multiVariants];
                        next[i] = { ...v, stock: e.target.value };
                        setMultiVariants(next);
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setMultiVariants([...multiVariants, emptyVariant()])}
          >
            Add option
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Set the price and how many you have in stock. Most handmade listings use quantity 1.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="simple-price">Price</Label>
              <Input
                id="simple-price"
                type="number"
                step="0.01"
                min="0.01"
                inputMode="decimal"
                value={simplePrice}
                onChange={(e) => setSimplePrice(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="simple-stock">Stock</Label>
              <Input
                id="simple-stock"
                type="number"
                min={0}
                inputMode="numeric"
                value={simpleStock}
                onChange={(e) => setSimpleStock(e.target.value)}
                required
              />
            </div>
          </div>
        </div>
      )}
      {(createMut.isError || updateMut.isError) && (
        <p className="text-sm text-destructive">
          {((createMut.error ?? updateMut.error) as Error)?.message}
        </p>
      )}
      {!embedded && (
        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={createMut.isPending || updateMut.isPending}>
            {mode === "new" ? "Create" : "Save"}
          </Button>
        </div>
      )}
    </form>
  );

  if (embedded) {
    const savePending = mode === "new" ? createMut.isPending : updateMut.isPending;
    return (
      <DialogMain>
        <DialogBody className="mx-0 px-6 py-4">{form}</DialogBody>
        <DialogFooter className="mx-0 gap-2 border-border px-8 py-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" disabled={savePending} onClick={() => onCancel?.()}>
            Cancel
          </Button>
          <Button type="submit" form={SELLER_LISTING_EMBEDDED_FORM_ID} disabled={savePending}>
            {mode === "new"
              ? createMut.isPending
                ? "Creating…"
                : "Create listing"
              : updateMut.isPending
                ? "Saving…"
                : "Save"}
          </Button>
        </DialogFooter>
      </DialogMain>
    );
  }

  return (
    <main className="mx-auto max-w-2xl py-12">
      <div className="mb-8">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/$locale/sell/listings" params={{ locale }} search={{ new: false, edit: undefined }}>
            ← Listings
          </Link>
        </Button>
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">
        {mode === "new" ? "New listing" : "Edit listing"}
      </h1>
      <p className="mt-2 text-xss text-muted-foreground">
        {mode === "new"
          ? "Add category, price, stock, images, and description for your listing."
          : "Update this listing's details, price, stock, and images."}
      </p>
      {form}
    </main>
  );
}

function ImageSlotRow({
  slot,
  index,
  onFileChosen,
  onRemove,
}: {
  slot: ImageSlot;
  index: number;
  onFileChosen: (file: File) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/20 p-3">
      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
        {slot.url ? (
          <img src={assetUrl(slot.url)} alt={`Image ${index + 1}`} className="h-full w-full object-cover" />
        ) : (
          <span className="text-xs text-muted-foreground">#{index + 1}</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFileChosen(file);
            e.target.value = "";
          }}
        />
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={slot.uploading}
            onClick={() => inputRef.current?.click()}
          >
            {slot.uploading ? (
              <>
                <Loader2 className="mr-1.5 size-3.5 animate-spin" /> Uploading…
              </>
            ) : (
              <>
                <Upload className="mr-1.5 size-3.5" />
                {slot.url ? "Replace" : "Choose file"}
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
            disabled={slot.uploading}
          >
            <Trash2 className="mr-1.5 size-3.5" />
            Remove
          </Button>
        </div>
        {slot.url && !slot.uploading && (
          <p className="mt-1 truncate text-xs text-muted-foreground">{slot.url}</p>
        )}
        {slot.error && <p className="mt-1 text-xs text-destructive">{slot.error}</p>}
      </div>
    </div>
  );
}
