import Link from "next/link";
import { Suspense } from "react";

import { RecentShows } from "./RecentShows";
import { RecentVotes } from "./RecentVotes";

const loadingFallback = <div>Loading...</div>;

export default function HomePage() {
  return (
    <div className="space-y-12">
      <div className="space-y-4 text-lg">
        <p>
          The purpose of this site is to identify what the fan community
          believes to be King Gizzard &amp; The Lizard Wizard&apos;s best live
          performances of their songs.
        </p>

        <p>
          Use the links at the top of this page to browse the ranked
          performances by song, album, or show.
        </p>
      </div>

      <div className="flex justify-around">
        <Link
          prefetch={false}
          href="/rank"
          className="border-foreground hover:bg-foreground hover:text-background block border-2 px-6 py-6 text-center text-2xl no-underline"
        >
          vote on some performances
        </Link>
      </div>

      <div className="space-y-4">
        <h2 className="text-3xl">Recent votes</h2>

        <Suspense fallback={loadingFallback}>
          <RecentVotes />
        </Suspense>
      </div>

      <div className="space-y-4">
        <h2 className="text-3xl">Recent shows</h2>

        <Suspense fallback={loadingFallback}>
          <RecentShows />
        </Suspense>
      </div>
    </div>
  );
}
