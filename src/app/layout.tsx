// eslint-disable-next-line no-unassigned-import
import "./globals.css";

import { SpeedInsights } from "@vercel/speed-insights/next";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";
import Script from "next/script";

import BackgroundCanvas from "./BackgroundCanvas";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { SentryUserManager } from "./SentryUserManager";
import * as Sentry from "@sentry/nextjs";

const title = "Live Gizz Rankings";
const description =
  "Find the best live version of King Gizzard songs. Vote on your favorites and browse rankings based on the community's votes.";

export const metadata: Metadata = {
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

          {/* Vercel analytics */}
          <Analytics />

          {/* Vercel speed insights */}
          <SpeedInsights />

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
