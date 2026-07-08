import { eq, sql } from "drizzle-orm";
import type { Route } from "next";
import { notFound } from "next/navigation";

import { db } from "./drizzle/db";
import type { Performance, Show } from "./drizzle/schema";
import { nominations, performances, shows, songs } from "./drizzle/schema";
import { getPerformanceSlugBySongAndShow } from "./utils";

// =============================================================================
// SHOWS

export async function getShowById(showId: string) {
  const show = await db.query.shows.findFirst({ where: eq(shows.id, showId) });
  if (show == null) {
    notFound();
  }

  return show;
}

export async function getShowBySlug(showSlug: string) {
  const show = await db.query.shows.findFirst({
    where: eq(shows.slug, showSlug),
  });
  if (show == null) {
    notFound();
  }

  return show;
}

// =============================================================================
// PERFORMANCES

async function getPerformanceSlug(performance: Performance) {
  const song = await getSongById(performance.songId);
  const show = await getShowById(performance.showId);
  return getPerformanceSlugBySongAndShow(song, show);
}

export async function getPerformanceById(performanceId: string) {
  const performance = await db.query.performances.findFirst({
    where: eq(shows.id, performanceId),
    with: { song: true, show: true },
  });
  if (performance == null) {
    notFound();
  }

  return performance;
}

export async function getPerformanceBySlug(
  performanceSlug: string,
): Promise<Performance & { show: Show }> {
  const rows = await db
    .select({
      performance: performances,
      show: shows,
    })
    .from(performances)
    .innerJoin(songs, eq(songs.id, performances.songId))
    .innerJoin(shows, eq(shows.id, performances.showId))
    // Compare "<song-slug>-<show-slug>" to the provided composite (exact match)
    .where(sql`(${songs.slug} || '-' || ${shows.slug}) = ${performanceSlug}`)
    .limit(1);

  const row = rows[0];
  if (row == null) {
    notFound();
  }

  return {
    ...row.performance,
    show: row.show,
  };
}

export async function getPerformancePath(
  performanceOrPerformanceId: Performance | string,
) {
  const performance =
    typeof performanceOrPerformanceId === "string"
      ? await getPerformanceById(performanceOrPerformanceId)
      : performanceOrPerformanceId;

  const slug = await getPerformanceSlug(performance);
  return `/performances/${slug}` as Route;
}

// =============================================================================
// SONGS

export async function getSongById(songId: string) {
  const song = await db.query.songs.findFirst({ where: eq(shows.id, songId) });
  if (song == null) {
    notFound();
  }

  return song;
}

export async function getSongBySlug(songSlug: string) {
  const song = await db.query.songs.findFirst({
    where: eq(shows.slug, songSlug),
    with: { album: true },
  });
  if (song == null) {
    notFound();
  }

  return song;
}

// =============================================================================
// ALBUMS

export async function getAlbumBySlug(albumSlug: string) {
  const album = await db.query.albums.findFirst({
    where: eq(shows.slug, albumSlug),
  });
  if (album == null) {
    notFound();
  }

  return album;
}

// =============================================================================
// NOMINATIONS

export async function getNominationById(nominationId: string) {
  const nomination = await db.query.nominations.findFirst({
    where: eq(nominations.id, nominationId),
  });
  if (nomination == null) {
    notFound();
  }

  return nomination;
}
