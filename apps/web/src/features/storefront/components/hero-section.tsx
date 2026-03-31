import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";

/** Handwoven textiles / craft materials — reads as artisan work */
const primaryCraftImage =
  "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=1200&q=80";
/** Ethiopian coffee ceremony — jebena, cups, cultural context */
const coffeeCeremonyImage =
  "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=900&q=80";

export function HeroSection() {
  return (
    <section className="grid gap-4 lg:grid-cols-[minmax(0,7fr)_minmax(0,3fr)] lg:items-stretch">
      {/* Primary: split text + image */}
      <div className="flex min-h-[min(14rem,40vh)] flex-col overflow-hidden rounded-2xl bg-white shadow-sm sm:min-h-56 sm:flex-row md:min-h-60">
        <div className="flex w-full flex-col items-center justify-center bg-linear-to-r from-neutral-100 to-neutral-50 px-6 py-6 text-center sm:w-3/5 sm:py-8 md:px-10">
          <h1 className="max-w-[20ch] font-serif text-2xl font-normal leading-snug tracking-tight text-foreground sm:max-w-[26ch] sm:text-3xl md:text-4xl">
            Give gifts crafted in Ethiopia
          </h1>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
            Handwoven tibs, pottery, leather goods & more—sold by makers from
            Addis Mercato to towns across the country.
          </p>
          <Button asChild variant="default" size="xl" className="mt-4 rounded-full px-8 text-sm font-normal sm:mt-5">
            <Link to="/">Meet the makers</Link>
          </Button>
        </div>
        <div className="relative min-h-40 w-full min-w-0 sm:w-2/5 sm:min-h-0">
          <img
            src={primaryCraftImage}
            alt="Colorful handwoven textiles and craft fibers"
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>
      </div>

      {/* Secondary: full-bleed image + overlay copy */}
      <div className="relative min-h-[min(14rem,40vh)] overflow-hidden rounded-2xl shadow-sm sm:min-h-56 md:min-h-60">
        <img
          src={coffeeCeremonyImage}
          alt="Traditional Ethiopian coffee ceremony with jebena and cups"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div
          className="absolute inset-0 bg-linear-to-t from-black/55 via-black/10 to-transparent"
          aria-hidden
        />
        <div className="absolute bottom-0 left-0 max-w-[95%] p-4 text-white sm:p-5">
          <p className="text-base font-semibold leading-snug sm:text-lg">
            Coffee ceremony sets & gifts from Ethiopian artisans
          </p>
          <Link
            to="/"
            className="mt-2 inline-block text-sm font-medium text-white underline underline-offset-4 transition-opacity hover:opacity-90"
          >
            Shop now
          </Link>
        </div>
      </div>
    </section>
  );
}
