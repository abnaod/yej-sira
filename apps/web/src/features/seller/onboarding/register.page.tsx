import type { Locale } from "@ys/intl";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Loader2, Trash2, Upload } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { assetUrl, uploadImage } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { useLocale } from "@/lib/locale-path";
import type { CreateShopBody } from "../shared/shop.queries";
import { createShopMutationOptions } from "../shared/shop.queries";

const STEPS = ["Basics", "Business details", "Review & submit"] as const;

const STEP_DESCRIPTIONS = [
  "Your name, shop identity, description, and optional logo.",
  "Legal and location details, and how buyers can reach you.",
  "Confirm your details and submit your shop application.",
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

  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [step, setStep] = useState(0);
  const [fullName, setFullName] = useState("");
  const fullNameHydrated = useRef(false);

  const [form, setForm] = useState<Omit<CreateShopBody, "slug">>({
    name: "",
    description: "",
    imageUrl: undefined,
    contactEmail: undefined,
    contactPhone: undefined,
    businessType: "individual",
    businessLegalName: undefined,
    businessTaxId: undefined,
    businessCity: undefined,
    businessSubcity: undefined,
    businessWoreda: undefined,
    businessKebele: undefined,
    businessHouseNumber: undefined,
    businessSpecificLocation: undefined,
  });

  useEffect(() => {
    if (!sessionPending && session?.user && !fullNameHydrated.current) {
      setFullName(session.user.name ?? "");
      fullNameHydrated.current = true;
    }
  }, [sessionPending, session?.user]);

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

  async function handleLogoSelected(file: File) {
    setLogoError(null);
    setLogoUploading(true);
    try {
      const url = await uploadImage(file, "shops", locale);
      updateForm({ imageUrl: url });
    } catch (e) {
      setLogoError((e as Error).message || "Upload failed");
    } finally {
      setLogoUploading(false);
    }
  }

  async function submit() {
    if (!session?.user) return;
    const trimmedName = fullName.trim();
    const sessionName = (session.user.name ?? "").trim();
    if (trimmedName !== sessionName) {
      await authClient.updateUser({ name: trimmedName });
    }

    const body: CreateShopBody = {
      name: form.name.trim(),
      slug: slugifyShopName(form.name.trim()),
      ...(form.description?.trim() ? { description: form.description.trim() } : {}),
      ...(form.imageUrl?.trim() ? { imageUrl: form.imageUrl.trim() } : {}),
      ...(form.contactEmail?.trim() ? { contactEmail: form.contactEmail.trim() } : {}),
      ...(form.contactPhone?.trim() ? { contactPhone: form.contactPhone.trim() } : {}),
      ...(form.businessType ? { businessType: form.businessType } : {}),
      ...(form.businessType === "business" && form.businessLegalName?.trim()
        ? { businessLegalName: form.businessLegalName.trim() }
        : {}),
      ...(form.businessTaxId?.trim() ? { businessTaxId: form.businessTaxId.trim() } : {}),
      ...(form.businessCity?.trim() ? { businessCity: form.businessCity.trim() } : {}),
      ...(form.businessSubcity?.trim() ? { businessSubcity: form.businessSubcity.trim() } : {}),
      ...(form.businessWoreda?.trim() ? { businessWoreda: form.businessWoreda.trim() } : {}),
      ...(form.businessKebele?.trim() ? { businessKebele: form.businessKebele.trim() } : {}),
      ...(form.businessHouseNumber?.trim()
        ? { businessHouseNumber: form.businessHouseNumber.trim() }
        : {}),
      ...(form.businessSpecificLocation?.trim()
        ? { businessSpecificLocation: form.businessSpecificLocation.trim() }
        : {}),
    };

    await createShop.mutateAsync(body);
    void navigate({ to: "/$locale/sell/dashboard", params: { locale } });
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 md:px-6 md:py-12">
      <div className="mb-4">
        <p className="text-sm font-medium text-muted-foreground">
          Step {step + 1} of {STEPS.length}
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{STEPS[step]}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{STEP_DESCRIPTIONS[step]}</p>
        <Progress className="mt-4 h-1" value={progress} />
      </div>

      <Card className="border-0 shadow-none">
        <CardContent className="flex flex-col gap-4 pt-0">
          {step === 0 && (
            <>
              <div className="flex flex-col gap-2">
                <Label htmlFor="fullName">Your full name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  maxLength={120}
                  autoComplete="name"
                />
              </div>
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
              <div className="flex flex-col gap-3">
                <Label>Logo image</Label>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleLogoSelected(file);
                    e.target.value = "";
                  }}
                />
                <div className="flex items-center gap-4 rounded-lg border border-dashed border-border p-4">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
                    {form.imageUrl ? (
                      <img
                        src={assetUrl(form.imageUrl)}
                        alt="Shop logo preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground">No logo</span>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
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
                            <Loader2 className="mr-1.5 size-3.5 animate-spin" /> Uploading…
                          </>
                        ) : (
                          <>
                            <Upload className="mr-1.5 size-3.5" />
                            {form.imageUrl ? "Replace" : "Choose file"}
                          </>
                        )}
                      </Button>
                      {form.imageUrl && !logoUploading && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => updateForm({ imageUrl: undefined })}
                        >
                          <Trash2 className="mr-1.5 size-3.5" />
                          Remove
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">PNG, JPG, WEBP, or GIF. Max 5MB.</p>
                    {logoError && <p className="text-xs text-destructive">{logoError}</p>}
                  </div>
                </div>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div className="flex flex-col gap-2">
                <Label>Business type</Label>
                <RadioGroup
                  value={form.businessType ?? "individual"}
                  onValueChange={(val) =>
                    updateForm({
                      businessType: val as "individual" | "business",
                      ...(val === "individual" ? { businessLegalName: undefined } : {}),
                    })
                  }
                  className="flex flex-row gap-2"
                >
                  <label
                    htmlFor="businessType-individual"
                    className={`flex min-w-0 flex-1 cursor-pointer items-start gap-2 rounded-md border bg-white p-3 transition-colors hover:bg-gray-100 dark:bg-transparent dark:hover:bg-gray-800 ${
                      (form.businessType ?? "individual") === "individual"
                        ? "border-primary"
                        : "border-border"
                    }`}
                  >
                    <RadioGroupItem
                      value="individual"
                      id="businessType-individual"
                      className="mt-0.5 size-3.5 shrink-0 origin-center border-[0.5px] transition-transform data-[state=unchecked]:scale-[0.88]"
                    />
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <span className="text-sm font-medium leading-tight">Individual</span>
                      <p className="text-xs leading-snug text-muted-foreground">
                        You or a sole proprietorship.
                      </p>
                    </div>
                  </label>
                  <label
                    htmlFor="businessType-business"
                    className={`flex min-w-0 flex-1 cursor-pointer items-start gap-2 rounded-md border bg-white p-3 transition-colors hover:bg-gray-100 dark:bg-transparent dark:hover:bg-gray-800 ${
                      form.businessType === "business" ? "border-primary" : "border-border"
                    }`}
                  >
                    <RadioGroupItem
                      value="business"
                      id="businessType-business"
                      className="mt-0.5 size-3.5 shrink-0 origin-center border-[0.5px] transition-transform data-[state=unchecked]:scale-[0.88]"
                    />
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <span className="text-sm font-medium leading-tight">Business</span>
                      <p className="text-xs leading-snug text-muted-foreground">
                        Registered company or cooperative.
                      </p>
                    </div>
                  </label>
                </RadioGroup>
              </div>
              {form.businessType === "business" ? (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="businessLegalName">Business name</Label>
                  <Input
                    id="businessLegalName"
                    value={form.businessLegalName ?? ""}
                    onChange={(e) => updateForm({ businessLegalName: e.target.value || undefined })}
                    placeholder="e.g. Abeba Trading PLC"
                  />
                </div>
              ) : null}
              <div className="flex flex-col gap-2">
                <Label htmlFor="businessTaxId">TIN number</Label>
                <Input
                  id="businessTaxId"
                  value={form.businessTaxId ?? ""}
                  onChange={(e) => updateForm({ businessTaxId: e.target.value || undefined })}
                  placeholder="Taxpayer Identification Number"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="businessCity">City</Label>
                  <Input
                    id="businessCity"
                    value={form.businessCity ?? ""}
                    onChange={(e) => updateForm({ businessCity: e.target.value || undefined })}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="businessSubcity">Subcity</Label>
                  <Input
                    id="businessSubcity"
                    value={form.businessSubcity ?? ""}
                    onChange={(e) => updateForm({ businessSubcity: e.target.value || undefined })}
                    placeholder="e.g. Bole, Kirkos"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="businessWoreda">Woreda</Label>
                  <Input
                    id="businessWoreda"
                    value={form.businessWoreda ?? ""}
                    onChange={(e) => updateForm({ businessWoreda: e.target.value || undefined })}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="businessKebele">Kebele</Label>
                  <Input
                    id="businessKebele"
                    value={form.businessKebele ?? ""}
                    onChange={(e) => updateForm({ businessKebele: e.target.value || undefined })}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="businessHouseNumber">House number</Label>
                  <Input
                    id="businessHouseNumber"
                    value={form.businessHouseNumber ?? ""}
                    onChange={(e) =>
                      updateForm({ businessHouseNumber: e.target.value || undefined })
                    }
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="businessSpecificLocation">Specific location</Label>
                <Input
                  id="businessSpecificLocation"
                  value={form.businessSpecificLocation ?? ""}
                  onChange={(e) =>
                    updateForm({ businessSpecificLocation: e.target.value || undefined })
                  }
                  maxLength={500}
                  placeholder="Building name, floor, landmark, phone entry, etc."
                />
              </div>
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

          {step === 2 && (
            <>
            <div className="rounded-lg bg-muted/30 p-4 text-sm leading-relaxed">
              <p>
                <strong>{form.name.trim() || "—"}</strong> ·{" "}
                <span className="text-muted-foreground">{shopSlug || "—"}</span>
              </p>
              <p className="text-xs text-muted-foreground">Owner: {fullName.trim() || "—"}</p>
              {form.description?.trim() ? (
                <p className="mt-2 text-muted-foreground">{form.description.trim()}</p>
              ) : null}
              <p className="mt-4 text-xs text-muted-foreground">
                Submitting creates your shop with the details you entered. You can manage listings from the
                dashboard.
              </p>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-border p-4">
              <Checkbox
                id="terms"
                checked={agreedToTerms}
                onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
                className="mt-0.5"
              />
              <label htmlFor="terms" className="text-sm leading-snug">
                I agree to the{" "}
                <a
                  href="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium underline underline-offset-4 hover:text-primary"
                >
                  Terms and Conditions
                </a>{" "}
                and{" "}
                <a
                  href="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium underline underline-offset-4 hover:text-primary"
                >
                  Privacy Policy
                </a>
                . I understand that my shop is subject to review and must comply with the seller
                guidelines.
              </label>
            </div>
            </>
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
                (step === 0 &&
                  (!fullName.trim() || !form.name.trim() || !shopSlug || logoUploading)) ||
                createShop.isPending
              }
              onClick={() => setStep((s) => s + 1)}
            >
              Next
            </Button>
          ) : (
            <Button
              type="button"
              disabled={
                !fullName.trim() || !form.name.trim() || !shopSlug || !agreedToTerms || createShop.isPending
              }
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
