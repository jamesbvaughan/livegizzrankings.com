// eslint-disable-next-line no-unassigned-import
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import * as Sentry from "@sentry/nextjs";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Suspense } from "react";

import BackgroundCanvas from "./BackgroundCanvas";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { SentryUserManager } from "./SentryUserManager";

const title = "Live Gizz Rankings";
const description =
  "Find the best live version of King Gizzard songs. Vote on your favorites and browse rankings based on the community's votes.";

export const metadata: Metadata = {
  metadataBase: "https://livegizzrankings.com",
  title: {
    template: `%s | ${title}`,
    default: title,
  },
  description,
  openGraph: {
    siteName: title,
  },
  other: {
    ...Sentry.getTraceData(),
  },
};

export const viewport: Viewport = {
  themeColor: "#0c0a09",
  colorScheme: "dark",
};

const clerkAppearance = { theme: dark };

const cloudflareAnalyticsToken = process.env.CLOUDFLARE_ANALYTICS_TOKEN;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-background text-foreground overflow-y-scroll">
        <ClerkProvider appearance={clerkAppearance}>
          <BackgroundCanvas />

          <div className="mx-auto max-w-[720px] px-4 pt-6 pb-10">
            <Header />

            <main className="mt-6 mb-12">{children}</main>

            <Footer />
          </div>

          <SentryUserManager />

          {/* The Vercel analytics and speed insights components read the
              search params internally, so they need their own Suspense
              boundaries to avoid bailing rendering of the whole page out to
              the client. */}
          <Suspense fallback={null}>
            <Analytics />
          </Suspense>

          <Suspense fallback={null}>
            <SpeedInsights />
          </Suspense>

          {/* Cloudflare analytics */}
          {cloudflareAnalyticsToken ? (
            <Script
              defer
              src="https://static.cloudflareinsights.com/beacon.min.js"
              data-cf-beacon={`{"token": "${cloudflareAnalyticsToken}"}`}
            />
          ) : null}
        </ClerkProvider>
      </body>
    </html>
  );
}
