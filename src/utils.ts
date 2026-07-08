import type { Route } from "next";

import type { Album, Show, Song } from "./drizzle/schema";

// =============================================================================
// SHOWS

export function getShowTitle(show: Show) {
  const date = new Date(show.date);
  const year = date.getFullYear() % 100;
  return `${show.location} '${year.toString()}`;
}

export function getShowPath(show: Show) {
  return `/shows/${show.slug}` as Route;
}

// =============================================================================
// PERFORMANCES

export function getPerformanceTitle(song: Song, show: Show) {
  const showTitle = getShowTitle(show);
  return `${song.title} ${showTitle}`;
}

export function getPerformanceSlugBySongAndShow(song: Song, show: Show) {
  return `${song.slug}-${show.slug}`;
}

export function getPerformancePathBySongAndShow(song: Song, show: Show) {
  const slug = getPerformanceSlugBySongAndShow(song, show);
  return `/performances/${slug}` as Route;
}

// =============================================================================
// SONGS

export function getSongPath(song: Song) {
  return `/songs/${song.slug}` as Route;
}

// =============================================================================
// ALBUMS

export function getAlbumPath(album: Album) {
  return `/albums/${album.slug}` as Route;
}
