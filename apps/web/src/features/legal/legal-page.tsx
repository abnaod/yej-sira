import * as React from "react";

import { cn } from "@/lib/utils";

export type LegalSection = {
  heading?: string;
  body: React.ReactNode;
};

export type LegalPageProps = {
  title: string;
  updatedAt: string;
  intro?: React.ReactNode;
  sections: LegalSection[];
  className?: string;
};

export function LegalPage({ title, updatedAt, intro, sections, className }: LegalPageProps) {
  return (
    <main
      className={cn(
        "mx-auto w-full max-w-3xl px-4 py-10 md:py-14",
        className,
      )}
    >
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: {updatedAt}</p>
      {intro ? <div className="prose prose-sm mt-6 max-w-none">{intro}</div> : null}
      <div className="mt-8 space-y-6">
        {sections.map((s, i) => (
          <section key={i} className="space-y-2">
            {s.heading ? (
              <h2 className="text-lg font-semibold tracking-tight">{s.heading}</h2>
            ) : null}
            <div className="prose prose-sm max-w-none text-muted-foreground">{s.body}</div>
          </section>
        ))}
      </div>
    </main>
  );
}
