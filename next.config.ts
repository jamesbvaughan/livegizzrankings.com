import bundleAnalyzer from "@next/bundle-analyzer";
import createMDX from "@next/mdx";
import type { SentryBuildOptions } from "@sentry/nextjs";
import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    authInterrupts: true,
  },
  cacheComponents: true,
  typedRoutes: true,
  pageExtensions: ["js", "jsx", "ts", "tsx", "md", "mdx"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "f4.bcbits.com",
      },
      {
        protocol: "https",
        hostname: "ia801002.us.archive.org",
      },
    ],
  },
  // eslint-disable-next-line require-await
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: cspHeaderValue,
          },
        ],
      },
    ];
  },
};

const withMDX = createMDX({});

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const sentryConfig: SentryBuildOptions = {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  org: "live-gizz-rankings",
  project: "live-gizz-rankings-nextjs",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/monitoring",

  webpack: {
    // Automatically annotate React components to show their full name in breadcrumbs and session replay
    reactComponentAnnotation: {
      enabled: true,
    },

    // Automatically tree-shake Sentry logger statements to reduce bundle size
    treeshake: {
      removeDebugLogging: true,
    },

    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,
  },
};

export default withBundleAnalyzer(
  withSentryConfig(withMDX(nextConfig), sentryConfig),
);

// The following sections define the Content Security Policy (CSP) header for
// the app.
//
// Docs:
//   - Next.js: https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy
//   - MDN: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy

const scriptSources = [
  // For the YouTube embed
  "https://cdn.jsdelivr.net",
  "https://www.youtube.com",

  // Prod auth
  "https://clerk.livegizzrankings.com",

  // Dev auth
  "https://related-molly-28.clerk.accounts.dev",
  "https://related-molly-28.accounts.dev",

  // Vercel Analytics
  "https://va.vercel-scripts.com",

  // Vercel toolbar
  "https://vercel.live",

  // Vercel toolbar
  "https://js.sentry-cdn.com",

  // Cloudflare Analytics
  "https://static.cloudflareinsights.com",
];

const connectSources = [
  // Dev auth
  "https://related-molly-28.clerk.accounts.dev",
  "https://related-molly-28.accounts.dev",

  // Prod auth
  "https://clerk.livegizzrankings.com",
  "https://accounts.livegizzrankings.com",

  // Cloudflare Analytics
  "https://cloudflareinsights.com",
];

const frameSources = [
  // Bandcamp embeds
  "https://bandcamp.com",

  // Spotify embeds
  "https://open.spotify.com",

  // YouTube embeds
  "https://www.youtube.com",
  "https://www.youtube-nocookie.com",

  // Apple Music embeds
  "https://embed.music.apple.com",

  // Vercel toolbar
  "https://vercel.live",
];

const imageSources = [
  // For the YouTube embed
  "https://i.ytimg.com",

  // Avatar images
  "https://img.clerk.com",

  // Bandcamp album images
  "https://f4.bcbits.com",
];

const styleSources = [
  // For the YouTube embed
  "https://cdn.jsdelivr.net",
];

const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline' blob: ${scriptSources.join(" ")};
  connect-src 'self' ${connectSources.join(" ")};
  style-src 'self' 'unsafe-inline' ${styleSources.join(" ")};
  frame-src 'self' ${frameSources.join(" ")};
  img-src 'self' data: ${imageSources.join(" ")};
  font-src 'self';
  object-src 'self' data:;
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`;

// eslint-disable-next-line prefer-string-replace-all
const cspHeaderValue = cspHeader.replace(/\n/gu, "");
