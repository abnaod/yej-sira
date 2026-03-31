import { useState } from "react";

import { cn } from "@/lib/utils";

interface ProductGalleryProps {
  images: string[];
  productName: string;
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const displayImages = images.length > 0 ? images : [
    "https://images.unsplash.com/photo-1493106641515-6b5631de4bb9?w=600&q=80",
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-hidden rounded-xl bg-gradient-to-br from-stone-100 via-amber-50/50 to-neutral-50">
        <img
          src={displayImages[selectedIndex]}
          alt={productName}
          className="mx-auto h-80 w-full object-contain p-8 md:h-96"
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
                "h-16 w-16 overflow-hidden rounded-lg border-2 bg-neutral-50 p-1 transition-colors",
                i === selectedIndex
                  ? "border-primary"
                  : "border-border hover:border-neutral-300",
              )}
            >
              <img
                src={img}
                alt={`${productName} view ${i + 1}`}
                className="h-full w-full object-contain"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
