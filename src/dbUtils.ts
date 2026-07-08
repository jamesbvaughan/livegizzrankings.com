import { eq, sql } from "drizzle-orm";
import type { Route } from "next";
import { cacheLife, cacheTag } from "next/cache";
import { notFound } from "next/navigation";

import { db } from "./drizzle/db";
import type { Performance, Show } from "./drizzle/schema";
import {
  albums,
  nominations,
  performances,
  shows,
  songs,
} from "./drizzle/schema";
import { getPerformanceSlugBySongAndShow } from "./utils";

// =============================================================================
// SHOWS

async function findShowById(showId: string) {
  "use cache";
  cacheTag("shows");
  cacheLife("hours");

  const result = await db.query.shows.findFirst({
    where: eq(shows.id, showId),
  });

  return result;
}

export async function getShowById(showId: string) {
  const show = await findShowById(showId);
  if (show == null) {
    notFound();
  }

  return show;
}

async function findShowBySlug(showSlug: string) {
  "use cache";
  cacheTag("shows");
  cacheLife("hours");

  const result = await db.query.shows.findFirst({
    where: eq(shows.slug, showSlug),
  });

  return result;
}

export async function getShowBySlug(showSlug: string) {
  const show = await findShowBySlug(showSlug);
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

async function findPerformanceById(performanceId: string) {
  "use cache";
  // Includes joined song and show rows, so all three tags apply.
  cacheTag("performances", "songs", "shows");
  cacheLife("hours");

  const result = await db.query.performances.findFirst({
    where: eq(performances.id, performanceId),
    with: { song: true, show: true },
  });

  return result;
}

export async function getPerformanceById(performanceId: string) {
  const performance = await findPerformanceById(performanceId);
  if (performance == null) {
    notFound();
  }

  return performance;
}

async function findPerformanceBySlug(performanceSlug: string) {
  "use cache";
  cacheTag("performances");
  cacheLife("hours");

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

  return rows[0] ?? null;
}

export async function getPerformanceBySlug(
  performanceSlug: string,
): Promise<Performance & { show: Show }> {
  const row = await findPerformanceBySlug(performanceSlug);
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

async function findSongById(songId: string) {
  "use cache";
  cacheTag("songs");
  cacheLife("hours");

  const result = await db.query.songs.findFirst({
    where: eq(songs.id, songId),
  });

  return result;
}

export async function getSongById(songId: string) {
  const song = await findSongById(songId);
  if (song == null) {
    notFound();
  }

  return song;
}

async function findSongBySlug(songSlug: string) {
  "use cache";
  // Includes the joined album row, so both tags apply.
  cacheTag("songs", "albums");
  cacheLife("hours");

  const result = await db.query.songs.findFirst({
    where: eq(songs.slug, songSlug),
    with: { album: true },
  });

  return result;
}

export async function getSongBySlug(songSlug: string) {
  const song = await findSongBySlug(songSlug);
  if (song == null) {
    notFound();
  }

  return song;
}

// =============================================================================
// ALBUMS

async function findAlbumBySlug(albumSlug: string) {
  "use cache";
  cacheTag("albums");
  cacheLife("hours");

  const result = await db.query.albums.findFirst({
    where: eq(albums.slug, albumSlug),
  });

  return result;
}

export async function getAlbumBySlug(albumSlug: string) {
  const album = await findAlbumBySlug(albumSlug);
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
