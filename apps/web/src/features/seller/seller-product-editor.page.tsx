import type { Locale } from "@ys/intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { useLocale } from "@/lib/locale-path";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { categoriesQuery } from "@/features/storefront/storefront.queries";
import {
  categoryAttributeDefinitionsQuery,
  createSellerProductMutationOptions,
  deleteSellerProductMutationOptions,
  sellerProductDetailQuery,
  updateSellerProductMutationOptions,
  type CategoryAttributeDefinitionDto,
  type CreateSellerProductBody,
  type SellerAttributeInput,
} from "./seller.queries";
import { getCategoryDescriptionHints } from "./description-hints";

type VariantForm = {
  label: string;
  price: string;
  stock: string;
};

const emptyVariant = (): VariantForm => ({ label: "", price: "", stock: "0" });

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

export function SellerProductNewPage() {
  return <SellerProductEditor mode="new" />;
}

export function SellerProductEditPage({ productId }: { productId: string }) {
  return <SellerProductEditor mode="edit" productId={productId} />;
}

function SellerProductEditor({
  mode,
  productId,
}: {
  mode: "new" | "edit";
  productId?: string;
}) {
  const locale = useLocale() as Locale;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: categoriesData } = useQuery(categoriesQuery(locale));

  const [attrValues, setAttrValues] = useState<Record<string, string>>({});

  const detailQuery = useQuery({
    ...sellerProductDetailQuery(locale, productId ?? ""),
    enabled: mode === "edit" && !!productId,
  });

  const createMut = useMutation(createSellerProductMutationOptions(queryClient, locale));
  const updateMut = useMutation(
    updateSellerProductMutationOptions(queryClient, locale, productId ?? ""),
  );
  const deleteMut = useMutation(deleteSellerProductMutationOptions(queryClient, locale, productId ?? ""));

  const [categorySlug, setCategorySlug] = useState("");
  const attrsQuery = useQuery({
    ...categoryAttributeDefinitionsQuery(locale, categorySlug),
    enabled: Boolean(categorySlug),
  });
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [imagesText, setImagesText] = useState("");
  const [variants, setVariants] = useState<VariantForm[]>([emptyVariant()]);
  const [publish, setPublish] = useState(false);

  useEffect(() => {
    if (mode !== "edit" || !detailQuery.data) return;
    const p = detailQuery.data.product;
    setCategorySlug(p.categorySlug);
    setName(p.name);
    setSlug(p.slug);
    setDescription(p.description);
    setImagesText(p.images.join("\n"));
    setVariants(
      p.variants.map((v) => ({
        label: v.label,
        price: String(v.price),
        stock: String(v.stock),
      })),
    );
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
  }, [mode, detailQuery.data]);

  const buildBody = (): CreateSellerProductBody => {
    const images = imagesText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    const variantRows = variants.map((v) => ({
      label: v.label.trim(),
      price: Number(v.price),
      stock: Number.parseInt(v.stock, 10) || 0,
    }));
    if (!categorySlug) throw new Error("Choose a category");
    if (variantRows.some((v) => !v.label || Number.isNaN(v.price))) {
      throw new Error("Each variant needs a label and valid price");
    }
    const attrsPayload = buildAttributesPayload(attrsQuery.data?.definitions ?? [], attrValues);
    return {
      categorySlug,
      name: name.trim(),
      slug: slug.trim().toLowerCase(),
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
            void navigate({ to: "/$locale/sell/dashboard", params: { locale } });
          },
        });
      } else if (productId) {
        updateMut.mutate({
          ...body,
          isPublished: publish,
        });
      }
    } catch (err) {
      window.alert((err as Error).message);
    }
  };

  if (mode === "edit" && detailQuery.isLoading) {
    return (
      <main className="mx-auto max-w-2xl py-12">
        <p className="text-muted-foreground">Loading…</p>
      </main>
    );
  }

  if (mode === "edit" && detailQuery.isError) {
    return (
      <main className="mx-auto max-w-2xl py-12">
        <p className="text-destructive">Could not load product.</p>
        <Button className="mt-4" variant="outline" asChild>
          <Link to="/$locale/sell/dashboard" params={{ locale }}>
            Back
          </Link>
        </Button>
      </main>
    );
  }

  const descHints = getCategoryDescriptionHints(categorySlug || undefined);

  return (
    <main className="mx-auto max-w-2xl py-12">
      <div className="mb-8">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/$locale/sell/dashboard" params={{ locale }}>
            ← Dashboard
          </Link>
        </Button>
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">
        {mode === "new" ? "New product" : "Edit product"}
      </h1>
      <form className="mt-8 space-y-4" onSubmit={onSubmit}>
        <div className="space-y-2">
          <Label htmlFor="cat">Category</Label>
          <select
            id="cat"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={categorySlug}
            onChange={(e) => {
              setCategorySlug(e.target.value);
              setAttrValues({});
            }}
            required
          >
            <option value="">Select…</option>
            {categoriesData?.categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
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
                  <select
                    id={`attr-${d.key}`}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={attrValues[d.key] ?? ""}
                    required={d.isRequired}
                    onChange={(e) => {
                      const v = e.target.value;
                      setAttrValues((prev) => ({ ...prev, [d.key]: v }));
                    }}
                  >
                    <option value="">{d.isRequired ? "Select…" : "Optional"}</option>
                    {d.options.map((o) => (
                      <option key={o.key} value={o.key}>
                        {o.label}
                      </option>
                    ))}
                  </select>
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
                  <select
                    id={`attr-${d.key}`}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={attrValues[d.key] ?? ""}
                    required={d.isRequired}
                    onChange={(e) =>
                      setAttrValues((prev) => ({ ...prev, [d.key]: e.target.value }))
                    }
                  >
                    <option value="">{d.isRequired ? "Select…" : "Optional"}</option>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
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
          <Label htmlFor="pslug">Product slug (URL)</Label>
          <Input
            id="pslug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            required
            disabled={mode === "edit"}
          />
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
        <div className="space-y-2">
          <Label htmlFor="imgs">Image URLs (one per line)</Label>
          <Textarea
            id="imgs"
            value={imagesText}
            onChange={(e) => setImagesText(e.target.value)}
            required
            rows={4}
            placeholder="https://..."
          />
        </div>
        <div className="space-y-2">
          <Label>Variants</Label>
          {variants.map((v, i) => (
            <div key={i} className="flex flex-wrap gap-2">
              <Input
                placeholder="Label"
                value={v.label}
                onChange={(e) => {
                  const next = [...variants];
                  next[i] = { ...v, label: e.target.value };
                  setVariants(next);
                }}
              />
              <Input
                placeholder="Price"
                type="number"
                step="0.01"
                className="w-28"
                value={v.price}
                onChange={(e) => {
                  const next = [...variants];
                  next[i] = { ...v, price: e.target.value };
                  setVariants(next);
                }}
              />
              <Input
                placeholder="Stock"
                type="number"
                className="w-24"
                value={v.stock}
                onChange={(e) => {
                  const next = [...variants];
                  next[i] = { ...v, stock: e.target.value };
                  setVariants(next);
                }}
              />
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setVariants([...variants, emptyVariant()])}
          >
            Add variant
          </Button>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={publish}
            onChange={(e) => setPublish(e.target.checked)}
          />
          Publish on marketplace (shop must be active)
        </label>
        {(createMut.isError || updateMut.isError) && (
          <p className="text-sm text-destructive">
            {((createMut.error ?? updateMut.error) as Error)?.message}
          </p>
        )}
        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={createMut.isPending || updateMut.isPending}>
            {mode === "new" ? "Create" : "Save"}
          </Button>
          {mode === "edit" && productId && (
            <Button
              type="button"
              variant="outline"
              className="border-destructive text-destructive hover:bg-destructive/10"
              disabled={deleteMut.isPending}
              onClick={() => {
                if (!window.confirm("Delete this product?")) return;
                deleteMut.mutate(undefined, {
                  onSuccess: () => {
                    void navigate({ to: "/$locale/sell/dashboard", params: { locale } });
                  },
                });
              }}
            >
              Delete
            </Button>
          )}
        </div>
      </form>
    </main>
  );
}
