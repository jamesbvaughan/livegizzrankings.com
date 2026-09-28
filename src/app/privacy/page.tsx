import type { Metadata } from "next";

import { Link } from "@/components/Link";
import { PageContent, PageTitle } from "@/components/ui";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <>
      <PageTitle>Privacy Policy</PageTitle>

      <PageContent className="prose prose-invert max-w-none space-y-8">
        <section className="space-y-4">
          <h2 className="text-3xl">Information We Collect</h2>

          <h3 className="text-2xl">Account Information</h3>
          <p>
            When you create an account using the site&apos;s authentication
            provider (
            <a
              href="https://clerk.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              Clerk
            </a>
            ), the site collects:
          </p>
          <ul className="list-disc space-y-2 pl-6">
            <li>Email address</li>
            <li>Name (if provided)</li>
            <li>
              Profile information from OAuth providers (Google, Apple) if you
              choose to sign in with them
            </li>
          </ul>

          <h3 className="text-2xl">Usage Data</h3>
          <p>The site collects information about how you interact with it:</p>
          <ul className="list-disc space-y-2 pl-6">
            <li>Voting history on performance comparisons</li>
            <li>Performances and shows you submit</li>
            <li>Nominations you submit</li>
          </ul>

          <h3 className="text-2xl">Technical Data</h3>
          <p>
            The site automatically collects certain technical information when
            you visit:
          </p>
          <ul className="list-disc space-y-2 pl-6">
            <li>IP address</li>
            <li>Browser type and version</li>
            <li>Device information</li>
            <li>Page load times and error reports (via Sentry)</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-3xl">Third-Party Services</h2>
          <p>The site uses the following third-party services:</p>

          <div className="space-y-4">
            <div>
              <h4 className="text-xl font-bold">Clerk (Authentication)</h4>
              <p className="text-muted">
                Manages user authentication and account data. See{" "}
                <a
                  href="https://clerk.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Clerk&apos;s Privacy Policy
                </a>
                .
              </p>
            </div>

            <div>
              <h4 className="text-xl font-bold">Vercel (Hosting)</h4>
              <p className="text-muted">
                Hosts the website and analytics. See{" "}
                <a
                  href="https://vercel.com/legal/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Vercel&apos;s Privacy Policy
                </a>
                .
              </p>
            </div>

            <div>
              <h4 className="text-xl font-bold">Sentry (Error Monitoring)</h4>
              <p className="text-muted">
                Monitors application errors and performance. See{" "}
                <a
                  href="https://sentry.io/privacy/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Sentry&apos;s Privacy Policy
                </a>
                .
              </p>
            </div>

            <div>
              <h4 className="text-xl font-bold">Resend (Email Service)</h4>
              <p className="text-muted">
                Sends email notifications and manages the mailing list. See{" "}
                <a
                  href="https://resend.com/legal/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Resend&apos;s Privacy Policy
                </a>
                .
              </p>
            </div>

            <div>
              <h4 className="text-xl font-bold">Neon (Database)</h4>
              <p className="text-muted">
                Stores application data. See{" "}
                <a
                  href="https://neon.tech/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Neon&apos;s Privacy Policy
                </a>
                .
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-3xl">Contact</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact
            me at{" "}
            <a href="mailto:james@livegizzrankings.com">
              james@livegizzrankings.com
            </a>
            .
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-3xl">Open Source</h2>
          <p>
            This website is open source. You can review the code and data
            practices on{" "}
            <Link href="https://github.com/jamesbvaughan/live-gizz-rankings">
              GitHub
            </Link>
            .
          </p>
        </section>

        <div className="pt-8">
          <Link href="/" className="no-underline">
            Back to Home
          </Link>
        </div>
      </PageContent>
    </>
  );
}
