import type { Metadata } from "next";
import { Suspense } from "react";

import { ensureAdmin } from "@/auth/utils";
import { PageContent, PageTitle } from "@/components/ui";
import { InvalidBandcampIds } from "./InvalidBandcampIds";
import { MissingBandcampTrackIds } from "./MissingBandcampTrackIds";

export const metadata: Metadata = {
  title: "Needs Work",
  description: "Database entries that need attention",
};

export const dynamic = "force-dynamic";

const loadingFallback = <div className="text-muted">Loading...</div>;

export default async function NeedsWorkPage() {
  await ensureAdmin();

  return (
    <>
      <PageTitle>Needs Work</PageTitle>

      <PageContent className="space-y-8">
        <p className="text-muted">
          Database entries that need attention or cleanup
        </p>

        <Suspense fallback={loadingFallback}>
          <InvalidBandcampIds />
        </Suspense>

        <Suspense fallback={loadingFallback}>
          <MissingBandcampTrackIds />
        </Suspense>
      </PageContent>
    </>
  );
}
