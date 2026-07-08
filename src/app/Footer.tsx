import { currentUser } from "@clerk/nextjs/server";
import { and, count, eq, isNull } from "drizzle-orm";
import Link from "next/link";

import { db } from "@/drizzle/db";
import { activityLogs, activityLogReviews } from "@/drizzle/schema";

import { AccountButtons } from "./AccountButtons";

async function getUnreviewedLogCount() {
  let unreviewedCount = null;

  try {
    const user = await currentUser();
    if (user) {
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
    }
  } catch (error) {
    console.error("Error fetching unreviewed activity count:", error);
  }

  return unreviewedCount;
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

export function Footer() {
  const unreviewedLogCountPromise = getUnreviewedLogCount();
  return (
    <footer className="space-y-10">
      <hr className="border-red" />

      <div className="text-muted flex items-start justify-between space-x-2 leading-5">
        <SiteButtons />

        <AccountButtons unreviewedLogCountPromise={unreviewedLogCountPromise} />
      </div>
    </footer>
  );
}
