import { currentUser } from "@clerk/nextjs/server";
import { and, count, eq, isNull } from "drizzle-orm";
import Link from "next/link";
import { Suspense } from "react";

import { db } from "@/drizzle/db";
import { activityLogs, activityLogReviews } from "@/drizzle/schema";

import { AccountButtons } from "./AccountButtons";

/**
 * The number of activity log entries the current user hasn't reviewed yet,
 * for admins' footers.
 *
 * This depends on the request's auth state, so it renders as a dynamic hole
 * in the otherwise-prerendered page and streams in at request time.
 */
async function UnreviewedLogCount() {
  // Deliberately not wrapped in a try/catch: during prerendering, this
  // rejects to signal that rendering should be deferred to request time, and
  // that rejection must propagate to React.
  const user = await currentUser();
  if (!user) {
    return null;
  }

  let unreviewedCount = null;
  try {
    const [result] = await db
      .select({ count: count() })
      .from(activityLogs)
      .leftJoin(
        activityLogReviews,
        and(
          eq(activityLogs.id, activityLogReviews.activityLogId),
          eq(activityLogReviews.userId, user.id),
        ),
      )
      .where(isNull(activityLogReviews.id));

    unreviewedCount = result?.count ?? null;
  } catch (error) {
    console.error("Error fetching unreviewed activity count:", error);
  }

  if (unreviewedCount == null || unreviewedCount === 0) {
    return null;
  }

  return <> ({unreviewedCount})</>;
}

function SiteButtons() {
  return (
    <div className="space-y-2">
      <div>
        made by <a href="https://jamesbvaughan.com">james</a>
      </div>

      <hr className="border-muted-2" />

      <div className="flex flex-col space-y-1">
        <Link href="/about" className="inline-block">
          about
        </Link>

        <Link href="/blog" className="inline-block">
          blog
        </Link>

        <Link href="/changelog" className="inline-block">
          changelog
        </Link>

        <Link href="/privacy" className="inline-block">
          privacy
        </Link>

        <a
          href="https://github.com/jamesbvaughan/live-gizz-rankings"
          className="inline-block"
        >
          source code
        </a>
      </div>
    </div>
  );
}

const unreviewedLogCountSlot = (
  <Suspense fallback={null}>
    <UnreviewedLogCount />
  </Suspense>
);

export function Footer() {
  return (
    <footer className="space-y-10">
      <hr className="border-red" />

      <div className="text-muted flex items-start justify-between space-x-2 leading-5">
        <SiteButtons />

        <AccountButtons unreviewedLogCountSlot={unreviewedLogCountSlot} />
      </div>
    </footer>
  );
}
