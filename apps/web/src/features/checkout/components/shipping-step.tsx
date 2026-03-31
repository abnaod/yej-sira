import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ShippingStepProps {
  onContinue?: () => void;
}

export function ShippingStep({ onContinue }: ShippingStepProps) {
  return (
    <div className="rounded-lg border border-border bg-white p-5">
      <h3 className="text-base font-semibold">Delivery Information</h3>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm text-muted-foreground">
            First Name
          </label>
          <Input placeholder="First name" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm text-muted-foreground">
            Last Name
          </label>
          <Input placeholder="Last name" />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm text-muted-foreground">
            Address
          </label>
          <Input placeholder="Street address" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm text-muted-foreground">
            City
          </label>
          <Input placeholder="City" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm text-muted-foreground">
            Postal Code
          </label>
          <Input placeholder="Postal code" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm text-muted-foreground">
            Country
          </label>
          <Input placeholder="Country" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm text-muted-foreground">
            Phone
          </label>
          <Input placeholder="Phone number" />
        </div>
      </div>

      <Button className="mt-6" size="lg" onClick={onContinue}>
        Continue to Payment
      </Button>
    </div>
  );
}
