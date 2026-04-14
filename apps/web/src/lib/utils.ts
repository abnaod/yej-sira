import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/** Includes `@theme` font sizes so they participate in `text-*` conflict resolution. */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": ["text-xxs", "text-xss"],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
