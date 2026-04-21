import type { Locale } from "@ys/intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Check, Circle, AlertTriangle } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLocale } from "@/lib/locale-path";
import type { OnboardingStep, PayoutMethod, UpdateShopBody } from "../shared/shop.queries";
import {
  publishShopMutationOptions,
  shopOnboardingQuery,
  updateShopMutationOptions,
} from "../shared/shop.queries";

function StepRow({ step }: { step: OnboardingStep }) {
  return (
    <div className="flex items-center gap-2">
      {step.done ? (
        <Check className="size-4 text-green-600" />
      ) : (
        <Circle className="size-4 text-muted-foreground" />
      )}
      <span className={step.done ? "text-sm" : "text-sm text-muted-foreground"}>
        {step.label}
      </span>
    </div>
  );
}

export function SellerOnboardingPage() {
  const locale = useLocale() as Locale;
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery(shopOnboardingQuery(locale));
  const updateShop = useMutation(updateShopMutationOptions(queryClient, locale));
  const publishShop = useMutation(publishShopMutationOptions(queryClient, locale));

  const shop = data?.shop ?? null;
  const [shipping, setShipping] = React.useState("");
  const [returns, setReturns] = React.useState("");
  const [payoutMethod, setPayoutMethod] = React.useState<PayoutMethod>("bank");
  const [payoutAccountName, setPayoutAccountName] = React.useState("");
  const [payoutAccountNumber, setPayoutAccountNumber] = React.useState("");
  const [payoutBankCode, setPayoutBankCode] = React.useState("");
  const [accepted, setAccepted] = React.useState(false);

  React.useEffect(() => {
    if (!shop) return;
    setShipping(shop.shippingPolicy ?? "");
    setReturns(shop.returnsPolicy ?? "");
    setPayoutMethod((shop.payoutMethod as PayoutMethod | null) ?? "bank");
    setPayoutAccountName(shop.payoutAccountName ?? "");
    setPayoutAccountNumber(shop.payoutAccountNumber ?? "");
    setPayoutBankCode(shop.payoutBankCode ?? "");
    setAccepted(!!shop.acceptedSellerPolicyAt);
  }, [shop]);

  if (isLoading) {
    return <div className="mx-auto max-w-2xl p-4 text-muted-foreground">Loading…</div>;
  }

  if (!shop) {
    return (
      <div className="mx-auto max-w-2xl p-4">
        <p className="text-muted-foreground">You don't have a shop yet.</p>
        <Button className="mt-4" asChild>
          <Link to="/$locale/sell/register" params={{ locale }}>
            Register your shop
          </Link>
        </Button>
      </div>
    );
  }

  if (shop.status === "active") {
    return (
      <div className="mx-auto max-w-2xl p-4">
        <Card>
          <CardHeader>
            <CardTitle>Your shop is live</CardTitle>
            <CardDescription>Onboarding is complete.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild>
              <Link to="/$locale/sell/dashboard" params={{ locale }}>
                Go to dashboard
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (shop.status === "suspended" || shop.status === "rejected") {
    return (
      <div className="mx-auto max-w-2xl p-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-destructive" /> Shop {shop.status}
            </CardTitle>
            <CardDescription>
              Please contact support to restore your shop.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  async function savePolicies() {
    const body: UpdateShopBody = {
      shippingPolicy: shipping.trim() || undefined,
      returnsPolicy: returns.trim() || undefined,
    };
    await updateShop.mutateAsync(body);
    toast.success("Policies saved");
  }

  async function savePayout() {
    const body: UpdateShopBody = {
      payoutMethod,
      payoutAccountName: payoutAccountName.trim() || undefined,
      payoutAccountNumber: payoutAccountNumber.trim() || undefined,
      payoutBankCode: payoutBankCode.trim() || undefined,
    };
    await updateShop.mutateAsync(body);
    toast.success("Payout details saved");
  }

  async function acceptPolicy(next: boolean) {
    setAccepted(next);
    await updateShop.mutateAsync({ acceptedSellerPolicy: next });
  }

  async function publish() {
    try {
      await publishShop.mutateAsync();
      toast.success("Your shop is live!");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not publish shop");
    }
  }

  const steps = data?.steps ?? [];
  const canPublish = data?.canPublish ?? false;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4">
      <Card>
        <CardHeader>
          <CardTitle>Open your shop</CardTitle>
          <CardDescription>
            Complete these steps to make your shop visible to shoppers.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {steps.map((s) => (
            <StepRow key={s.id} step={s} />
          ))}
        </CardContent>
        <CardFooter>
          <Button disabled={!canPublish || publishShop.isPending} onClick={() => void publish()}>
            {publishShop.isPending ? "Publishing…" : "Publish shop"}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Shipping & returns policies</CardTitle>
          <CardDescription>Shoppers review these before buying.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="shipping">Shipping policy</Label>
            <Textarea
              id="shipping"
              rows={4}
              value={shipping}
              onChange={(e) => setShipping(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="returns">Returns policy</Label>
            <Textarea
              id="returns"
              rows={4}
              value={returns}
              onChange={(e) => setReturns(e.target.value)}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={() => void savePolicies()} disabled={updateShop.isPending}>
            Save policies
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payout details</CardTitle>
          <CardDescription>
            We use this to pay you after orders are fulfilled.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="payoutMethod">Payout method</Label>
            <select
              id="payoutMethod"
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              value={payoutMethod}
              onChange={(e) => setPayoutMethod(e.target.value as PayoutMethod)}
            >
              <option value="bank">Bank transfer</option>
              <option value="cbe">CBE (Commercial Bank of Ethiopia)</option>
              <option value="telebirr">Telebirr</option>
            </select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="payoutAccountName">Account name</Label>
              <Input
                id="payoutAccountName"
                value={payoutAccountName}
                onChange={(e) => setPayoutAccountName(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="payoutAccountNumber">Account number</Label>
              <Input
                id="payoutAccountNumber"
                value={payoutAccountNumber}
                onChange={(e) => setPayoutAccountNumber(e.target.value)}
              />
            </div>
            {payoutMethod !== "telebirr" ? (
              <div className="flex flex-col gap-2 sm:col-span-2">
                <Label htmlFor="payoutBankCode">Bank code / branch</Label>
                <Input
                  id="payoutBankCode"
                  value={payoutBankCode}
                  onChange={(e) => setPayoutBankCode(e.target.value)}
                />
              </div>
            ) : null}
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={() => void savePayout()} disabled={updateShop.isPending}>
            Save payout
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>First listing</CardTitle>
          <CardDescription>Create a draft listing to finish onboarding.</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button asChild>
            <Link to="/$locale/sell/listings/new" params={{ locale }}>
              Create a listing
            </Link>
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Seller agreement</CardTitle>
          <CardDescription>
            Please read the{" "}
            <Link
              to="/$locale/legal/seller-policy"
              params={{ locale }}
              className="font-medium underline underline-offset-4"
            >
              seller policy
            </Link>
            , then check the box to accept.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <label className="flex items-start gap-3 text-sm">
            <Checkbox
              checked={accepted}
              onCheckedChange={(c) => void acceptPolicy(c === true)}
              className="mt-0.5"
            />
            <span>I have read and agree to the Yej-sira seller policy.</span>
          </label>
        </CardContent>
      </Card>
    </div>
  );
}
