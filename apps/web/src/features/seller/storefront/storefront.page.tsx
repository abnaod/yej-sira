import type { Locale } from "@ys/intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ExternalLink, Loader2, Trash2, Upload } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { authClient } from "@/lib/auth-client";
import { apiFetchJson, assetUrl, uploadImage } from "@/lib/api";
import { useLocale } from "@/lib/locale-path";
import { myShopQuery, type MyShop, type ShopSocialLinks, type UpdateShopBody } from "../shared/shop.queries";

/**
 * Form state mirrors the editable subset of a `MyShop`. Image fields stay as
 * strings (rendered via `assetUrl`), socialLinks is a flat object, and accent
 * color is a hex string. `null` round-trips to the API to clear a value.
 */
type FormState = {
  name: string;
  description: string;
  imageUrl: string | null;
  accentColor: string;
  contactEmail: string;
  contactPhone: string;
  socialLinks: ShopSocialLinks;
};

const DEFAULT_ACCENT = "#1f6feb";

function shopToForm(shop: MyShop): FormState {
  return {
    name: shop.name,
    description: shop.description ?? "",
    imageUrl: shop.imageUrl,
    accentColor: shop.accentColor ?? DEFAULT_ACCENT,
    contactEmail: shop.contactEmail ?? "",
    contactPhone: shop.contactPhone ?? "",
    socialLinks: { ...(shop.socialLinks ?? {}) },
  };
}

/**
 * Pure dirty-check between current and original form state. We keep this
 * outside the component so the equality logic is easy to scan.
 */
function isDirty(current: FormState, original: FormState): boolean {
  const keys: (keyof FormState)[] = [
    "name",
    "description",
    "imageUrl",
    "accentColor",
    "contactEmail",
    "contactPhone",
  ];
  for (const k of keys) {
    if (current[k] !== original[k]) return true;
  }
  const social: (keyof ShopSocialLinks)[] = [
    "website",
    "instagram",
    "facebook",
    "tiktok",
    "telegram",
    "whatsapp",
  ];
  for (const k of social) {
    if ((current.socialLinks[k] ?? "") !== (original.socialLinks[k] ?? "")) return true;
  }
  return false;
}

function emptyToUndef(input: string, original: string): string | undefined {
  const t = input.trim();
  if (t === original.trim()) return undefined;
  return t;
}

function buildPatch(current: FormState, original: FormState): UpdateShopBody {
  const patch: UpdateShopBody = {};

  const name = emptyToUndef(current.name, original.name);
  if (name !== undefined) patch.name = name;

  const description = emptyToUndef(current.description, original.description);
  if (description !== undefined) patch.description = description;

  if (current.imageUrl !== original.imageUrl) {
    patch.imageUrl = current.imageUrl ?? undefined;
  }
  if (current.accentColor !== original.accentColor) {
    patch.accentColor = current.accentColor === DEFAULT_ACCENT ? null : current.accentColor;
  }

  const contactEmail = emptyToUndef(current.contactEmail, original.contactEmail);
  if (contactEmail !== undefined) patch.contactEmail = contactEmail;

  const contactPhone = emptyToUndef(current.contactPhone, original.contactPhone);
  if (contactPhone !== undefined) patch.contactPhone = contactPhone;

  const socialKeys: (keyof ShopSocialLinks)[] = [
    "website",
    "instagram",
    "facebook",
    "tiktok",
    "telegram",
    "whatsapp",
  ];
  const socialLinks: ShopSocialLinks = {};
  let socialChanged = false;
  for (const k of socialKeys) {
    const next = (current.socialLinks[k] ?? "").trim();
    const prev = (original.socialLinks[k] ?? "").trim();
    if (next !== prev) socialChanged = true;
    if (next) socialLinks[k] = next;
  }
  if (socialChanged) patch.socialLinks = socialLinks;

  return patch;
}

export function SellerStorefrontPage() {
  const locale = useLocale() as Locale;
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();
  const shopState = useQuery({
    ...myShopQuery(locale),
    enabled: !!session?.user,
  });

  const shop = shopState.data && "shop" in shopState.data ? shopState.data.shop : null;

  const [form, setForm] = useState<FormState | null>(null);
  const [original, setOriginal] = useState<FormState | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const logoInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (shop && !form) {
      const initial = shopToForm(shop);
      setForm(initial);
      setOriginal(initial);
    }
  }, [shop, form]);

  const updateShop = useMutation({
    mutationKey: ["shops", "me", "update", "storefront", locale] as const,
    mutationFn: (body: UpdateShopBody) =>
      apiFetchJson<{ shop: MyShop }>("/api/shops/me", {
        method: "PATCH",
        body: JSON.stringify(body),
        locale,
      }),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ["shops", "me", locale] });
      void queryClient.invalidateQueries({ queryKey: ["shops", "me", "onboarding", locale] });
      const next = shopToForm(data.shop);
      setForm(next);
      setOriginal(next);
      toast.success("Storefront updated");
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Could not save storefront");
    },
  });

  const dirty = useMemo(
    () => (form && original ? isDirty(form, original) : false),
    [form, original],
  );

  if (!session?.user) {
    return (
      <div className="mx-auto max-w-3xl px-4">
        <p className="text-muted-foreground">Sign in to manage your storefront.</p>
      </div>
    );
  }

  if (shopState.isLoading || !form || !original) {
    return (
      <div className="mx-auto max-w-3xl px-4">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="mx-auto max-w-3xl px-4">
        <p className="text-muted-foreground">You don&apos;t have a shop yet.</p>
        <Button className="mt-4" asChild>
          <Link to="/$locale/sell/onboarding" params={{ locale }}>
            Register your shop
          </Link>
        </Button>
      </div>
    );
  }

  if (shop.status === "rejected" || shop.status === "suspended") {
    return (
      <div className="mx-auto max-w-3xl px-4">
        <p className="text-muted-foreground">
          Your shop is {shop.status}. Contact support if you believe this is an error.
        </p>
      </div>
    );
  }

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => (f ? { ...f, [key]: value } : f));
  };
  const updateSocial = (key: keyof ShopSocialLinks, value: string) => {
    setForm((f) => (f ? { ...f, socialLinks: { ...f.socialLinks, [key]: value } } : f));
  };

  async function handleLogoFile(file: File) {
    setLogoUploading(true);
    try {
      const url = await uploadImage(file, "shops", locale);
      updateField("imageUrl", url);
    } catch (e) {
      toast.error((e as Error).message || "Logo upload failed");
    } finally {
      setLogoUploading(false);
    }
  }

  function handleSubmit() {
    if (!form || !original) return;
    const patch = buildPatch(form, original);
    if (Object.keys(patch).length === 0) return;
    updateShop.mutate(patch);
  }

  function handleReset() {
    if (original) setForm(original);
  }

  return (
    <div className="@container/main mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 pb-24">
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Storefront</h1>
            <p className="text-sm text-muted-foreground">
              How your shop appears to buyers at{" "}
              <span className="font-medium text-foreground">/shops/{shop.slug}</span>.
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link
              to="/$locale/shops/$shopSlug"
              params={{ locale, shopSlug: shop.slug }}
              search={{ page: 1 }}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="size-3.5" />
              View storefront
            </Link>
          </Button>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Branding</CardTitle>
          <CardDescription>
            Logo, name, and accent color shown across your shop page.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <StorefrontPreview logoUrl={form.imageUrl} shopName={form.name} />

          <Separator />

          <LogoEditor
            previewUrl={form.imageUrl}
            uploading={logoUploading}
            inputRef={logoInputRef}
            onPick={() => logoInputRef.current?.click()}
            onClear={() => updateField("imageUrl", null)}
            onFile={(file) => void handleLogoFile(file)}
          />

          <Separator />

          <div className="flex flex-col gap-2">
            <Label htmlFor="accentColor">Accent color</Label>
            <div className="flex items-center gap-3">
              <input
                id="accentColor-swatch"
                type="color"
                value={form.accentColor}
                onChange={(e) => updateField("accentColor", e.target.value)}
                className="size-10 cursor-pointer rounded-md border border-border bg-transparent p-0"
                aria-label="Accent color picker"
              />
              <Input
                id="accentColor"
                value={form.accentColor}
                onChange={(e) => updateField("accentColor", e.target.value)}
                placeholder={DEFAULT_ACCENT}
                className="max-w-40 font-mono text-sm uppercase"
                maxLength={9}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => updateField("accentColor", DEFAULT_ACCENT)}
                disabled={form.accentColor === DEFAULT_ACCENT}
              >
                Reset
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Used for buttons and highlights on your storefront. Leave at the default to use
              the platform color.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>About your shop</CardTitle>
          <CardDescription>
            Help shoppers understand who they&apos;re buying from.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Shop name</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              maxLength={120}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              rows={4}
              maxLength={2000}
              placeholder="What you sell, where you make it, what makes your shop different…"
            />
            <p className="text-xs text-muted-foreground">
              {form.description.length}/2000
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact</CardTitle>
          <CardDescription>
            Public ways for buyers to reach you outside the chat.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="contactEmail">Contact email</Label>
            <Input
              id="contactEmail"
              type="email"
              value={form.contactEmail}
              onChange={(e) => updateField("contactEmail", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="contactPhone">Contact phone</Label>
            <Input
              id="contactPhone"
              value={form.contactPhone}
              onChange={(e) => updateField("contactPhone", e.target.value)}
              placeholder="+251 9XX XXX XXX"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Social & messaging</CardTitle>
          <CardDescription>
            Add full URLs (https://…). Telegram and WhatsApp work well for direct
            buyer questions.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <SocialField
            id="telegram"
            label="Telegram"
            placeholder="https://t.me/yourshop"
            value={form.socialLinks.telegram ?? ""}
            onChange={(v) => updateSocial("telegram", v)}
          />
          <SocialField
            id="whatsapp"
            label="WhatsApp"
            placeholder="https://wa.me/2519XXXXXXX"
            value={form.socialLinks.whatsapp ?? ""}
            onChange={(v) => updateSocial("whatsapp", v)}
          />
          <SocialField
            id="instagram"
            label="Instagram"
            placeholder="https://instagram.com/yourshop"
            value={form.socialLinks.instagram ?? ""}
            onChange={(v) => updateSocial("instagram", v)}
          />
          <SocialField
            id="facebook"
            label="Facebook"
            placeholder="https://facebook.com/yourshop"
            value={form.socialLinks.facebook ?? ""}
            onChange={(v) => updateSocial("facebook", v)}
          />
          <SocialField
            id="tiktok"
            label="TikTok"
            placeholder="https://tiktok.com/@yourshop"
            value={form.socialLinks.tiktok ?? ""}
            onChange={(v) => updateSocial("tiktok", v)}
          />
          <SocialField
            id="website"
            label="Website"
            placeholder="https://yourshop.com"
            value={form.socialLinks.website ?? ""}
            onChange={(v) => updateSocial("website", v)}
          />
        </CardContent>
      </Card>

      <div className="sticky bottom-0 -mx-4 flex items-center justify-between gap-2 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-sm">
        <p className="text-xs text-muted-foreground">
          {dirty ? "Unsaved changes" : "All changes saved"}
        </p>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            disabled={!dirty || updateShop.isPending}
            onClick={handleReset}
          >
            Reset
          </Button>
          <Button
            size="sm"
            disabled={!dirty || updateShop.isPending}
            onClick={handleSubmit}
          >
            {updateShop.isPending ? (
              <>
                <Loader2 className="size-3.5 animate-spin" /> Saving…
              </>
            ) : (
              "Save changes"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

function shopInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  return name.slice(0, 2).toUpperCase() || "?";
}

function StorefrontPreview(props: { logoUrl: string | null; shopName: string }) {
  const { logoUrl, shopName } = props;
  return (
    <div className="flex flex-col gap-2">
      <Label>Storefront preview</Label>
      <div className="flex items-center gap-3 py-2">
        <div
          className={`flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-sm sm:size-16${logoUrl ? "" : " bg-muted"}`}
        >
          {logoUrl ? (
            <img
              src={assetUrl(logoUrl)}
              alt=""
              className="size-full object-cover"
            />
          ) : (
            <span className="text-xs font-semibold text-muted-foreground sm:text-sm">{shopInitials(shopName)}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-serif text-lg font-normal tracking-tight text-foreground sm:text-xl">
            {shopName || "Your shop name"}
          </p>
        </div>
      </div>
    </div>
  );
}

function LogoEditor(props: {
  previewUrl: string | null;
  uploading: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onPick: () => void;
  onClear: () => void;
  onFile: (file: File) => void;
}) {
  const { previewUrl, uploading, inputRef, onPick, onClear, onFile } = props;
  return (
    <div className="flex flex-col gap-3">
      <Label>Shop logo</Label>
      <div className="flex items-center gap-4 rounded-lg border border-dashed border-border p-4">
        <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-sm bg-muted">
          {previewUrl ? (
            <img
              src={assetUrl(previewUrl)}
              alt="Shop logo preview"
              className="size-full object-cover"
            />
          ) : (
            <span className="text-xs text-muted-foreground">No logo</span>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onFile(file);
              e.target.value = "";
            }}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={onPick}
            >
              {uploading ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" /> Uploading…
                </>
              ) : (
                <>
                  <Upload className="size-3.5" />
                  {previewUrl ? "Replace logo" : "Upload logo"}
                </>
              )}
            </Button>
            {previewUrl && !uploading ? (
              <Button type="button" variant="ghost" size="sm" onClick={onClear}>
                <Trash2 className="size-3.5" /> Remove
              </Button>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground">PNG, JPG, WEBP, or GIF. Max 5MB.</p>
        </div>
      </div>
    </div>
  );
}

function SocialField(props: {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={props.id}>{props.label}</Label>
      <Input
        id={props.id}
        type="url"
        inputMode="url"
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        placeholder={props.placeholder}
      />
    </div>
  );
}
