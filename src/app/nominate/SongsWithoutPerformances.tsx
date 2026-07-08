import { count, eq, lte } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import Image from "next/image";
import Link from "next/link";

import { db } from "@/drizzle/db";
import type { Album } from "@/drizzle/schema";
import { performances, songs } from "@/drizzle/schema";
import { songsNeverPlayedLive } from "@/songsNeverPlayedLive";
import { getAlbumPath, getSongPath } from "@/utils";

async function getSongsWithNPerformancesForAlbum(albumId: string, n: number) {
  "use cache";
  cacheTag("songs", "performances");
  cacheLife("hours");

  const performanceCount = count(performances.id);

  const rows = await db
    .select({
      song: songs,
      performanceCount,
    })
    .from(songs)
    .where(eq(songs.albumId, albumId))
    .leftJoin(performances, eq(performances.songId, songs.id))
    .groupBy(songs.id)
    .having(lte(performanceCount, n));

  return rows
    .map((row) => row.song)
    .filter((song) => !songsNeverPlayedLive.includes(song.title));
}

async function AlbumWithMissingPerformances({
  album,
  performanceCount,
}: {
  album: Album;
  performanceCount: number;
}) {
  const songsWithoutPerformances = await getSongsWithNPerformancesForAlbum(
    album.id,
    performanceCount,
  );
  if (songsWithoutPerformances.length === 0) {
    return null;
  }

  const albumPath = getAlbumPath(album);

  return (
    <div className="space-y-2">
      <div className="flex items-start space-x-2">
        <Link href={albumPath}>
          <Image
            className="shrink-0"
            src={album.imageUrl}
            alt={album.title}
            width={50}
            height={50}
          />
        </Link>

        <Link href={albumPath} className="no-underline">
          <h3 className="text-xl">{album.title}</h3>
        </Link>
      </div>

      <ul className="ml-4 list-disc">
        {songsWithoutPerformances.map((song) => (
          <li key={song.id}>
            <Link href={getSongPath(song)} className="no-underline">
              {song.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
async function getAllAlbums() {
  "use cache";
  cacheTag("albums");
  cacheLife("hours");

  const result = await db.query.albums.findMany();

  return result;
}

export async function SongsWithoutPerformances({
  performanceCount,
}: {
  performanceCount: number;
}) {
  const allAlbums = await getAllAlbums();
  const albums = allAlbums.toSorted(
    (a, b) =>
      new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime(),
  );

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {albums.map((album) => (
        <AlbumWithMissingPerformances
          key={album.id}
          album={album}
          performanceCount={performanceCount}
        />
      ))}
    </div>
  );
}
