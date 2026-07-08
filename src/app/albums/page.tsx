import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { isAdmin } from "@/auth/utils";
import { BoxedButtonLink } from "@/components/BoxedButtonLink";
import { PageContent, PageTitle } from "@/components/ui";
import { db } from "@/drizzle/db";
import { getAlbumPath } from "@/utils";

export const metadata: Metadata = {
  title: "Albums",
  description: `Browse all of King Gizzard & The Lizard Wizard's albums on Live Gizz Rankings, a site for browsing and voting on the band's best live performances.`,
};

export default async function Albums() {
  const [allAlbums, adminStatus] = await Promise.all([
    db.query.albums.findMany(),
    isAdmin(),
  ]);

  const albumsByYear = Object.entries(
    Object.groupBy(allAlbums, (album) =>
      new Date(album.releaseDate).getFullYear(),
    ),
  ).toSorted(([yearA], [yearB]) => parseInt(yearB) - parseInt(yearA));

  return (
    <>
      <div className="flex items-center justify-between">
        <PageTitle>Albums</PageTitle>
        {adminStatus && (
          <BoxedButtonLink href="/albums/add">Add Album</BoxedButtonLink>
        )}
      </div>

      <PageContent className="space-y-8">
        {albumsByYear.map(([year, albums]) => {
          albums!.sort(
            (a, b) =>
              new Date(b.releaseDate).getTime() -
              new Date(a.releaseDate).getTime(),
          );

          return (
            <div key={year} className="space-y-4">
              <h2 className="text-2xl">{year}</h2>

              <div className="grid grid-cols-3 gap-4">
                {albums!.map((album) => {
                  const albumPath = getAlbumPath(album);

                  return (
                    <Link
                      key={album.id}
                      href={albumPath}
                      className="space-y-1 no-underline"
                    >
                      <Image
                        src={album.imageUrl}
                        alt={`Album cover for ${album.title}`}
                        className="aspect-square w-full"
                        width={500}
                        height={500}
                      />
                      <div className="text-lg font-semibold">{album.title}</div>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </PageContent>
    </>
  );
}
