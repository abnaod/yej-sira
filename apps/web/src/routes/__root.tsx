import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
} from "@tanstack/react-router";

import { RootLayout } from "@/components/shells";
import { NotFoundPage } from "@/features/shared";
import type { RouterContext } from "@/lib/router-context";

import appCss from "../styles/app.css?url";

export const Route = createRootRouteWithContext<RouterContext>()({
  notFoundComponent: NotFoundPage,
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      { title: "YEJSIRA" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-dvh antialiased">
        <RootLayout>{children}</RootLayout>
        <Scripts />
      </body>
    </html>
  );
}
