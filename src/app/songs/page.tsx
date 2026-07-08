import { asc, desc } from "drizzle-orm";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { isAdmin } from "@/auth/utils";
import { BoxedButtonLink } from "@/components/BoxedButtonLink";
import { SongRow } from "@/components/SongRow";
import { PageContent, PageTitle } from "@/components/ui";
import { db } from "@/drizzle/db";
import { albums, songs } from "@/drizzle/schema";
import { getAlbumPath } from "@/utils";

export const metadata: Metadata = {
  title: "Songs",
};

export default async function Songs() {
  const [allAlbums, adminStatus] = await Promise.all([
    db.query.albums.findMany({
      orderBy: desc(albums.releaseDate),
      with: {
        songs: {
          orderBy: asc(songs.albumPosition),
          with: {
            performances: true,
          },
        },
      },
    }),
    isAdmin(),
  ]);

  return (
    <>
      <div className="flex items-center justify-between">
        <PageTitle>All songs</PageTitle>
        {adminStatus && (
          <BoxedButtonLink href="/songs/add">Add Song</BoxedButtonLink>
        )}
      </div>

      <PageContent>
        <p>
          All the songs that have ranked performances, along with their top
          ranked performances
        </p>

        <div className="mt-6 space-y-8">
          {allAlbums.map((album) => {
            const albumPath = getAlbumPath(album);

            return (
              <div key={album.id} className="space-y-4">
                <Link
                  href={albumPath}
                  className="flex items-start space-x-2 text-2xl no-underline"
                >
                  <Image
                    className="shrink-0"
                    src={album.imageUrl}
                    alt={album.title}
                    width={50}
                    height={50}
                  />

                  <div>{album.title}</div>
                </Link>

                <div className="space-y-2">
                  {album.songs.map((song) => {
                    return <SongRow key={song.id} song={song} />;
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </PageContent>
    </>
  );
}
