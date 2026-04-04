import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface ShippingFormValues {
  line1: string;
  line2: string;
  city: string;
  postalCode: string;
  country: string;
}

interface ShippingStepProps {
  value: ShippingFormValues;
  onChange: (next: Partial<ShippingFormValues>) => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
  error?: string | null;
}

export function ShippingStep({
  value,
  onChange,
  onSubmit,
  isSubmitting,
  error,
}: ShippingStepProps) {
  return (
    <div className="rounded-lg border border-border bg-white p-5">
      <h3 className="text-base font-semibold">Delivery Information</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Sign in is required to place an order. Your cart is saved on the server.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm text-muted-foreground">
            Address line 1
          </label>
          <Input
            placeholder="Street address"
            value={value.line1}
            onChange={(e) => onChange({ line1: e.target.value })}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm text-muted-foreground">
            Address line 2 (optional)
          </label>
          <Input
            placeholder="Apt, suite, etc."
            value={value.line2}
            onChange={(e) => onChange({ line2: e.target.value })}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm text-muted-foreground">City</label>
          <Input
            placeholder="City"
            value={value.city}
            onChange={(e) => onChange({ city: e.target.value })}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm text-muted-foreground">
            Postal code
          </label>
          <Input
            placeholder="Postal code"
            value={value.postalCode}
            onChange={(e) => onChange({ postalCode: e.target.value })}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm text-muted-foreground">Country</label>
          <Input
            placeholder="Country"
            value={value.country}
            onChange={(e) => onChange({ country: e.target.value })}
          />
        </div>
      </div>

      {error && (
        <p className="mt-3 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <Button
        className="mt-6"
        size="lg"
        disabled={isSubmitting}
        onClick={() => onSubmit()}
      >
        {isSubmitting ? "Placing order…" : "Place order"}
      </Button>
    </div>
  );
}
