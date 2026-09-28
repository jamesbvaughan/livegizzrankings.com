import { and, eq, ne } from "drizzle-orm";

import { db } from "@/drizzle/db";
import { performances } from "@/drizzle/schema";
import type { Show, Song } from "@/drizzle/schema";
import { getShowTitle } from "@/utils";

/**
 * Names a performance precisely enough to tell apart shows in the same city
 * and year, like two nights in New York.
 */
function describePerformance(song: Song, show: Show) {
  const date = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(show.date));

  return `${song.title} at ${getShowTitle(show)} (${date})`;
}

/**
 * Checks a performance's streaming sources against the unique constraints on
 * the performances table, and returns an error message naming the performance
 * that already uses them, if any.
 *
 * `excludePerformanceId` is the performance being edited, which is allowed to
 * keep its own sources.
 */
export async function findStreamingSourceConflict({
  bandcampTrackId,
  youtubeVideoId,
  youtubeVideoStartTime,
  excludePerformanceId,
}: {
  bandcampTrackId: string | undefined;
  youtubeVideoId: string | undefined;
  youtubeVideoStartTime: number | undefined;
  excludePerformanceId?: string;
}): Promise<string | null> {
  const notExcluded = excludePerformanceId
    ? ne(performances.id, excludePerformanceId)
    : undefined;

  // Postgres treats NULLs as distinct in unique constraints, so a video
  // without a start time never conflicts.
  if (youtubeVideoId && youtubeVideoStartTime != null) {
    const conflict = await db.query.performances.findFirst({
      where: and(
        eq(performances.youtubeVideoId, youtubeVideoId),
        eq(performances.youtubeVideoStartTime, youtubeVideoStartTime),
        notExcluded,
      ),
      with: { song: true, show: true },
    });
    if (conflict) {
      return `That YouTube video and start time are already used by ${describePerformance(conflict.song, conflict.show)}.`;
    }
  }

  if (bandcampTrackId) {
    const conflict = await db.query.performances.findFirst({
      where: and(
        eq(performances.bandcampTrackId, bandcampTrackId),
        notExcluded,
      ),
      with: { song: true, show: true },
    });
    if (conflict) {
      return `That Bandcamp track is already used by ${describePerformance(conflict.song, conflict.show)}.`;
    }
  }

  return null;
}
