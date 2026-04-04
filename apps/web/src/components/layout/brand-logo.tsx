import { cn } from "@/lib/utils";

export function BrandLogo({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"span">) {
  return (
    <span
      className={cn(
        "font-logo text-[1.625rem] leading-none tracking-wider font-normal",
        className,
      )}
      {...props}
    >
      YEJSRA
    </span>
  );
}
