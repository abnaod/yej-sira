import { useState } from "react";

import { assetUrl } from "@/lib/api";
import { cn } from "@/lib/utils";

interface ListingGalleryProps {
  images: string[];
  listingName: string;
}

export function ListingGallery({ images, listingName }: ListingGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const displayImages =
    images.length > 0 ? images : ["/static/listings/placeholder.jpg"];

  return (
    <div className="flex flex-col gap-4">
      <div className="relative h-80 w-full overflow-hidden rounded-xl bg-linear-to-br from-stone-100 via-amber-50/50 to-neutral-50 md:h-[420px]">
        <img
          src={assetUrl(displayImages[selectedIndex])}
          alt={listingName}
          className="h-full w-full object-cover"
        />
      </div>

      {displayImages.length > 1 && (
        <div className="flex gap-2">
          {displayImages.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSelectedIndex(i)}
              className={cn(
                "h-16 w-16 overflow-hidden rounded-lg border-2 bg-neutral-50 transition-colors",
                i === selectedIndex
                  ? "border-primary"
                  : "border-border hover:border-neutral-300",
              )}
            >
              <img
                src={assetUrl(img)}
                alt={`${listingName} view ${i + 1}`}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
