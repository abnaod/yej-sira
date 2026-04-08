import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Check, ChevronLeft, ChevronRight, ChevronsUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

import { DELIVERY_CITY_DEFAULT, DELIVERY_REGION_LABEL } from "../constants";
import type { PickupLocationDto } from "../checkout.queries";
import type { DeliveryMethod, ShippingFormValues } from "../types";

interface DeliveryOption {
  id: DeliveryMethod;
  label: string;
  description: string;
}

const deliveryOptions: DeliveryOption[] = [
  {
    id: "standard",
    label: "Delivery",
    description: "Ship to your address",
  },
  {
    id: "pickup",
    label: "Store pickup",
    description: "Collect when ready",
  },
];

function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface DeliveryStepProps {
  deliveryMethod: DeliveryMethod;
  onDeliveryMethodChange: (method: DeliveryMethod) => void;
  /** Configured standard delivery fee from API (`STANDARD_DELIVERY_FEE_ETB`); shown on the Delivery card. */
  deliveryStandardFeeEtb: number;
  pickupLocations: PickupLocationDto[];
  pickupLocationId: string | null;
  onPickupLocationChange: (id: string) => void;
  address: ShippingFormValues;
  onAddressChange: (next: Partial<ShippingFormValues>) => void;
  onNext: () => void;
  onBack: () => void;
}

function formatPriceEtB(amount: number) {
  return `ETB ${amount.toFixed(2)}`;
}

export function DeliveryStep({
  deliveryMethod,
  onDeliveryMethodChange,
  deliveryStandardFeeEtb,
  pickupLocations,
  pickupLocationId,
  onPickupLocationChange,
  address,
  onAddressChange,
  onNext,
  onBack,
}: DeliveryStepProps) {
  const [pickupStoreOpen, setPickupStoreOpen] = useState(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoHint, setGeoHint] = useState<"idle" | "loading" | "denied" | "unavailable" | "ok">(
    "idle",
  );

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoHint("unavailable");
      return;
    }
    setGeoHint("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoHint("ok");
      },
      () => {
        setGeoHint("denied");
      },
      { enableHighAccuracy: false, maximumAge: 300_000, timeout: 10_000 },
    );
  }, []);

  const sortedPickupLocations = useMemo(() => {
    if (!userCoords || pickupLocations.length === 0) {
      return pickupLocations;
    }
    return [...pickupLocations].sort(
      (a, b) =>
        distanceKm(userCoords.lat, userCoords.lng, a.latitude, a.longitude) -
        distanceKm(userCoords.lat, userCoords.lng, b.latitude, b.longitude),
    );
  }, [pickupLocations, userCoords]);

  useEffect(() => {
    if (deliveryMethod !== "standard") return;
    if (!address.city.trim()) {
      onAddressChange({ city: DELIVERY_CITY_DEFAULT });
    }
  }, [deliveryMethod, address.city, onAddressChange]);

  useEffect(() => {
    if (deliveryMethod !== "pickup" || sortedPickupLocations.length === 0) return;
    const valid = pickupLocationId && sortedPickupLocations.some((l) => l.id === pickupLocationId);
    if (!valid) {
      onPickupLocationChange(sortedPickupLocations[0].id);
    }
  }, [deliveryMethod, sortedPickupLocations, pickupLocationId, onPickupLocationChange]);

  const standardAddressReady =
    address.city.trim() &&
    address.subcity.trim() &&
    address.woreda.trim() &&
    address.kebele.trim() &&
    address.specificLocation.trim();

  const pickupReady =
    deliveryMethod !== "pickup" ||
    (pickupLocationId !== null && sortedPickupLocations.some((l) => l.id === pickupLocationId));

  const canContinue = deliveryMethod === "standard" ? standardAddressReady : pickupReady;

  const handleNext = () => {
    if (!canContinue) return;
    onNext();
  };

  const selectedPickupLocation =
    pickupLocationId != null
      ? sortedPickupLocations.find((l) => l.id === pickupLocationId)
      : undefined;

  return (
    <div className="flex h-full min-h-0 flex-col rounded-lg border border-border bg-white p-5">
      <div className="min-h-0 flex-1">
      <h3 className="text-base font-semibold">Delivery</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        We deliver in {DELIVERY_REGION_LABEL}. Choose how you receive your order.
      </p>

      <div className="mt-6">
        <h4 className="text-sm font-semibold">Delivery method</h4>
        <p className="mt-1 text-sm text-muted-foreground">
          Home delivery includes a flat fee; store pickup is free.
        </p>
      </div>
      <RadioGroup
        value={deliveryMethod}
        onValueChange={(val) => onDeliveryMethodChange(val as DeliveryMethod)}
        className="mt-2.5 grid grid-cols-2 gap-2"
      >
        {deliveryOptions.map((option) => {
          const isStandard = option.id === "standard";
          const priceMain = isStandard
            ? formatPriceEtB(deliveryStandardFeeEtb)
            : "Free";

          return (
            <label
              key={option.id}
              className={cn(
                "flex h-full cursor-pointer flex-col rounded-md border bg-white p-2.5 transition-colors hover:bg-primary/10",
                deliveryMethod === option.id
                  ? "border-primary"
                  : "border-border hover:border-primary/35",
              )}
            >
              <div className="flex items-start gap-2">
                <RadioGroupItem
                  value={option.id}
                  id={option.id}
                  className="mt-0.5 size-3.5 shrink-0 origin-center border-[0.5px] transition-transform data-[state=unchecked]:scale-[0.88]"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-1.5">
                    <span className="text-sm font-medium leading-tight">{option.label}</span>
                    <div className="shrink-0 text-right">
                      <span className="block text-xs font-semibold tabular-nums">{priceMain}</span>
                      {isStandard ? (
                        <span className="mt-0.5 block text-[10px] leading-none text-muted-foreground">
                          Delivery fee
                        </span>
                      ) : (
                        <span className="mt-0.5 block text-[10px] leading-none text-muted-foreground">
                          Pickup
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                    {option.description}
                  </p>
                </div>
              </div>
            </label>
          );
        })}
      </RadioGroup>

      {deliveryMethod === "pickup" && (
        <div className="mt-5">
          <h4 id="pickup-store-heading" className="text-sm font-semibold">
            Pickup store
          </h4>
          <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
            {geoHint === "ok"
              ? "Stores are sorted by distance from your location."
              : "Choose the store that is most convenient for you."}
          </p>
          {geoHint === "loading" && (
            <p className="mt-2 text-xs text-muted-foreground">Finding your location…</p>
          )}

          {sortedPickupLocations.length === 0 ? (
            <p className="mt-4 text-xs leading-snug text-muted-foreground">
              No pickup stores are available.
            </p>
          ) : (
            <div className="mt-4">
              <Popover open={pickupStoreOpen} onOpenChange={setPickupStoreOpen}>
                <PopoverTrigger asChild>
                  <Button
                    id="pickup-store-trigger"
                    variant="outline"
                    role="combobox"
                    aria-expanded={pickupStoreOpen}
                    aria-labelledby="pickup-store-heading"
                    className="h-auto min-h-10 w-full justify-between py-2 font-normal"
                  >
                    <span className="line-clamp-2 min-w-0 flex-1 text-left">
                      {selectedPickupLocation ? (
                        <>
                          <span className="font-medium text-foreground">{selectedPickupLocation.name}</span>
                          <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">
                            {selectedPickupLocation.city} · {selectedPickupLocation.line1}
                          </span>
                        </>
                      ) : (
                        <span className="text-xs leading-snug text-muted-foreground">
                          Search or select a store…
                        </span>
                      )}
                    </span>
                    <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-(--radix-popover-trigger-width) p-0"
                  align="start"
                  onOpenAutoFocus={(e) => e.preventDefault()}
                >
                  <Command shouldFilter>
                    <CommandInput placeholder="Search by name, city, or address…" />
                    <CommandList>
                      <CommandEmpty>No store matches your search.</CommandEmpty>
                      <CommandGroup>
                        {sortedPickupLocations.map((loc, index) => {
                          const distKm =
                            userCoords != null
                              ? distanceKm(
                                  userCoords.lat,
                                  userCoords.lng,
                                  loc.latitude,
                                  loc.longitude,
                                )
                              : null;
                          const showNearest = userCoords != null && index === 0;
                          const searchBlob = [
                            loc.name,
                            loc.city,
                            loc.line1,
                            loc.line2,
                            loc.postalCode,
                            loc.country,
                          ]
                            .filter(Boolean)
                            .join(" ");

                          return (
                            <CommandItem
                              key={loc.id}
                              value={`${loc.id} ${searchBlob}`}
                              onSelect={() => {
                                onPickupLocationChange(loc.id);
                                setPickupStoreOpen(false);
                              }}
                              className="cursor-pointer items-start py-3"
                            >
                              <Check
                                className={cn(
                                  "mt-0.5 size-4 shrink-0",
                                  pickupLocationId === loc.id ? "opacity-100" : "opacity-0",
                                )}
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-medium">{loc.name}</span>
                                  {showNearest && (
                                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                                      Nearest
                                    </span>
                                  )}
                                  {distKm != null && (
                                    <span className="text-xs tabular-nums text-muted-foreground">
                                      ~{distKm.toFixed(1)} km
                                    </span>
                                  )}
                                </div>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {loc.line1}
                                  {loc.line2 ? `, ${loc.line2}` : ""}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {loc.city}, {loc.postalCode} · {loc.country}
                                </p>
                              </div>
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {geoHint === "denied" && (
                <p className="mt-2 flex items-center gap-2 pl-2 text-xs text-muted-foreground">
                  <AlertTriangle
                    className="size-2.5 shrink-0 text-muted-foreground"
                    strokeWidth={2}
                    aria-hidden
                  />
                  <span>
                    Location access was declined. You can still pick any store below.
                  </span>
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {deliveryMethod === "standard" && (
        <div className="mt-5">
          <h4 className="text-sm font-semibold">Delivery details</h4>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter your location in {DELIVERY_REGION_LABEL}. All fields are required.
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm text-label-foreground">City</label>
              <Input
                readOnly
                value={address.city || DELIVERY_CITY_DEFAULT}
                className="bg-muted"
                aria-readonly
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-label-foreground">Subcity</label>
              <Input
                placeholder="e.g. Bole, Kirkos"
                value={address.subcity}
                onChange={(e) => onAddressChange({ subcity: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-label-foreground">Woreda</label>
              <Input
                placeholder="Woreda"
                value={address.woreda}
                onChange={(e) => onAddressChange({ woreda: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-label-foreground">Kebele</label>
              <Input
                placeholder="Kebele"
                value={address.kebele}
                onChange={(e) => onAddressChange({ kebele: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm text-label-foreground">
                Specific location
              </label>
              <Input
                placeholder="Building name, floor, landmark, phone entry, etc."
                value={address.specificLocation}
                onChange={(e) => onAddressChange({ specificLocation: e.target.value })}
              />
            </div>
          </div>
        </div>
      )}
      </div>

      <div className="mt-auto flex w-full shrink-0 items-center justify-between gap-3 pt-6">
        <Button variant="outline" size="lg" type="button" onClick={onBack}>
          <ChevronLeft className="size-4" aria-hidden />
          Back
        </Button>
        <Button size="lg" type="button" onClick={handleNext} disabled={!canContinue}>
          Continue
          <ChevronRight className="size-4" aria-hidden />
        </Button>
      </div>
    </div>
  );
}
