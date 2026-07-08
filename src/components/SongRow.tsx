import { count, desc, eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import Image from "next/image";
import Link from "next/link";
import pluralize from "pluralize";
import { Suspense } from "react";

import { db } from "@/drizzle/db";
import type { Song } from "@/drizzle/schema";
import { performances, votes } from "@/drizzle/schema";
import { songsNeverPlayedLive } from "@/songsNeverPlayedLive";
import {
  getPerformancePathBySongAndShow,
  getShowTitle,
  getSongPath,
} from "@/utils";

import { AdminOnly } from "./authGates";

async function VoteCount({ song }: { song: Song }) {
  "use cache";
  cacheTag("votes");
  cacheLife("hours");

  const [songVotes] = await db
    .select({ songId: performances.songId, voteCount: count(votes.id) })
    .from(votes)
    .leftJoin(performances, eq(votes.winnerId, performances.id))
    .having(({ songId }) => eq(songId, song.id))
    .groupBy(({ songId }) => songId);

  const voteCount = songVotes?.voteCount ?? 0;

  return <> - {voteCount} votes</>;
}

async function TopPerformance({ song }: { song: Song }) {
  "use cache";
  cacheTag("performances", "shows");
  cacheLife("hours");

  const performance = await db.query.performances.findFirst({
    where: eq(performances.songId, song.id),
    orderBy: desc(performances.eloRating),
    with: { show: true },
  });
  if (performance == null) {
    return null;
  }

  const showTitle = getShowTitle(performance.show);
  const performancePath = getPerformancePathBySongAndShow(
    song,
    performance.show,
  );

  return (
    <Link
      href={performancePath}
      className="text-muted flex items-start space-x-2 text-right no-underline"
    >
      <div>Top: {showTitle}</div>

      {performance.show.imageUrl ? (
        <Image
          className="shrink-0"
          src={performance.show.imageUrl}
          alt={showTitle}
          width={24}
          height={24}
        />
      ) : null}
    </Link>
  );
}

const loadingTopPerformanceFallback = (
  <span className="text-right">Loading top performance...</span>
);

async function getSongPerformances(songId: string) {
  "use cache";
  cacheTag("performances");
  cacheLife("hours");

  const result = await db.query.performances.findMany({
    where: eq(performances.songId, songId),
  });

  return result;
}

export async function SongRow({ song }: { song: Song }) {
  const songPerformances = await getSongPerformances(song.id);

  const songPath = getSongPath(song);

  return (
    <div className="flex items-baseline space-x-1">
      <div className="text-muted w-6 text-right">{song.albumPosition}.</div>

      <div className="grow">
        <Link href={songPath} className="text-lg no-underline">
          {song.title}
        </Link>

        <div className="text-muted flex justify-between space-x-2">
          {songPerformances.length === 0 ? (
            songsNeverPlayedLive.includes(song.title) ? (
              <span>They haven&apos;t played this live yet!</span>
            ) : (
              <span>
                No performances added yet -{" "}
                <Link href="/performances/add">add one</Link>!
              </span>
            )
          ) : (
            <>
              <div className="shrink-0">
                {pluralize("performance", songPerformances.length, true)}

                <AdminOnly>
                  <VoteCount song={song} />
                </AdminOnly>
              </div>

              <Suspense fallback={loadingTopPerformanceFallback}>
                <TopPerformance song={song} />
              </Suspense>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
