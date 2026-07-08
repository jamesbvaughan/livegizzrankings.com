import { desc } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import Image from "next/image";
import Link from "next/link";

import { db } from "@/drizzle/db";
import { shows } from "@/drizzle/schema";
import { getShowPath, getShowTitle } from "@/utils";

export async function RecentShows() {
  "use cache";
  cacheTag("shows");
  cacheLife("hours");

  const recentShows = await db.query.shows.findMany({
    orderBy: desc(shows.date),
    limit: 5,
  });

  return (
    <div className="space-y-2">
      {recentShows.map((show) => {
        const showTitle = getShowTitle(show);
        const showPath = getShowPath(show);

        return (
          <div key={show.id} className="flex items-start space-x-2">
            <Link href={showPath} className="shrink-0">
              <Image
                src={show.imageUrl}
                alt={showTitle}
                height={60}
                width={60}
              />
            </Link>

            <div className="text-lg leading-6">
              <Link href={showPath} className="font-bold no-underline">
                {showTitle}
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
