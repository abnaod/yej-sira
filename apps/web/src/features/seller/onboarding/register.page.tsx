import type { Locale } from "@ys/intl";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { authClient } from "@/lib/auth-client";
import { useLocale } from "@/lib/locale-path";
import type { CreateShopBody } from "../shared/shop.queries";
import { createShopMutationOptions } from "../shared/shop.queries";

const STEPS = [
  "Shop basics",
  "Branding",
  "Contact",
  "Social",
  "Policies",
  "Business",
  "Review",
] as const;

/** Kebab-case slug from shop name; matches API (min 2, max 80, /^[a-z0-9]+(?:-[a-z0-9]+)*$/). */
function slugifyShopName(name: string): string {
  const raw = name
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
  let slug = raw.slice(0, 80);
  if (slug.length === 1) {
    slug = `${slug}0`;
  }
  if (slug.length === 0 && name.trim().length > 0) {
    slug = "shop";
  }
  return slug;
}

export function SellerRegisterPage() {
  const locale = useLocale() as Locale;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: session, isPending: sessionPending } = authClient.useSession();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Omit<CreateShopBody, "slug">>({
    name: "",
    description: "",
    imageUrl: undefined,
    contactEmail: undefined,
    contactPhone: undefined,
    socialLinks: undefined,
    shippingPolicy: undefined,
    returnsPolicy: undefined,
    businessLegalName: undefined,
    businessTaxId: undefined,
    businessAddressLine1: undefined,
    businessAddressLine2: undefined,
    businessCity: undefined,
    businessPostalCode: undefined,
    businessCountry: undefined,
  });

  const createShop = useMutation(createShopMutationOptions(queryClient, locale));

  const progress = useMemo(() => ((step + 1) / STEPS.length) * 100, [step]);
  const shopSlug = useMemo(() => slugifyShopName(form.name.trim()), [form.name]);

  if (sessionPending) {
    return (
      <div className="mx-auto flex min-h-[40vh] max-w-lg items-center justify-center px-4">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12">
        <Card className="border-0 shadow-none">
          <CardHeader>
            <CardTitle>Sign in required</CardTitle>
            <CardDescription>
              Create an account or sign in from the header, then come back to finish registration.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  function updateForm(patch: Partial<Omit<CreateShopBody, "slug">>) {
    setForm((f) => ({ ...f, ...patch }));
  }

  async function submit() {
    const body: CreateShopBody = {
      name: form.name.trim(),
      slug: slugifyShopName(form.name.trim()),
      ...(form.description?.trim() ? { description: form.description.trim() } : {}),
      ...(form.imageUrl?.trim() ? { imageUrl: form.imageUrl.trim() } : {}),
      ...(form.contactEmail?.trim() ? { contactEmail: form.contactEmail.trim() } : {}),
      ...(form.contactPhone?.trim() ? { contactPhone: form.contactPhone.trim() } : {}),
      ...(form.socialLinks && Object.keys(form.socialLinks).length > 0
        ? {
            socialLinks: {
              ...(form.socialLinks.website?.trim()
                ? { website: form.socialLinks.website.trim() }
                : {}),
              ...(form.socialLinks.instagram?.trim()
                ? { instagram: form.socialLinks.instagram.trim() }
                : {}),
              ...(form.socialLinks.facebook?.trim()
                ? { facebook: form.socialLinks.facebook.trim() }
                : {}),
              ...(form.socialLinks.tiktok?.trim() ? { tiktok: form.socialLinks.tiktok.trim() } : {}),
            },
          }
        : {}),
      ...(form.shippingPolicy?.trim() ? { shippingPolicy: form.shippingPolicy.trim() } : {}),
      ...(form.returnsPolicy?.trim() ? { returnsPolicy: form.returnsPolicy.trim() } : {}),
      ...(form.businessLegalName?.trim() ? { businessLegalName: form.businessLegalName.trim() } : {}),
      ...(form.businessTaxId?.trim() ? { businessTaxId: form.businessTaxId.trim() } : {}),
      ...(form.businessAddressLine1?.trim()
        ? { businessAddressLine1: form.businessAddressLine1.trim() }
        : {}),
      ...(form.businessAddressLine2?.trim()
        ? { businessAddressLine2: form.businessAddressLine2.trim() }
        : {}),
      ...(form.businessCity?.trim() ? { businessCity: form.businessCity.trim() } : {}),
      ...(form.businessPostalCode?.trim()
        ? { businessPostalCode: form.businessPostalCode.trim() }
        : {}),
      ...(form.businessCountry?.trim() ? { businessCountry: form.businessCountry.trim() } : {}),
    };

    await createShop.mutateAsync(body);
    void navigate({ to: "/$locale/sell/dashboard", params: { locale } });
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 md:px-6 md:py-12">
      <div className="mb-8">
        <p className="text-sm font-medium text-muted-foreground">
          Step {step + 1} of {STEPS.length}
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Open your shop</h1>
        <p className="mt-2 text-xss text-muted-foreground">
          Complete the steps below—we&apos;ll review your application.
        </p>
        <Progress className="mt-4 h-1" value={progress} />
      </div>

      <Card className="border-0 shadow-none">
        <CardHeader>
          <CardTitle>{STEPS[step]}</CardTitle>
          <CardDescription>
            {step === 0 && "Name and optional description for your storefront."}
            {step === 1 && "Logo image URL (optional)."}
            {step === 2 && "How buyers can reach you (optional)."}
            {step === 3 && "Social and website links (optional)."}
            {step === 4 && "Shipping and returns copy (optional)."}
            {step === 5 && "Business details for our records (optional)."}
            {step === 6 && "Confirm and submit your application."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {step === 0 && (
            <>
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">Shop name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => updateForm({ name: e.target.value })}
                  required
                  maxLength={120}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  value={form.description ?? ""}
                  onChange={(e) => updateForm({ description: e.target.value })}
                  rows={4}
                  maxLength={2000}
                />
              </div>
            </>
          )}

          {step === 1 && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="imageUrl">Logo image URL</Label>
              <Input
                id="imageUrl"
                type="url"
                value={form.imageUrl ?? ""}
                onChange={(e) => updateForm({ imageUrl: e.target.value || undefined })}
                placeholder="https://…"
              />
            </div>
          )}

          {step === 2 && (
            <>
              <div className="flex flex-col gap-2">
                <Label htmlFor="contactEmail">Contact email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={form.contactEmail ?? ""}
                  onChange={(e) => updateForm({ contactEmail: e.target.value || undefined })}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="contactPhone">Contact phone</Label>
                <Input
                  id="contactPhone"
                  value={form.contactPhone ?? ""}
                  onChange={(e) => updateForm({ contactPhone: e.target.value || undefined })}
                />
              </div>
            </>
          )}

          {step === 3 && (
            <>
              {(["website", "instagram", "facebook", "tiktok"] as const).map((key) => (
                <div key={key} className="flex flex-col gap-2">
                  <Label htmlFor={key}>{key}</Label>
                  <Input
                    id={key}
                    type="url"
                    value={form.socialLinks?.[key] ?? ""}
                    onChange={(e) =>
                      updateForm({
                        socialLinks: {
                          ...form.socialLinks,
                          [key]: e.target.value || undefined,
                        },
                      })
                    }
                    placeholder="https://…"
                  />
                </div>
              ))}
            </>
          )}

          {step === 4 && (
            <>
              <div className="flex flex-col gap-2">
                <Label htmlFor="shippingPolicy">Shipping policy</Label>
                <Textarea
                  id="shippingPolicy"
                  value={form.shippingPolicy ?? ""}
                  onChange={(e) => updateForm({ shippingPolicy: e.target.value || undefined })}
                  rows={5}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="returnsPolicy">Returns policy</Label>
                <Textarea
                  id="returnsPolicy"
                  value={form.returnsPolicy ?? ""}
                  onChange={(e) => updateForm({ returnsPolicy: e.target.value || undefined })}
                  rows={5}
                />
              </div>
            </>
          )}

          {step === 5 && (
            <>
              <div className="flex flex-col gap-2">
                <Label htmlFor="businessLegalName">Legal / business name</Label>
                <Input
                  id="businessLegalName"
                  value={form.businessLegalName ?? ""}
                  onChange={(e) => updateForm({ businessLegalName: e.target.value || undefined })}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="businessTaxId">Tax ID</Label>
                <Input
                  id="businessTaxId"
                  value={form.businessTaxId ?? ""}
                  onChange={(e) => updateForm({ businessTaxId: e.target.value || undefined })}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="businessAddressLine1">Address line 1</Label>
                <Input
                  id="businessAddressLine1"
                  value={form.businessAddressLine1 ?? ""}
                  onChange={(e) => updateForm({ businessAddressLine1: e.target.value || undefined })}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="businessAddressLine2">Address line 2</Label>
                <Input
                  id="businessAddressLine2"
                  value={form.businessAddressLine2 ?? ""}
                  onChange={(e) => updateForm({ businessAddressLine2: e.target.value || undefined })}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="businessCity">City</Label>
                <Input
                  id="businessCity"
                  value={form.businessCity ?? ""}
                  onChange={(e) => updateForm({ businessCity: e.target.value || undefined })}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="businessPostalCode">Postal code</Label>
                <Input
                  id="businessPostalCode"
                  value={form.businessPostalCode ?? ""}
                  onChange={(e) => updateForm({ businessPostalCode: e.target.value || undefined })}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="businessCountry">Country</Label>
                <Input
                  id="businessCountry"
                  value={form.businessCountry ?? ""}
                  onChange={(e) => updateForm({ businessCountry: e.target.value || undefined })}
                />
              </div>
            </>
          )}

          {step === 6 && (
            <div className="rounded-lg bg-muted/30 p-4 text-sm leading-relaxed">
              <p>
                <strong>{form.name.trim() || "—"}</strong> ·{" "}
                <span className="text-muted-foreground">{shopSlug || "—"}</span>
              </p>
              {form.description?.trim() ? (
                <p className="mt-2 text-muted-foreground">{form.description.trim()}</p>
              ) : null}
              <p className="mt-4 text-xs text-muted-foreground">
                Submitting creates your shop with the details you entered. You can manage products from the
                dashboard.
              </p>
            </div>
          )}

          {createShop.isError && (
            <p className="text-sm text-destructive">
              {(createShop.error as Error)?.message ?? "Something went wrong"}
            </p>
          )}
        </CardContent>
        <CardFooter className="flex flex-wrap justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={step === 0}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
          >
            Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button
              type="button"
              disabled={
                (step === 0 && (!form.name.trim() || !shopSlug)) || createShop.isPending
              }
              onClick={() => setStep((s) => s + 1)}
            >
              Next
            </Button>
          ) : (
            <Button
              type="button"
              disabled={!form.name.trim() || !shopSlug || createShop.isPending}
              onClick={() => void submit()}
            >
              {createShop.isPending ? "Submitting…" : "Submit application"}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
