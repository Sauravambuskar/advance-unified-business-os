import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useRef, type ReactNode } from "react";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { FrejunDialerWidget, FrejunWidgetContext, type FrejunWidgetRef } from "@/components/frejun-widget";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">Try refreshing or head back home.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Advance Business Suite — Business OS" },
      {
        name: "description",
        content:
          "Unified Business Operating System for Advance Group — manage CRM, leads, sales, invoicing, and operations across every company from one control tower.",
      },
      { name: "author", content: "Advance Group" },
      { property: "og:title", content: "Advance Business Suite — Business OS" },
      {
        property: "og:description",
        content:
          "Unified Business Operating System for Advance Group — manage CRM, leads, sales, invoicing, and operations across every company from one control tower.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Advance Business Suite — Business OS" },
      { name: "twitter:description", content: "Unified Business Operating System for Advance Group — manage CRM, leads, sales, invoicing, and operations across every company from one control tower." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/4e7cb915-7888-4238-a20b-310368995bdf/id-preview-7fdfb344--4ae3f947-f5d6-47c1-8215-cda96d4f2073.lovable.app-1783348476959.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/4e7cb915-7888-4238-a20b-310368995bdf/id-preview-7fdfb344--4ae3f947-f5d6-47c1-8215-cda96d4f2073.lovable.app-1783348476959.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const widgetRef = useRef<FrejunWidgetRef | null>(null);

  return (
    <QueryClientProvider client={queryClient}>
      {/* FreJun Dialer Widget — hidden iframe, stays mounted for entire session */}
      <FrejunWidgetContext.Provider value={widgetRef}>
        <FrejunDialerWidget
          ref={widgetRef}
          onCallEnded={() => {
            // Dispatch a custom DOM event so CallDialog can react
            window.dispatchEvent(new CustomEvent("frejun:call-ended"));
          }}
          onIncomingCall={() => {
            window.dispatchEvent(new CustomEvent("frejun:incoming-call"));
          }}
          onUnauthorized={(detail) => {
            console.warn("FreJun unauthorized:", detail);
          }}
        />
        <Outlet />
        <Toaster richColors position="top-right" />
      </FrejunWidgetContext.Provider>
    </QueryClientProvider>
  );
}
