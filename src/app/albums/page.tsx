import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import Image from "next/image";
import Link from "next/link";

import { AdminOnly } from "@/components/authGates";
import { BoxedButtonLink } from "@/components/BoxedButtonLink";
import { PageContent, PageTitle } from "@/components/ui";
import { db } from "@/drizzle/db";
import { getAlbumPath } from "@/utils";

export const metadata: Metadata = {
  title: "Albums",
  description: `Browse all of King Gizzard & The Lizard Wizard's albums on Live Gizz Rankings, a site for browsing and voting on the band's best live performances.`,
};

async function AlbumList() {
  "use cache";
  cacheTag("albums");
  cacheLife("hours");

  const allAlbums = await db.query.albums.findMany();

  const albumsByYear = Object.entries(
    Object.groupBy(allAlbums, (album) =>
      new Date(album.releaseDate).getFullYear(),
    ),
  ).toSorted(([yearA], [yearB]) => parseInt(yearB) - parseInt(yearA));

  return (
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
  );
}

export default function Albums() {
  return (
    <>
      <div className="flex items-center justify-between">
        <PageTitle>Albums</PageTitle>
        <AdminOnly>
          <BoxedButtonLink href="/albums/add">Add Album</BoxedButtonLink>
        </AdminOnly>
      </div>

      <AlbumList />
    </>
  );
}
